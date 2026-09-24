import bcrypt from "bcryptjs";
import { Schema, model, type Types } from "mongoose";
import type { UserRole } from "@rhia/shared";

const userSchema = new Schema(
  {
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: false, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["super_admin", "admin", "hr"], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

export interface UserShape {
  _id: Types.ObjectId;
  tenant?: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

export const User = model("User", userSchema);
