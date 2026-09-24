import { Schema, model, type InferSchemaType } from "mongoose";
import { DEFAULT_PLAN_FEATURES, FEATURE_KEYS, type PlanCode } from "@rhia/shared";

const featuresSchema = new Schema(
  Object.fromEntries(FEATURE_KEYS.map((key) => [key, { type: Boolean, required: true }])),
  { _id: false },
);

const planSchema = new Schema(
  {
    code: { type: String, enum: ["starter", "professional", "enterprise"], required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priceMonthly: { type: Number, required: true, min: 0 },
    features: { type: featuresSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type PlanDocument = InferSchemaType<typeof planSchema> & { code: PlanCode };
export const Plan = model("Plan", planSchema);
export { DEFAULT_PLAN_FEATURES };
