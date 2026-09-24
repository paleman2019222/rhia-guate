import { FEATURE_KEYS } from "@rhia/shared";
import { z } from "zod";
import { Plan } from "../models/Plan.js";
import { Tenant } from "../models/Tenant.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getTenantId } from "../utils/tenant.js";

const overridesSchema = z.object(Object.fromEntries(FEATURE_KEYS.map((key) => [key, z.boolean().optional()])) as Record<(typeof FEATURE_KEYS)[number], z.ZodOptional<z.ZodBoolean>>);
const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9-]{2,60}$/),
  planId: z.string().min(1),
  primaryAdmin: z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(12) }),
});

export const listTenants = asyncHandler(async (_req, res) => {
  const tenants = await Tenant.find().populate("plan").sort({ createdAt: -1 }).lean();
  res.json({ data: tenants });
});

export const createTenant = asyncHandler(async (req, res) => {
  const input = createTenantSchema.parse(req.body);
  const plan = await Plan.findById(input.planId);
  if (!plan || !plan.isActive) throw new ApiError(422, "An active plan is required");

  const tenant = await Tenant.create({ name: input.name, slug: input.slug, plan: plan._id });
  try {
    const admin = await User.create({ tenant: tenant._id, name: input.primaryAdmin.name, email: input.primaryAdmin.email, passwordHash: input.primaryAdmin.password, role: "admin" });
    res.status(201).json({ data: { tenant, primaryAdmin: { id: String(admin._id), name: admin.name, email: admin.email } } });
  } catch (error) {
    await Tenant.findByIdAndDelete(tenant._id);
    throw error;
  }
});

export const currentTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(getTenantId(req)).populate("plan").lean();
  if (!tenant) throw new ApiError(404, "Tenant not found");
  res.json({ data: tenant });
});

export const updateTenantPlan = asyncHandler(async (req, res) => {
  const { planId, featureOverrides, status } = z.object({ planId: z.string().optional(), featureOverrides: overridesSchema.optional(), status: z.enum(["active", "suspended"]).optional() }).parse(req.body);
  if (planId) {
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) throw new ApiError(422, "An active plan is required");
  }
  const update: Record<string, unknown> = {};
  if (planId) update.plan = planId;
  if (featureOverrides) update.featureOverrides = featureOverrides;
  if (status) update.status = status;
  const tenant = await Tenant.findByIdAndUpdate(req.params.tenantId, update, { new: true }).populate("plan");
  if (!tenant) throw new ApiError(404, "Tenant not found");
  res.json({ data: tenant });
});
