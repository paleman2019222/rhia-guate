import { z } from "zod";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getTenantId } from "../utils/tenant.js";

const createUserSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(12), role: z.enum(["admin", "hr"]) });

export const listUsers = asyncHandler(async (req, res) => {
  const tenantId = getTenantId(req);
  const users = await User.find({ tenant: tenantId }).select("-passwordHash").sort({ createdAt: -1 }).lean();
  res.json({ data: users });
});

export const createUser = asyncHandler(async (req, res) => {
  const input = createUserSchema.parse(req.body);
  const user = await User.create({ ...input, passwordHash: input.password, tenant: getTenantId(req) });
  res.status(201).json({ data: { id: String(user._id), name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
});

export const updateUser = asyncHandler(async (req, res) => {
  const input = z.object({ name: z.string().min(2).optional(), role: z.enum(["admin", "hr"]).optional(), isActive: z.boolean().optional(), password: z.string().min(12).optional() }).parse(req.body);
  const update: Record<string, unknown> = { ...input };
  if (input.password) {
    delete update.password;
    update.passwordHash = input.password;
  }
  const user = await User.findOne({ _id: req.params.userId, tenant: getTenantId(req) }).select("+passwordHash");
  if (!user) throw new ApiError(404, "User not found");
  Object.assign(user, update);
  await user.save();
  res.json({ data: { id: String(user._id), name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
});
