import { connectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

async function bootstrap() {
  if (!env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD) {
    throw new Error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be configured");
  }
  await connectDatabase();
  const existing = await User.findOne({ email: env.SUPER_ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log("Super admin already exists");
    process.exit(0);
  }
  await User.create({ name: "RHIA Platform Administrator", email: env.SUPER_ADMIN_EMAIL, passwordHash: env.SUPER_ADMIN_PASSWORD, role: "super_admin" });
  console.log("Super admin created successfully");
  process.exit(0);
}

bootstrap().catch((error) => { console.error(error); process.exit(1); });
