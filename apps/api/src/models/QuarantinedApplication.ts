import { model, Schema } from "mongoose";
import { Candidate } from "./Candidate.js";

// Keep the original application ID and fields when moving it out of candidates.
const quarantinedApplicationSchema = Candidate.schema.clone() as Schema;
quarantinedApplicationSchema.add({
  quarantinedAt: { type: Date, required: true },
  quarantineReason: { type: String, required: true, enum: ["prompt_injection_detected", "not_a_cv", "needs_review"] },
});
quarantinedApplicationSchema.index({ tenant: 1, vacancy: 1, quarantinedAt: -1 });

export const QuarantinedApplication = model("QuarantinedApplication", quarantinedApplicationSchema);
