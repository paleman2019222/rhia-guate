import bcrypt from "bcryptjs";
import { z } from "zod";
import { Tenant } from "../models/Tenant.js";
import { User } from "../models/User.js";
import { signAccessToken } from "../services/auth.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

function publicUser(user: { _id: unknown; name: string; email: string; role: string; tenant?: unknown; isActive: boolean }) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role, tenantId: user.tenant ? String(user.tenant) : undefined, isActive: user.isActive };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.tenant) {
    const tenant = await Tenant.findById(user.tenant);
    if (!tenant || tenant.status !== "active") throw new ApiError(403, "This tenant is not active");
  }

  const token = signAccessToken({ sub: String(user._id), role: user.role, tenantId: user.tenant ? String(user.tenant) : undefined });
  res.json({ accessToken: token, tokenType: "Bearer", user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth?.userId).lean();
  if (!user || !user.isActive) throw new ApiError(401, "User is no longer active");
  res.json({ user: publicUser(user) });
});
