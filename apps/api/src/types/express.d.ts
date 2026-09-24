import type { UserRole } from "@rhia/shared";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        tenantId?: string;
        role: UserRole;
      };
    }
  }
}

export {};
