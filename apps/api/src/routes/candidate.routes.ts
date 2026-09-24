import { Router } from "express";
import { createCandidate, downloadCandidateDocumentForTenant, getCandidate, listCandidates, requestAnalysis } from "../controllers/candidate.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireFeature } from "../middleware/feature.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import { cvUpload } from "../middleware/upload.middleware.js";

export const candidateRouter = Router();
candidateRouter.use(authenticate);
candidateRouter.get("/", listCandidates);
candidateRouter.post("/", requireRoles("admin", "hr", "super_admin"), requireFeature("cvAnalyzer"), cvUpload.single("document"), createCandidate);
candidateRouter.get("/:candidateId", getCandidate);
candidateRouter.get("/:candidateId/document", downloadCandidateDocumentForTenant);
candidateRouter.post("/:candidateId/analyze", requireRoles("admin", "hr", "super_admin"), requireFeature("cvAnalyzer"), requestAnalysis);
