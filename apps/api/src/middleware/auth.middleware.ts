import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../services/auth.service.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) return next(new ApiError(401, "Bearer token is required"));

  try {
    const payload = verifyAccessToken(authorization.slice(7));
    req.auth = { userId: payload.sub, tenantId: payload.tenantId, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired access token"));
  }
};
