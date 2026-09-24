import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

interface CVAnalysisRequest {
  requestId: string;
  tenantId: string;
  candidateId: string;
  vacancyId: string;
  candidate: { name: string; email: string; phone?: string; cvText?: string; documentUrl?: string };
  vacancy: {
    title: string;
    department: string;
    location: string;
    workType: "full_time" | "part_time" | "contract" | "remote";
    salaryMin?: number;
    salaryMax?: number;
    description: string;
    requirements: string[];
  };
  callbackUrl: string;
}

export function createAnalysisRequestId() {
  return randomUUID();
}

export async function dispatchCVAnalysis(payload: CVAnalysisRequest) {
  if (!env.N8N_CV_ANALYZER_WEBHOOK_URL) {
    throw new ApiError(503, "N8N_CV_ANALYZER_WEBHOOK_URL is not configured");
  }

  const response = await fetch(env.N8N_CV_ANALYZER_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-rhia-workflow-token": env.N8N_OUTBOUND_TOKEN ?? "",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new ApiError(502, `n8n rejected the CV analysis request (${response.status})`);
  }
}
