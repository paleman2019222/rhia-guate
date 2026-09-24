import { z } from "zod";
import { Employee } from "../models/Employee.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getTenantId } from "../utils/tenant.js";

const employeeSchema = z.object({
  employeeCode: z.string().min(1).max(40).optional(),
  dpi: z.string().min(8).max(30),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  position: z.string().min(2).max(120),
  department: z.string().min(2).max(120),
  hireDate: z.coerce.date(),
  baseSalary: z.number().min(0),
  contractType: z.enum(["indefinite", "fixed_term", "probation"]).optional(),
  status: z.enum(["active", "vacation", "suspended", "terminated"]).optional(),
  terminationReason: z.string().max(500).optional(),
});

export const listEmployees = asyncHandler(async (req, res) => {
  const tenant = getTenantId(req);
  const search = z.string().max(100).optional().parse(req.query.search);
  const filter: Record<string, unknown> = { tenant };
  if (search) filter.$or = [
    { name: { $regex: search, $options: "i" } },
    { dpi: { $regex: search, $options: "i" } },
    { position: { $regex: search, $options: "i" } },
  ];
  res.json({ data: await Employee.find(filter).sort({ createdAt: -1 }).lean() });
});

export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ _id: req.params.employeeId, tenant: getTenantId(req) }).lean();
  if (!employee) throw new ApiError(404, "Employee not found");
  res.json({ data: employee });
});

export const createEmployee = asyncHandler(async (req, res) => {
  const input = employeeSchema.parse(req.body);
  const employee = await Employee.create({ ...input, employeeCode: input.employeeCode ?? `EMP-${Date.now()}`, tenant: getTenantId(req) });
  res.status(201).json({ data: employee });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOneAndUpdate(
    { _id: req.params.employeeId, tenant: getTenantId(req) },
    employeeSchema.partial().parse(req.body),
    { new: true, runValidators: true },
  );
  if (!employee) throw new ApiError(404, "Employee not found");
  res.json({ data: employee });
});

export const terminateEmployee = asyncHandler(async (req, res) => {
  const { reason } = z.object({ reason: z.string().min(3).max(500) }).parse(req.body);
  const employee = await Employee.findOneAndUpdate(
    { _id: req.params.employeeId, tenant: getTenantId(req) },
    { status: "terminated", terminationReason: reason },
    { new: true },
  );
  if (!employee) throw new ApiError(404, "Employee not found");
  res.json({ data: employee });
});
