import { Router } from "express";
import { createEmployee, getEmployee, listEmployees, terminateEmployee, updateEmployee } from "../controllers/employee.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

export const employeeRouter = Router();
employeeRouter.use(authenticate);
employeeRouter.get("/", listEmployees);
employeeRouter.post("/", requireRoles("admin", "hr", "super_admin"), createEmployee);
employeeRouter.get("/:employeeId", getEmployee);
employeeRouter.patch("/:employeeId", requireRoles("admin", "hr", "super_admin"), updateEmployee);
employeeRouter.post("/:employeeId/terminate", requireRoles("admin", "super_admin"), terminateEmployee);
