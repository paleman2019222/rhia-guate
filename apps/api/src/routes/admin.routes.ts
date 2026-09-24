import { Router } from "express";
import { createPlan, listPlans, updatePlan } from "../controllers/plan.controller.js";
import { createTenant, listTenants, updateTenantPlan } from "../controllers/tenant.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRoles("super_admin"));
adminRouter.get("/plans", listPlans);
adminRouter.post("/plans", createPlan);
adminRouter.patch("/plans/:planId", updatePlan);
adminRouter.get("/tenants", listTenants);
adminRouter.post("/tenants", createTenant);
adminRouter.patch("/tenants/:tenantId", updateTenantPlan);
