import path from "node:path";
import { access } from "node:fs/promises";
import { Types } from "mongoose";
import { QuarantinedApplication } from "../models/QuarantinedApplication.js";
import { Vacancy } from "../models/Vacancy.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getTenantId } from "../utils/tenant.js";

async function assertVacancy(vacancyId: string, tenant: string) {
  if (!Types.ObjectId.isValid(vacancyId)) throw new ApiError(404, "Vacancy not found");
  const vacancy = await Vacancy.exists({ _id: vacancyId, tenant });
  if (!vacancy) throw new ApiError(404, "Vacancy not found");
}

export const listQuarantinedApplications = asyncHandler(async (req, res) => {
  const tenant = getTenantId(req);
  await assertVacancy(String(req.params.vacancyId), tenant);
  const data = await QuarantinedApplication.find({ tenant, vacancy: req.params.vacancyId })
    .select("name email phone sourceDocument.originalName quarantineReason quarantinedAt analysis.securityFlags analysis.error createdAt")
    .sort({ quarantinedAt: -1 }).lean();
  res.json({ data });
});

async function findQuarantinedApplication(tenant: string, vacancyId: string, applicationId: string) {
  if (!Types.ObjectId.isValid(applicationId)) throw new ApiError(404, "Quarantined application not found");
  const application = await QuarantinedApplication.findOne({ _id: applicationId, tenant, vacancy: vacancyId }).lean();
  if (!application) throw new ApiError(404, "Quarantined application not found");
  return application;
}

export const getQuarantinedApplication = asyncHandler(async (req, res) => {
  const data = await findQuarantinedApplication(getTenantId(req), String(req.params.vacancyId), String(req.params.applicationId));
  res.json({ data });
});

export const downloadQuarantinedDocument = asyncHandler(async (req, res) => {
  const application = await findQuarantinedApplication(getTenantId(req), String(req.params.vacancyId), String(req.params.applicationId));
  const sourceDocument = application.sourceDocument as { url?: string; originalName?: string } | undefined;
  if (!sourceDocument?.url) throw new ApiError(404, "Application has no CV document");
  const fileName = sourceDocument.url.split(/[\\/]/).pop();
  if (!fileName) throw new ApiError(404, "CV document not found");
  const filePath = path.resolve(process.cwd(), "uploads", fileName);
  try { await access(filePath); } catch { throw new ApiError(404, "CV document is no longer available on this server"); }
  res.download(filePath, sourceDocument.originalName || fileName);
});
