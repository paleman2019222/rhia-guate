import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, FileText, RefreshCw, Sparkles, Users } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/auth/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Vacancy = {
  _id: string;
  title: string;
  department: string;
  status: "draft" | "published" | "closed";
};

type Candidate = {
  _id: string;
  name: string;
  vacancy?: { _id: string; title: string };
  createdAt: string;
  analysis?: { status: string; score?: number; isValidCV?: boolean };
};

const Dashboard = () => {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vacancyResponse, candidateResponse, employeeResponse] = await Promise.all([
        api<{ data: Vacancy[] }>("/vacancies"),
        api<{ data: Candidate[] }>("/candidates"),
        api<{ data: unknown[] }>("/employees"),
      ]);
      setVacancies(vacancyResponse.data);
      setCandidates(candidateResponse.data);
      setEmployeeCount(employeeResponse.data.length);
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No se pudo cargar el resumen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeVacancies = vacancies.filter((vacancy) => vacancy.status === "published");
  const totalCVs = candidates.length;
  const analyzedCVs = candidates.filter((candidate) => candidate.analysis?.status === "completed").length;
  const candidatesByVacancy = new Map<string, Candidate[]>();
  const topScoreByVacancy = new Map<string, number>();
  for (const candidate of candidates) {
    const vacancyId = candidate.vacancy?._id;
    if (!vacancyId) continue;
    candidatesByVacancy.set(vacancyId, [...(candidatesByVacancy.get(vacancyId) ?? []), candidate]);
    const score = candidate.analysis?.score;
    if (candidate.analysis?.status === "completed" && candidate.analysis.isValidCV !== false && typeof score === "number" && Number.isFinite(score)) {
      topScoreByVacancy.set(vacancyId, Math.max(topScoreByVacancy.get(vacancyId) ?? score, score));
    }
  }
  const recentCandidates = [...candidates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Hola, {user?.name ?? "bienvenido"}</h1>
          <p className="mt-1 text-muted-foreground">Resumen actualizado de tu empresa</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} title="Plazas publicadas" value={loading ? "—" : activeVacancies.length} variant="primary" />
        <StatCard icon={FileText} title="CVs recibidos" value={loading ? "—" : totalCVs} subtitle="Todas las plazas" />
        <StatCard icon={Sparkles} title="Análisis completados" value={loading ? "—" : analyzedCVs} subtitle={loading ? undefined : `De ${totalCVs} CVs recibidos`} />
        <StatCard icon={Users} title="Empleados registrados" value={loading ? "—" : employeeCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Plazas publicadas</h2>
            <Link to="/plazas" className="text-sm font-medium text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {activeVacancies.map((vacancy) => (
              <div key={vacancy._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4">
                <div><p className="font-medium">{vacancy.title}</p><p className="text-sm text-muted-foreground">{vacancy.department}</p></div>
                <div className="flex items-center gap-6 text-right">
                  <div><p className="font-semibold">{candidatesByVacancy.get(vacancy._id)?.length ?? 0}</p><p className="text-xs text-muted-foreground">CVs recibidos</p></div>
                  <div><p className="font-semibold text-primary">{topScoreByVacancy.has(vacancy._id) ? `${topScoreByVacancy.get(vacancy._id)}%` : "—"}</p><p className="text-xs text-muted-foreground">mejor evaluación</p></div>
                </div>
              </div>
            ))}
            {!loading && activeVacancies.length === 0 && <p className="text-sm text-muted-foreground">No hay plazas publicadas. Crea una desde Plazas.</p>}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Estado de análisis</h2>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between rounded-lg bg-muted/40 p-3"><span>Completados</span><strong>{candidates.filter((candidate) => candidate.analysis?.status === "completed").length}</strong></div>
            <div className="flex justify-between rounded-lg bg-muted/40 p-3"><span>En cola o procesando</span><strong>{candidates.filter((candidate) => candidate.analysis?.status === "queued" || candidate.analysis?.status === "processing").length}</strong></div>
            <div className="flex justify-between rounded-lg bg-muted/40 p-3"><span>Fallidos</span><strong>{candidates.filter((candidate) => candidate.analysis?.status === "failed").length}</strong></div>
            <div className="flex justify-between rounded-lg bg-muted/40 p-3"><span>Sin solicitar</span><strong>{candidates.filter((candidate) => !candidate.analysis || candidate.analysis.status === "not_requested").length}</strong></div>
          </div>
        </motion.section>
      </div>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Postulaciones recientes</h2>
        <div className="mt-4 space-y-3">
          {recentCandidates.map((candidate) => (
            <div key={candidate._id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
              <div><p className="text-sm font-medium">{candidate.name}</p><p className="text-xs text-muted-foreground">{candidate.vacancy?.title ?? "Plaza no disponible"} · {new Date(candidate.createdAt).toLocaleDateString("es-GT")}</p></div>
              <span className="text-sm font-medium text-primary">{candidate.analysis?.status === "completed" && candidate.analysis.isValidCV !== false && typeof candidate.analysis.score === "number" ? `${candidate.analysis.score}%` : "Sin calificación"}</span>
            </div>
          ))}
          {!loading && recentCandidates.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay postulaciones.</p>}
        </div>
      </motion.section>
    </div>
  );
};

export default Dashboard;
