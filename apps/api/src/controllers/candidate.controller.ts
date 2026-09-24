import path from "node:path";
import { access } from "node:fs/promises";
import { z } from "zod";
import { env } from "../config/env.js";
import { Candidate } from "../models/Candidate.js";
import { Vacancy } from "../models/Vacancy.js";
import { createAnalysisRequestId, dispatchCVAnalysis } from "../services/n8n.service.js";
import { assertFeatureEnabled } from "../services/feature.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getTenantId } from "../utils/tenant.js";

const candidateSchema = z.object({
  vacancyId: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  cvText: z.string().max(100000).optional(),
});

export const listCandidates = asyncHandler(async (req, res) => {
  const tenant = getTenantId(req);
  const vacancyId = z.string().optional().parse(req.query.vacancyId);
  const filter: Record<string, unknown> = { tenant };
  if (vacancyId) filter.vacancy = vacancyId;
  res.json({ data: await Candidate.find(filter).populate("vacancy", "title status").sort({ createdAt: -1 }).lean() });
});

export const getCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne({ _id: req.params.candidateId, tenant: getTenantId(req) }).populate("vacancy").lean();
  if (!candidate) throw new ApiError(404, "Candidate not found");
  res.json({ data: candidate });
});

export const downloadCandidateDocumentForTenant = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne({ _id: req.params.candidateId, tenant: getTenantId(req) }).lean();
  if (!candidate) throw new ApiError(404, "Candidate not found");
  if (!candidate.sourceDocument?.url) throw new ApiError(404, "Candidate has no CV document");

  const fileName = candidate.sourceDocument.url.split(/[\\/]/).pop();
  if (!fileName) throw new ApiError(404, "Candidate CV document not found");
  const filePath = path.resolve(process.cwd(), "uploads", fileName);
  try {
    await access(filePath);
  } catch {
    throw new ApiError(404, "CV document is no longer available on this server");
  }
  res.download(filePath, candidate.sourceDocument.originalName || fileName);
});

export const createCandidate = asyncHandler(async (req, res) => {
  const tenant = getTenantId(req);
  const input = candidateSchema.parse(req.body);
  const vacancy = await Vacancy.findOne({ _id: input.vacancyId, tenant });
  if (!vacancy) throw new ApiError(422, "The selected vacancy does not exist in this tenant");
  if (!input.cvText && !req.file) throw new ApiError(422, "Provide cvText or a CV document");

  const sourceDocument = req.file ? {
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    url: req.file.filename,
  } : undefined;
  if (req.file) await assertFeatureEnabled(tenant, "cvDocumentUpload");
  const candidate = await Candidate.create({ ...input, tenant, vacancy: vacancy._id, sourceDocument });
  res.status(201).json({ data: candidate });
});

export const requestAnalysis = asyncHandler(async (req, res) => {
  const tenant = getTenantId(req);
  const candidate = await Candidate.findOne({ _id: req.params.candidateId, tenant }).populate("vacancy");
  if (!candidate) throw new ApiError(404, "Candidate not found");
  const vacancy = candidate.vacancy as unknown as { _id: unknown; title: string; department: string; location: string; workType: "full_time" | "part_time" | "contract" | "remote"; salaryMin?: number; salaryMax?: number; description: string; requirements: string[] };
  if (!candidate.cvText && !candidate.sourceDocument?.url) throw new ApiError(422, "Candidate has no CV content to analyze");

  const requestId = createAnalysisRequestId();
  candidate.analysis = { status: "queued", requestId, requestedAt: new Date(), securityFlags: [], strengths: [], gaps: [] };
  await candidate.save();

  try {
    await dispatchCVAnalysis({
      requestId,
      tenantId: tenant,
      candidateId: String(candidate._id),
      vacancyId: String(vacancy._id),
      candidate: { name: candidate.name, email: candidate.email, phone: candidate.phone ?? undefined, cvText: candidate.cvText ?? undefined, documentUrl: candidate.sourceDocument ? `${env.API_PUBLIC_URL}/api/v1/integrations/n8n/candidates/${candidate._id}/document` : undefined },
      vacancy: { title: vacancy.title, department: vacancy.department, location: vacancy.location, workType: vacancy.workType, salaryMin: vacancy.salaryMin, salaryMax: vacancy.salaryMax, description: vacancy.description, requirements: vacancy.requirements },
      callbackUrl: `${env.API_PUBLIC_URL}/api/v1/integrations/n8n/cv-analysis/callback`,
    });
  } catch (error) {
    const analysis = candidate.analysis;
    if (analysis) {
      analysis.status = "failed";
      analysis.error = error instanceof Error ? error.message : "Unable to queue analysis";
    }
    await candidate.save();
    throw error;
  }

  res.status(202).json({ data: candidate, message: "CV analysis queued" });
});

const callbackSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["completed", "failed"]),
  isValidCV: z.boolean().optional(),
  confidence: z.number().min(0).max(1).optional(),
  securityStatus: z.enum(["clean", "prompt_injection_detected", "not_a_cv", "needs_review"]).optional(),
  securityFlags: z.array(z.string().max(500)).max(30).optional(),
  score: z.number().min(0).max(100).optional(),
  summary: z.string().max(5000).optional(),
  strengths: z.array(z.string().max(500)).max(30).optional(),
  gaps: z.array(z.string().max(500)).max(30).optional(),
  recommendation: z.enum(["advance", "review", "reject"]).optional(),
  error: z.string().max(2000).optional(),
  rawResponse: z.unknown().optional(),
});

export const receiveAnalysisCallback = asyncHandler(async (req, res) => {
  if (req.header("x-n8n-callback-secret") !== env.N8N_CALLBACK_SECRET) {
    throw new ApiError(401, "Invalid n8n callback secret");
  }
  const input = callbackSchema.parse(req.body);
  const candidate = await Candidate.findOne({ "analysis.requestId": input.requestId });
  if (!candidate) throw new ApiError(404, "Analysis request not found");

  const analysis = candidate.analysis;
  if (!analysis) throw new ApiError(409, "Candidate analysis state is missing");
  analysis.status = input.status;
  analysis.isValidCV = input.isValidCV;
  analysis.confidence = input.confidence;
  analysis.securityStatus = input.securityStatus;
  analysis.securityFlags = input.securityFlags ?? [];
  analysis.score = input.score;
  analysis.summary = input.summary;
  analysis.strengths = input.strengths ?? [];
  analysis.gaps = input.gaps ?? [];
  analysis.recommendation = input.recommendation;
  analysis.error = input.error;
  analysis.rawResponse = input.rawResponse;
  analysis.completedAt = new Date();
  await candidate.save();
  res.json({ data: { candidateId: String(candidate._id), status: analysis.status } });
});

export const downloadCandidateDocument = asyncHandler(async (req, res) => {
  if (!env.N8N_OUTBOUND_TOKEN || req.header("x-rhia-workflow-token") !== env.N8N_OUTBOUND_TOKEN) {
    throw new ApiError(401, "Invalid n8n workflow token");
  }
  const candidate = await Candidate.findById(req.params.candidateId).lean();
  if (!candidate?.sourceDocument?.url) throw new ApiError(404, "Candidate document not found");
  const fileName = candidate.sourceDocument.url.split(/[\\/]/).pop();
  if (!fileName) throw new ApiError(404, "Candidate document not found");
  res.type(candidate.sourceDocument.mimeType ?? "application/octet-stream");
  res.sendFile(fileName, { root: path.resolve(process.cwd(), "uploads") });
});
