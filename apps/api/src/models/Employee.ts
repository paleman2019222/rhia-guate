import { Schema, model } from "mongoose";

const employeeSchema = new Schema(
  {
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    employeeCode: { type: String, required: true, trim: true },
    dpi: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    position: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    hireDate: { type: Date, required: true },
    baseSalary: { type: Number, required: true, min: 0 },
    contractType: { type: String, enum: ["indefinite", "fixed_term", "probation"], default: "indefinite" },
    status: { type: String, enum: ["active", "vacation", "suspended", "terminated"], default: "active" },
    terminationReason: { type: String, trim: true },
  },
  { timestamps: true },
);

employeeSchema.index({ tenant: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ tenant: 1, dpi: 1 }, { unique: true });

export const Employee = model("Employee", employeeSchema);
