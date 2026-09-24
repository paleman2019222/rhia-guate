import type { FeatureKey } from "@rhia/shared";
import type { RequestHandler } from "express";
import { assertFeatureEnabled } from "../services/feature.service.js";
import { getTenantId } from "../utils/tenant.js";

export function requireFeature(feature: FeatureKey): RequestHandler {
  return async (req, _res, next) => {
    try {
      await assertFeatureEnabled(getTenantId(req), feature);
      next();
    } catch (error) {
      next(error);
    }
  };
}
