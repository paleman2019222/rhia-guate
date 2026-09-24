import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando sesión…</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
