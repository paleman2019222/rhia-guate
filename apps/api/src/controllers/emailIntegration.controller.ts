import { randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { env } from "../config/env.js";
import { Candidate } from "../models/Candidate.js";
import { Tenant } from "../models/Tenant.js";
import { Vacancy } from "../models/Vacancy.js";
import { assertFeatureEnabled } from "../services/feature.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const companySchema = z.object({ companySlug: z.string().regex(/^[a-z0-9-]{2,60}$/) });
const lookupSchema = z.object({ title: z.string().trim().min(2).max(160) });
const resultSchema = z.object({
  messageId: z.string().trim().min(1).max(255),
  vacancyId: z.string().regex(/^[0-9a-f]{24}$/i),
  candidate: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email(),
    phone: z.string().trim().max(40).optional(),
    cvText: z.string().trim().min(20).max(100000),
  }).strict(),
  analysis: z.object({
    isValidCV: z.boolean(),
    securityStatus: z.enum(["clean", "prompt_injection_detected", "not_a_cv", "needs_review"]),
    securityFlags: z.array(z.string().max(500)).max(30),
    confidence: z.number().min(0).max(1),
    score: z.number().min(0).max(100),
    summary: z.string().min(1).max(5000),
    strengths: z.array(z.string().max(500)).max(30),
    gaps: z.array(z.string().max(500)).max(30),
    recommendation: z.enum(["advance", "review", "reject"]),
  }).strict(),
}).strict();

function matchesSecret(actual: string | undefined, expected: string | undefined) {
  if (!actual || !expected) return false;
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

async function resolveCompany(companySlug: string) {
  const tenant = await Tenant.findOne({ slug: companySlug, status: "active" });
  if (!tenant) throw new ApiError(404, "Company not found");
  await assertFeatureEnabled(String(tenant._id), "cvAnalyzer");
  return tenant;
}

export const lookupEmailVacancy = asyncHandler(async (req, res) => {
  if (!matchesSecret(req.header("x-rhia-workflow-token"), env.N8N_OUTBOUND_TOKEN)) {
    throw new ApiError(401, "Invalid n8n workflow token");
  }
  const { companySlug } = companySchema.parse(req.params);
  const { title } = lookupSchema.parse(req.query);
  const tenant = await resolveCompany(companySlug);
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const vacancies = await Vacancy.find({
    tenant: tenant._id,
    status: "published",
    title: { $regex: `^${escapedTitle}$`, $options: "i" },
  }).limit(2).lean();
  if (vacancies.length === 0) throw new ApiError(404, "Published vacancy not found");
  if (vacancies.length > 1) throw new ApiError(409, "More than one published vacancy has this title; use unique titles for email applications");

  const vacancy = vacancies[0];
  res.json({
    data: {
      vacancyId: String(vacancy._id),
      vacancy: {
        title: vacancy.title,
        department: vacancy.department,
        location: vacancy.location,
        workType: vacancy.workType,
        salaryMin: vacancy.salaryMin,
        salaryMax: vacancy.salaryMax,
        description: vacancy.description,
        requirements: vacancy.requirements,
      },
    },
  });
});

export const receiveEmailAnalysis = asyncHandler(async (req, res) => {
  if (!matchesSecret(req.header("x-n8n-callback-secret"), env.N8N_CALLBACK_SECRET)) {
    throw new ApiError(401, "Invalid n8n callback secret");
  }
  const { companySlug } = companySchema.parse(req.params);
  const input = resultSchema.parse(req.body);
  const tenant = await resolveCompany(companySlug);
  const tenantId = String(tenant._id);
  const existing = await Candidate.findOne({ tenant: tenant._id, emailMessageId: input.messageId });
  if (existing) {
    if (String(existing.vacancy) !== input.vacancyId) throw new ApiError(409, "Email was already assigned to another vacancy");
    res.json({ data: { candidateId: String(existing._id), status: existing.analysis?.status, duplicate: true } });
    return;
  }

  const vacancy = await Vacancy.findOne({ _id: input.vacancyId, tenant: tenant._id, status: "published" });
  if (!vacancy) throw new ApiError(404, "Published vacancy not found in this company");

  try {
    const now = new Date();
    const candidate = await Candidate.create({
      tenant: tenantId,
      vacancy: vacancy._id,
      emailMessageId: input.messageId,
      ...input.candidate,
      analysis: {
        status: "completed",
        requestId: randomUUID(),
        requestedAt: now,
        completedAt: now,
        ...input.analysis,
      },
    });
    res.status(201).json({ data: { candidateId: String(candidate._id), status: "completed", duplicate: false } });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      const duplicate = await Candidate.findOne({ tenant: tenant._id, emailMessageId: input.messageId });
      if (duplicate && String(duplicate.vacancy) === input.vacancyId) {
        res.json({ data: { candidateId: String(duplicate._id), status: duplicate.analysis?.status, duplicate: true } });
        return;
      }
    }
    throw error;
  }
});
