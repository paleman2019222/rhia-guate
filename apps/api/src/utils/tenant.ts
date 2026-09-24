import type { Request } from "express";
import { ApiError } from "./ApiError.js";

export function getTenantId(req: Request) {
  if (!req.auth) throw new ApiError(401, "Authentication is required");

  if (req.auth.role === "super_admin") {
    const tenantId = req.header("x-tenant-id");
    if (!tenantId) throw new ApiError(400, "x-tenant-id is required for super admin tenant-scoped requests");
    return tenantId;
  }

  if (!req.auth.tenantId) throw new ApiError(403, "This user is not assigned to a tenant");
  return req.auth.tenantId;
}
