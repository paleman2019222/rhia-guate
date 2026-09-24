import { Schema, model, type Types } from "mongoose";

const tenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    featureOverrides: { type: Map, of: Boolean, default: {} },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
  },
  { timestamps: true },
);

export interface TenantShape {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  plan: Types.ObjectId;
  featureOverrides: Map<string, boolean>;
  status: "active" | "suspended";
}

export const Tenant = model("Tenant", tenantSchema);
