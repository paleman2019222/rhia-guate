import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("8h"),
  CORS_ORIGIN: z.string().default("http://localhost:8080"),
  API_PUBLIC_URL: z.string().url().default("http://localhost:3001"),
  N8N_CV_ANALYZER_WEBHOOK_URL: z.string().url().optional(),
  N8N_CALLBACK_SECRET: z.string().min(16),
  N8N_OUTBOUND_TOKEN: z.string().min(16).optional(),
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(12).optional(),
});

export const env = envSchema.parse(process.env);
