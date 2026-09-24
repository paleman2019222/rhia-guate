import { Router } from "express";
import { downloadCandidateDocument, receiveAnalysisCallback } from "../controllers/candidate.controller.js";
import { lookupEmailVacancy, receiveEmailAnalysis } from "../controllers/emailIntegration.controller.js";

export const integrationRouter = Router();
integrationRouter.post("/n8n/cv-analysis/callback", receiveAnalysisCallback);
integrationRouter.get("/n8n/candidates/:candidateId/document", downloadCandidateDocument);
integrationRouter.get("/n8n/email/companies/:companySlug/vacancies", lookupEmailVacancy);
integrationRouter.post("/n8n/email/companies/:companySlug/cv-analysis", receiveEmailAnalysis);
