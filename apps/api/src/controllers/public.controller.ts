import { z } from "zod";
import { env } from "../config/env.js";
import { Candidate } from "../models/Candidate.js";
import { Tenant } from "../models/Tenant.js";
import { Vacancy } from "../models/Vacancy.js";
import { getTenantFeatures } from "../services/feature.service.js";
import { createAnalysisRequestId, dispatchCVAnalysis } from "../services/n8n.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const paramsSchema = z.object({ companySlug: z.string().regex(/^[a-z0-9-]{2,60}$/), publicId: z.string().uuid() });
const applicationSchema = z.object({ name: z.string().min(2).max(120), email: z.string().email(), phone: z.string().max(40).optional(), cvText: z.string().max(100000).optional() });

async function findPublicVacancy(companySlug: string, publicId: string) {
  const tenant = await Tenant.findOne({ slug: companySlug, status: "active" });
  if (!tenant) throw new ApiError(404, "Vacancy not found");
  const vacancy = await Vacancy.findOne({ tenant: tenant._id, publicId, status: "published" });
  if (!vacancy) throw new ApiError(404, "Vacancy not found");
  return { tenant, vacancy };
}

export const getPublicVacancy = asyncHandler(async (req, res) => {
  const { companySlug, publicId } = paramsSchema.parse(req.params);
  const { tenant, vacancy } = await findPublicVacancy(companySlug, publicId);
  res.json({ data: { company: tenant.name, vacancy: { id: vacancy.publicId, title: vacancy.title, department: vacancy.department, location: vacancy.location, workType: vacancy.workType, salaryMin: vacancy.salaryMin, salaryMax: vacancy.salaryMax, description: vacancy.description, requirements: vacancy.requirements } } });
});

export const submitPublicApplication = asyncHandler(async (req, res) => {
  const { companySlug, publicId } = paramsSchema.parse(req.params);
  const input = applicationSchema.parse(req.body);
  if (!req.file && !input.cvText) throw new ApiError(422, "Attach a CV document or provide CV text");
  const { tenant, vacancy } = await findPublicVacancy(companySlug, publicId);
  const sourceDocument = req.file ? { originalName: req.file.originalname, mimeType: req.file.mimetype, url: req.file.filename } : undefined;
  const candidate = await Candidate.create({ ...input, tenant: tenant._id, vacancy: vacancy._id, sourceDocument });

  const { features } = await getTenantFeatures(String(tenant._id));
  if (features.cvAnalyzer) {
    const requestId = createAnalysisRequestId();
    candidate.analysis = { status: "queued", requestId, requestedAt: new Date(), securityFlags: [], strengths: [], gaps: [] };
    await candidate.save();
    try {
      await dispatchCVAnalysis({
        requestId,
        tenantId: String(tenant._id),
        candidateId: String(candidate._id),
        vacancyId: String(vacancy._id),
        candidate: { name: candidate.name, email: candidate.email, phone: candidate.phone ?? undefined, cvText: candidate.cvText ?? undefined, documentUrl: candidate.sourceDocument ? `${env.API_PUBLIC_URL}/api/v1/integrations/n8n/candidates/${candidate._id}/document` : undefined },
        vacancy: { title: vacancy.title, department: vacancy.department, location: vacancy.location, workType: vacancy.workType, salaryMin: vacancy.salaryMin ?? undefined, salaryMax: vacancy.salaryMax ?? undefined, description: vacancy.description, requirements: vacancy.requirements },
        callbackUrl: `${env.API_PUBLIC_URL}/api/v1/integrations/n8n/cv-analysis/callback`,
      });
    } catch (error) {
      const analysis = candidate.analysis;
      if (analysis) {
        analysis.status = "failed";
        analysis.error = error instanceof Error ? error.message : "Unable to queue analysis";
      }
      await candidate.save();
    }
  }

  res.status(201).json({ data: { applicationId: String(candidate._id), analysisStatus: candidate.analysis?.status ?? "not_requested" }, message: "Application received successfully" });
});
