import { FEATURE_KEYS } from "@rhia/shared";
import { z } from "zod";
import { Plan } from "../models/Plan.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const featureSchema = z.object(Object.fromEntries(FEATURE_KEYS.map((key) => [key, z.boolean()])) as Record<(typeof FEATURE_KEYS)[number], z.ZodBoolean>);
const planSchema = z.object({
  code: z.enum(["starter", "professional", "enterprise"]),
  name: z.string().min(2).max(80),
  description: z.string().min(2).max(500),
  priceMonthly: z.number().min(0),
  features: featureSchema,
  isActive: z.boolean().optional(),
});

export const listPlans = asyncHandler(async (_req, res) => {
  res.json({ data: await Plan.find().sort({ priceMonthly: 1 }).lean() });
});

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await Plan.create(planSchema.parse(req.body));
  res.status(201).json({ data: plan });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const data = planSchema.omit({ code: true }).partial().parse(req.body);
  const plan = await Plan.findByIdAndUpdate(req.params.planId, data, { new: true, runValidators: true });
  if (!plan) return res.status(404).json({ error: "Plan not found" });
  res.json({ data: plan });
});
