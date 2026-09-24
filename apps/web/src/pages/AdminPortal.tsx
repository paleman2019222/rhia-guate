import { useEffect, useState, type FormEvent } from "react";
import { Building2, Plus, ShieldCheck } from "lucide-react";
import { FEATURE_KEYS } from "@/lib/features";
import { useAuth } from "@/auth/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Features = Record<(typeof FEATURE_KEYS)[number], boolean>;
type Plan = { _id: string; code: string; name: string; description: string; priceMonthly: number; features: Features; isActive: boolean };
type Tenant = { _id: string; name: string; slug: string; status: "active" | "suspended"; plan?: { _id: string; name: string; code: string } };
type TenantForm = { name: string; slug: string; planId: string; adminName: string; adminEmail: string; adminPassword: string };

const emptyTenantForm: TenantForm = { name: "", slug: "", planId: "", adminName: "", adminEmail: "", adminPassword: "" };

export default function AdminPortal() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [form, setForm] = useState<TenantForm>(emptyTenantForm);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const [planResponse, tenantResponse] = await Promise.all([
        api<{ data: Plan[] }>("/admin/plans"),
        api<{ data: Tenant[] }>("/admin/tenants"),
      ]);
      setPlans(planResponse.data);
      setTenants(tenantResponse.data);
      setForm((current) => current.planId ? current : { ...current, planId: planResponse.data.find((plan) => plan.isActive)?._id ?? "" });
    } catch (error) {
      setMessage(error instanceof ApiClientError ? error.message : "No fue posible cargar el portal");
    }
  }

  useEffect(() => {
    if (user?.role === "super_admin") void load();
  }, [user?.role]);

  async function toggleFeature(plan: Plan, feature: keyof Features) {
    const features = { ...plan.features, [feature]: !plan.features[feature] };
    try {
      const response = await api<{ data: Plan }>(`/admin/plans/${plan._id}`, { method: "PATCH", body: JSON.stringify({ features }) });
      setPlans((current) => current.map((item) => item._id === plan._id ? response.data : item));
      setMessage(`Función ${features[feature] ? "activada" : "desactivada"} para el plan ${plan.name}.`);
    } catch (error) {
      setMessage(error instanceof ApiClientError ? error.message : "No se pudo actualizar el plan");
    }
  }

  async function createTenant(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      await api("/admin/tenants", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug.toLowerCase().trim(),
          planId: form.planId,
          primaryAdmin: { name: form.adminName, email: form.adminEmail, password: form.adminPassword },
        }),
      });
      setForm({ ...emptyTenantForm, planId: plans.find((plan) => plan.isActive)?._id ?? "" });
      setMessage("Empresa y administrador inicial creados correctamente.");
      await load();
    } catch (error) {
      setMessage(error instanceof ApiClientError ? error.message : "No se pudo crear la empresa");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTenant(tenant: Tenant, update: Record<string, unknown>) {
    try {
      await api(`/admin/tenants/${tenant._id}`, { method: "PATCH", body: JSON.stringify(update) });
      setMessage(`Empresa ${tenant.name} actualizada.`);
      await load();
    } catch (error) {
      setMessage(error instanceof ApiClientError ? error.message : "No se pudo actualizar la empresa");
    }
  }

  if (user?.role !== "super_admin") {
    return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">No tienes permisos para acceder al portal de plataforma.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><ShieldCheck className="h-7 w-7 text-primary" /> Portal administrador</h1>
        <p className="text-muted-foreground">Administración de la plataforma, empresas, suscripciones y funciones por plan.</p>
      </div>

      {message && <p role="status" className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{message}</p>}

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-semibold">Crear empresa</h2></div>
        <form onSubmit={createTenant} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="tenant-name">Nombre de la empresa</Label><Input id="tenant-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Empresa S.A." required /></div>
          <div className="space-y-2"><Label htmlFor="tenant-slug">Identificador</Label><Input id="tenant-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="empresa-sa" required /><p className="text-xs text-muted-foreground">Sólo minúsculas, números y guiones.</p></div>
          <div className="space-y-2"><Label>Plan inicial</Label><Select value={form.planId} onValueChange={(planId) => setForm({ ...form, planId })}><SelectTrigger><SelectValue placeholder="Selecciona un plan" /></SelectTrigger><SelectContent>{plans.filter((plan) => plan.isActive).map((plan) => <SelectItem key={plan._id} value={plan._id}>{plan.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="admin-name">Nombre del administrador</Label><Input id="admin-name" value={form.adminName} onChange={(event) => setForm({ ...form, adminName: event.target.value })} placeholder="María López" required /></div>
          <div className="space-y-2"><Label htmlFor="admin-email">Correo del administrador</Label><Input id="admin-email" type="email" value={form.adminEmail} onChange={(event) => setForm({ ...form, adminEmail: event.target.value })} placeholder="admin@empresa.gt" required /></div>
          <div className="space-y-2"><Label htmlFor="admin-password">Contraseña inicial</Label><Input id="admin-password" type="password" minLength={12} value={form.adminPassword} onChange={(event) => setForm({ ...form, adminPassword: event.target.value })} required /><p className="text-xs text-muted-foreground">Mínimo 12 caracteres.</p></div>
          <div className="md:col-span-2"><Button disabled={submitting || !form.planId} className="gap-2"><Plus className="h-4 w-4" />{submitting ? "Creando…" : "Crear empresa"}</Button></div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Funciones por plan</h2>
        {plans.map((plan) => <article key={plan._id} className="rounded-xl border border-border bg-card p-6"><div className="flex items-start justify-between"><div><h3 className="font-display text-xl font-semibold">{plan.name}</h3><p className="text-sm text-muted-foreground">{plan.description} · USD {plan.priceMonthly}/mes</p></div><span className="rounded-full bg-accent px-3 py-1 text-xs font-medium">{plan.code}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{FEATURE_KEYS.map((feature) => <Button key={feature} type="button" variant={plan.features[feature] ? "default" : "outline"} className="justify-between" onClick={() => void toggleFeature(plan, feature)}><span>{feature}</span><span>{plan.features[feature] ? "Activo" : "Inactivo"}</span></Button>)}</div></article>)}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Empresas registradas</h2>
        <div className="mt-4 space-y-3">
          {tenants.map((tenant) => <div key={tenant._id} className="flex flex-col gap-3 rounded-lg border border-border p-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-medium">{tenant.name}</p><p className="text-sm text-muted-foreground">{tenant.slug} · {tenant.status}</p></div><div className="flex items-center gap-3"><Select value={tenant.plan?._id} onValueChange={(planId) => void updateTenant(tenant, { planId })}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{plans.filter((plan) => plan.isActive).map((plan) => <SelectItem key={plan._id} value={plan._id}>{plan.name}</SelectItem>)}</SelectContent></Select><Button size="sm" variant={tenant.status === "active" ? "outline" : "default"} onClick={() => void updateTenant(tenant, { status: tenant.status === "active" ? "suspended" : "active" })}>{tenant.status === "active" ? "Suspender" : "Activar"}</Button></div></div>)}
          {tenants.length === 0 && <p className="text-sm text-muted-foreground">No hay empresas creadas todavía.</p>}
        </div>
      </section>
    </div>
  );
}
