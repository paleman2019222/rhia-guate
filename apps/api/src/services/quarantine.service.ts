import mongoose from "mongoose";
import { Candidate } from "../models/Candidate.js";
import { QuarantinedApplication } from "../models/QuarantinedApplication.js";
import { ApiError } from "../utils/ApiError.js";

export type QuarantineReason = "prompt_injection_detected" | "not_a_cv" | "needs_review";

export function quarantineReasonFor(analysis: { securityStatus?: string | null; isValidCV?: boolean | null }): QuarantineReason | null {
  if (analysis.securityStatus === "prompt_injection_detected" || analysis.securityStatus === "not_a_cv" || analysis.securityStatus === "needs_review") return analysis.securityStatus;
  if (analysis.isValidCV === false) return "not_a_cv";
  return null;
}

export async function quarantineCandidate(requestId: string, reason: QuarantineReason, flags: string[], error?: string) {
  const session = await mongoose.startSession();
  try {
    let candidateId = "";
    await session.withTransaction(async () => {
      const candidate = await Candidate.findOne({ "analysis.requestId": requestId }).session(session);
      if (!candidate) throw new ApiError(404, "Analysis request not found");
      candidateId = String(candidate._id);
      const snapshot = candidate.toObject() as unknown as Record<string, unknown>;
      const originalAnalysis = snapshot.analysis as Record<string, unknown> | undefined;
      snapshot.analysis = {
        ...originalAnalysis,
        status: "failed",
        isValidCV: false,
        securityStatus: reason,
        securityFlags: flags,
        error: error ?? "Postulación aislada por revisión de seguridad",
        completedAt: new Date(),
        score: undefined,
        recommendation: undefined,
        rawResponse: undefined,
      };
      await QuarantinedApplication.create([{ ...snapshot, quarantinedAt: new Date(), quarantineReason: reason }], { session });
      await Candidate.deleteOne({ _id: candidate._id }, { session });
    });
    return candidateId;
  } finally {
    await session.endSession();
  }
}
