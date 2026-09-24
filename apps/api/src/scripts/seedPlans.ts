import { DEFAULT_PLAN_FEATURES, type PlanCode } from "@rhia/shared";
import { connectDatabase } from "../config/database.js";
import { Plan } from "../models/Plan.js";

const plans: Array<{ code: PlanCode; name: string; description: string; priceMonthly: number }> = [
  { code: "starter", name: "Starter", description: "Gestión esencial de empleados y planilla.", priceMonthly: 0 },
  { code: "professional", name: "Professional", description: "Incluye analizador de CVs, carga de documentos y reportes.", priceMonthly: 99 },
  { code: "enterprise", name: "Enterprise", description: "Automatizaciones e integración API para equipos avanzados.", priceMonthly: 299 },
];

async function seed() {
  await connectDatabase();
  for (const plan of plans) {
    await Plan.findOneAndUpdate({ code: plan.code }, { ...plan, features: DEFAULT_PLAN_FEATURES[plan.code], isActive: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  console.log("Plans seeded successfully");
  process.exit(0);
}

seed().catch((error) => { console.error(error); process.exit(1); });
