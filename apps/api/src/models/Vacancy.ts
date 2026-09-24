import { randomUUID } from "node:crypto";
import { Schema, model } from "mongoose";

const vacancySchema = new Schema(
  {
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    publicId: { type: String, required: true, unique: true, default: randomUUID, index: true },
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    workType: { type: String, enum: ["full_time", "part_time", "contract", "remote"], required: true },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    description: { type: String, required: true, trim: true },
    requirements: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "published", "closed"], default: "draft" },
  },
  { timestamps: true },
);

vacancySchema.index({ tenant: 1, status: 1, createdAt: -1 });

export const Vacancy = model("Vacancy", vacancySchema);
