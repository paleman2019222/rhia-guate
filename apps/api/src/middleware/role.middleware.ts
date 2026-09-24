import type { UserRole } from "@rhia/shared";
import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

export function requireRoles(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(new ApiError(401, "Authentication is required"));
    if (!roles.includes(req.auth.role)) return next(new ApiError(403, "Insufficient permissions"));
    next();
  };
}
