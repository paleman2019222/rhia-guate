export const FEATURE_KEYS = ["cvAnalyzer", "cvDocumentUpload", "reports", "payroll", "apiAccess"] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type PlanCode = "starter" | "professional" | "enterprise";
export type UserRole = "super_admin" | "admin" | "hr";

export type FeatureFlags = Record<FeatureKey, boolean>;

export const DEFAULT_PLAN_FEATURES: Record<PlanCode, FeatureFlags> = {
  starter: {
    cvAnalyzer: false,
    cvDocumentUpload: false,
    reports: true,
    payroll: true,
    apiAccess: false,
  },
  professional: {
    cvAnalyzer: true,
    cvDocumentUpload: true,
    reports: true,
    payroll: true,
    apiAccess: false,
  },
  enterprise: {
    cvAnalyzer: true,
    cvDocumentUpload: true,
    reports: true,
    payroll: true,
    apiAccess: true,
  },
};
