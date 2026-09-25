import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { z } from "zod";
import { Candidate } from "../models/Candidate.js";
import { QuarantinedApplication } from "../models/QuarantinedApplication.js";
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
  if (!Types.ObjectId.isValid(tenant)) throw new ApiError(400, "Invalid tenant ID");
  const status = z.enum(["draft", "published", "closed"]).optional().parse(req.query.status);
  const search = z.string().max(100).optional().parse(req.query.search);
  const filter: Record<string, unknown> = { tenant };
  if (status) filter.status = status;
  if (search) filter.$or = [{ title: { $regex: search, $options: "i" } }, { department: { $regex: search, $options: "i" } }];
  const scored = {
    $and: [
      { $eq: ["$analysis.status", "completed"] },
      { $isNumber: "$analysis.score" },
      { $ne: ["$analysis.isValidCV", false] },
    ],
  };
  const [vacancies, metrics, quarantinedMetrics] = await Promise.all([
    Vacancy.find(filter).sort({ createdAt: -1 }).lean(),
    Candidate.aggregate<{
      _id: Types.ObjectId;
      applicationCount: number;
      analyzedCount: number;
      scoredCount: number;
      topScore: number | null;
      scoreSum: number;
    }>([
      { $match: { tenant: new Types.ObjectId(tenant) } },
      { $group: {
        _id: "$vacancy",
        applicationCount: { $sum: 1 },
        analyzedCount: { $sum: { $cond: [{ $eq: ["$analysis.status", "completed"] }, 1, 0] } },
        scoredCount: { $sum: { $cond: [scored, 1, 0] } },
        topScore: { $max: { $cond: [scored, "$analysis.score", null] } },
        scoreSum: { $sum: { $cond: [scored, "$analysis.score", 0] } },
      } },
    ]),
    QuarantinedApplication.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { tenant: new Types.ObjectId(tenant) } },
      { $group: { _id: "$vacancy", count: { $sum: 1 } } },
    ]),
  ]);
  const byVacancy = new Map(metrics.map((item) => [String(item._id), item]));
  const quarantinedByVacancy = new Map(quarantinedMetrics.map((item) => [String(item._id), item.count]));
  res.json({ data: vacancies.map((vacancy) => {
    const item = byVacancy.get(String(vacancy._id));
    return {
      ...vacancy,
      metrics: {
        applicationCount: item?.applicationCount ?? 0,
        quarantinedCount: quarantinedByVacancy.get(String(vacancy._id)) ?? 0,
        analyzedCount: item?.analyzedCount ?? 0,
        topScore: item?.topScore ?? null,
        averageScore: item?.scoredCount ? Math.round(item.scoreSum / item.scoredCount) : null,
      },
    };
  }) });
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
