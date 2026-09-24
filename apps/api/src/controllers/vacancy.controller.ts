import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Vacancy } from "../models/Vacancy.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getTenantId } from "../utils/tenant.js";

const vacancyBaseSchema = z.object({
  title: z.string().min(2).max(160),
  department: z.string().min(2).max(120),
  location: z.string().min(2).max(160),
  workType: z.enum(["full_time", "part_time", "contract", "remote"]),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  description: z.string().min(20).max(10000),
  requirements: z.array(z.string().min(1).max(300)).max(50).default([]),
  status: z.enum(["draft", "published", "closed"]).optional(),
});

const vacancySchema = vacancyBaseSchema.refine((data) => data.salaryMin === undefined || data.salaryMax === undefined || data.salaryMin <= data.salaryMax, {
  message: "salaryMin cannot be greater than salaryMax",
  path: ["salaryMin"],
});

export const listVacancies = asyncHandler(async (req, res) => {
  const tenant = getTenantId(req);
  const status = z.enum(["draft", "published", "closed"]).optional().parse(req.query.status);
  const search = z.string().max(100).optional().parse(req.query.search);
  const filter: Record<string, unknown> = { tenant };
  if (status) filter.status = status;
  if (search) filter.$or = [{ title: { $regex: search, $options: "i" } }, { department: { $regex: search, $options: "i" } }];
  res.json({ data: await Vacancy.find(filter).sort({ createdAt: -1 }).lean() });
});

export const getVacancy = asyncHandler(async (req, res) => {
  const vacancy = await Vacancy.findOne({ _id: req.params.vacancyId, tenant: getTenantId(req) }).lean();
  if (!vacancy) throw new ApiError(404, "Vacancy not found");
  res.json({ data: vacancy });
});

export const createVacancy = asyncHandler(async (req, res) => {
  const vacancy = await Vacancy.create({ ...vacancySchema.parse(req.body), tenant: getTenantId(req) });
  res.status(201).json({ data: vacancy });
});

export const updateVacancy = asyncHandler(async (req, res) => {
  const vacancy = await Vacancy.findOneAndUpdate(
    { _id: req.params.vacancyId, tenant: getTenantId(req) },
    vacancyBaseSchema.partial().parse(req.body),
    { new: true, runValidators: true },
  );
  if (!vacancy) throw new ApiError(404, "Vacancy not found");
  res.json({ data: vacancy });
});

export const generatePublicLink = asyncHandler(async (req, res) => {
  const vacancy = await Vacancy.findOne({ _id: req.params.vacancyId, tenant: getTenantId(req) });
  if (!vacancy) throw new ApiError(404, "Vacancy not found");

  if (!vacancy.publicId) {
    vacancy.publicId = randomUUID();
    await vacancy.save();
  }

  res.json({ data: { publicId: vacancy.publicId } });
});
