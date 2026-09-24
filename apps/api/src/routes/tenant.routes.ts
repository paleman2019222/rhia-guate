import { Router } from "express";
import { currentTenant } from "../controllers/tenant.controller.js";
import { createUser, listUsers, updateUser } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

export const tenantRouter = Router();
tenantRouter.use(authenticate);
tenantRouter.get("/current", currentTenant);
tenantRouter.get("/current/users", requireRoles("admin", "super_admin"), listUsers);
tenantRouter.post("/current/users", requireRoles("admin", "super_admin"), createUser);
tenantRouter.patch("/current/users/:userId", requireRoles("admin", "super_admin"), updateUser);
