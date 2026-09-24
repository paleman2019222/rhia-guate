import { Schema, model } from "mongoose";

const candidateSchema = new Schema(
  {
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    vacancy: { type: Schema.Types.ObjectId, ref: "Vacancy", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    emailMessageId: { type: String },
    phone: { type: String, trim: true },
    cvText: { type: String, trim: true },
    sourceDocument: {
      originalName: String,
      url: String,
      mimeType: String,
    },
    analysis: {
      status: { type: String, enum: ["not_requested", "queued", "processing", "completed", "failed"], default: "not_requested" },
      requestId: { type: String, index: true },
      score: { type: Number, min: 0, max: 100 },
      confidence: { type: Number, min: 0, max: 1 },
      isValidCV: { type: Boolean },
      securityStatus: { type: String, enum: ["clean", "prompt_injection_detected", "not_a_cv", "needs_review"] },
      securityFlags: { type: [String], default: [] },
      summary: String,
      strengths: { type: [String], default: [] },
      gaps: { type: [String], default: [] },
      recommendation: { type: String, enum: ["advance", "review", "reject"] },
      rawResponse: Schema.Types.Mixed,
      requestedAt: Date,
      completedAt: Date,
      error: String,
    },
  },
  { timestamps: true },
);

candidateSchema.index({ tenant: 1, vacancy: 1, createdAt: -1 });
candidateSchema.index({ tenant: 1, emailMessageId: 1 }, { unique: true, partialFilterExpression: { emailMessageId: { $type: "string" } } });

export const Candidate = model("Candidate", candidateSchema);
