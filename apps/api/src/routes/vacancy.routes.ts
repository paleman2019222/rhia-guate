import { Router } from "express";
import { createVacancy, generatePublicLink, getVacancy, listVacancies, updateVacancy } from "../controllers/vacancy.controller.js";
import { downloadQuarantinedDocument, getQuarantinedApplication, listQuarantinedApplications } from "../controllers/quarantine.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

export const vacancyRouter = Router();
vacancyRouter.use(authenticate);
vacancyRouter.get("/", listVacancies);
vacancyRouter.post("/", requireRoles("admin", "hr", "super_admin"), createVacancy);
vacancyRouter.post("/:vacancyId/public-link", requireRoles("admin", "hr", "super_admin"), generatePublicLink);
vacancyRouter.get("/:vacancyId/quarantined-applications", listQuarantinedApplications);
vacancyRouter.get("/:vacancyId/quarantined-applications/:applicationId", getQuarantinedApplication);
vacancyRouter.get("/:vacancyId/quarantined-applications/:applicationId/document", downloadQuarantinedDocument);
vacancyRouter.get("/:vacancyId", getVacancy);
vacancyRouter.patch("/:vacancyId", requireRoles("admin", "hr", "super_admin"), updateVacancy);
