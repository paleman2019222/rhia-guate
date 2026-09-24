import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={user.role === "super_admin" ? "/admin" : "/dashboard"} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const authenticatedUser = await login(email, password);
      navigate(authenticatedUser.role === "super_admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No fue posible iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary"><Sparkles className="h-6 w-6 text-primary-foreground" /></div>
          <h1 className="font-display text-3xl font-bold">Ingresa a Rhia</h1>
          <p className="mt-2 text-sm text-muted-foreground">Usa las credenciales de tu organización.</p>
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="space-y-2"><Label htmlFor="email">Correo electrónico</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
        <Button className="w-full" disabled={submitting}>{submitting ? "Ingresando…" : "Ingresar"}</Button>
      </form>
    </main>
  );
}
