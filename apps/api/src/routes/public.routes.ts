import { Router } from "express";
import { getPublicVacancy, submitPublicApplication } from "../controllers/public.controller.js";
import { cvUpload } from "../middleware/upload.middleware.js";

export const publicRouter = Router();
publicRouter.get("/companies/:companySlug/vacancies/:publicId", getPublicVacancy);
publicRouter.post("/companies/:companySlug/vacancies/:publicId/applications", cvUpload.single("document"), submitPublicApplication);
