import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { adminRouter } from "./routes/admin.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { candidateRouter } from "./routes/candidate.routes.js";
import { employeeRouter } from "./routes/employee.routes.js";
import { integrationRouter } from "./routes/integration.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { tenantRouter } from "./routes/tenant.routes.js";
import { vacancyRouter } from "./routes/vacancy.routes.js";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()), credentials: false }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/tenants", tenantRouter);
app.use("/api/v1/employees", employeeRouter);
app.use("/api/v1/vacancies", vacancyRouter);
app.use("/api/v1/candidates", candidateRouter);
app.use("/api/v1/integrations", integrationRouter);
app.use("/api/v1/public", publicRouter);
app.use(notFound);
app.use(errorHandler);
