import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "@rhia/shared";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
  role: UserRole;
  tenantId?: string;
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
