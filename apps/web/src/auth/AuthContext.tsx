import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearAccessToken, clearActiveTenantId, getAccessToken, getActiveTenantId, setAccessToken, setActiveTenantId } from "@/lib/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "hr";
  tenantId?: string;
  isActive: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  activeTenantId: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  selectTenant: (tenantId: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(() => getActiveTenantId());

  useEffect(() => {
    if (!getAccessToken()) {
      setIsLoading(false);
      return;
    }
    api<{ user: AuthUser }>("/auth/me")
      .then((response) => {
        setUser(response.user);
        if (response.user.role !== "super_admin") {
          clearActiveTenantId();
          setActiveTenantIdState(null);
        }
      })
      .catch(() => { clearAccessToken(); clearActiveTenantId(); setActiveTenantIdState(null); })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    activeTenantId,
    login: async (email, password) => {
      const response = await api<{ accessToken: string; user: AuthUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setAccessToken(response.accessToken);
      setUser(response.user);
      if (response.user.role !== "super_admin") {
        clearActiveTenantId();
        setActiveTenantIdState(null);
      }
      return response.user;
    },
    selectTenant: (tenantId) => {
      if (tenantId) setActiveTenantId(tenantId);
      else clearActiveTenantId();
      setActiveTenantIdState(tenantId);
    },
    logout: () => {
      clearAccessToken();
      clearActiveTenantId();
      setUser(null);
      setActiveTenantIdState(null);
    },
  }), [user, isLoading, activeTenantId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
