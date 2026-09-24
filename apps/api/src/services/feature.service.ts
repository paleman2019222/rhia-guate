import type { FeatureKey } from "@rhia/shared";
import { Plan } from "../models/Plan.js";
import { Tenant } from "../models/Tenant.js";
import { ApiError } from "../utils/ApiError.js";

export async function getTenantFeatures(tenantId: string) {
  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant) throw new ApiError(404, "Tenant not found");
  if (tenant.status !== "active") throw new ApiError(403, "Tenant is suspended");

  const plan = await Plan.findById(tenant.plan).lean();
  if (!plan || !plan.isActive) throw new ApiError(403, "The tenant does not have an active plan");

  const overrides = tenant.featureOverrides instanceof Map
    ? Object.fromEntries(tenant.featureOverrides.entries())
    : (tenant.featureOverrides ?? {});

  return {
    tenant,
    plan,
    features: { ...plan.features, ...overrides } as Record<FeatureKey, boolean>,
  };
}

export async function assertFeatureEnabled(tenantId: string, feature: FeatureKey) {
  const context = await getTenantFeatures(tenantId);
  if (!context.features[feature]) {
    throw new ApiError(403, `The ${feature} feature is not enabled for this tenant plan`);
  }
  return context;
}
