import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Search, MapPin, Clock, Users, MoreHorizontal, Link as LinkIcon, ExternalLink, ArchiveRestore, Eye, RefreshCw, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiBlob, ApiClientError } from "@/lib/api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Plaza {
  id: string;
  publicId?: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string;
  cvCount: number;
  analyzedCount: number;
  topScore: number | null;
  averageScore: number | null;
  status: "draft" | "published" | "closed";
  createdAt: string;
}

interface PlazaPreset {
  title: string;
  department: string;
  salary: string;
  description: string;
  requirements: string;
}

const plazaPresets: PlazaPreset[] = [
  { title: "Desarrollador Full Stack", department: "Tecnología", salary: "Q 12,000 - Q 18,000", description: "Desarrollador con experiencia en tecnologías frontend y backend para crear y mantener aplicaciones web.", requirements: "3+ años de experiencia, React, Node.js, PostgreSQL, Git" },
  { title: "Desarrollador Frontend", department: "Tecnología", salary: "Q 10,000 - Q 15,000", description: "Desarrollador frontend para crear interfaces de usuario modernas y responsivas.", requirements: "2+ años de experiencia, React/Angular/Vue, CSS/Tailwind, TypeScript" },
  { title: "Desarrollador Backend", department: "Tecnología", salary: "Q 12,000 - Q 16,000", description: "Desarrollador backend para diseñar y construir APIs y servicios.", requirements: "3+ años de experiencia, Node.js/Python/Java, bases de datos SQL y NoSQL" },
  { title: "Diseñador UX/UI", department: "Producto", salary: "Q 10,000 - Q 15,000", description: "Diseñador para crear experiencias de usuario excepcionales y sistemas de diseño.", requirements: "Figma, diseño de sistemas, investigación de usuario, prototipado" },
  { title: "Analista Contable", department: "Finanzas", salary: "Q 8,000 - Q 12,000", description: "Analista para manejo de cuentas, reportes financieros y cumplimiento fiscal.", requirements: "CPA, 2+ años experiencia, Excel avanzado, conocimiento de leyes fiscales GT" },
  { title: "Ejecutivo de Ventas", department: "Ventas", salary: "Q 6,000 - Q 10,000 + comisiones", description: "Ejecutivo comercial para gestión de cartera de clientes y nuevos negocios.", requirements: "Experiencia en ventas B2B, CRM, habilidades de negociación" },
  { title: "Asistente Administrativo", department: "Administración", salary: "Q 5,000 - Q 7,000", description: "Asistente para apoyo en tareas administrativas y gestión de oficina.", requirements: "Bachiller, manejo de Office, organización, atención al detalle" },
  { title: "Analista de Recursos Humanos", department: "Recursos Humanos", salary: "Q 8,000 - Q 12,000", description: "Analista para gestión de talento, planilla y procesos de RH.", requirements: "Licenciatura en Psicología Industrial o afín, 2+ años experiencia en RH" },
  { title: "Gerente de Proyecto", department: "Operaciones", salary: "Q 15,000 - Q 22,000", description: "Gerente para liderar proyectos estratégicos y equipos multidisciplinarios.", requirements: "PMP deseable, 5+ años experiencia, liderazgo, metodologías ágiles" },
  { title: "Community Manager", department: "Marketing", salary: "Q 6,000 - Q 9,000", description: "Gestión de redes sociales, creación de contenido y estrategia digital.", requirements: "Experiencia en redes sociales, copywriting, herramientas de diseño básico" },
];

const workTypeToApi: Record<string, "full_time" | "part_time" | "contract" | "remote"> = {
  "Tiempo Completo": "full_time",
  "Medio Tiempo": "part_time",
  Contrato: "contract",
  Remoto: "remote",
};

type ApiVacancy = { _id: string; publicId?: string; title: string; department: string; location: string; workType: "full_time" | "part_time" | "contract" | "remote"; salaryMin?: number; salaryMax?: number; description: string; requirements: string[]; status: "draft" | "published" | "closed"; createdAt: string; metrics?: { applicationCount: number; analyzedCount: number; topScore: number | null; averageScore: number | null } };
type ApiCandidate = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  cvText?: string;
  emailMessageId?: string;
  sourceDocument?: { originalName?: string; mimeType?: string };
  createdAt: string;
  analysis: {
    status: "not_requested" | "queued" | "processing" | "completed" | "failed";
    score?: number;
    confidence?: number;
    isValidCV?: boolean;
    securityStatus?: string;
    securityFlags?: string[];
    summary?: string;
    strengths?: string[];
    gaps?: string[];
    recommendation?: "advance" | "review" | "reject";
    error?: string;
    completedAt?: string;
  };
};

const scoreFor = (candidate: ApiCandidate): number | null =>
  candidate.analysis.status === "completed" && candidate.analysis.isValidCV !== false && typeof candidate.analysis.score === "number"
    ? candidate.analysis.score
    : null;

const analysisStatusLabel: Record<ApiCandidate["analysis"]["status"], string> = {
  not_requested: "Sin solicitar",
  queued: "En cola",
  processing: "Analizando",
  completed: "Analizado",
  failed: "Falló el análisis",
};

const statusFor = (candidate: ApiCandidate) => candidate.analysis.isValidCV === false
  ? "CV no válido"
  : analysisStatusLabel[candidate.analysis.status];

const recommendationLabel = { advance: "Avanzar", review: "Revisar", reject: "No priorizar" };

const toPlaza = (vacancy: ApiVacancy): Plaza => ({
  id: vacancy._id,
  publicId: vacancy.publicId,
  title: vacancy.title,
  department: vacancy.department,
  location: vacancy.location,
  type: vacancy.workType === "full_time" ? "Tiempo Completo" : vacancy.workType === "part_time" ? "Medio Tiempo" : vacancy.workType === "remote" ? "Remoto" : "Contrato",
  salary: vacancy.salaryMin !== undefined || vacancy.salaryMax !== undefined ? `Q ${vacancy.salaryMin?.toLocaleString("es-GT") ?? "—"} - Q ${vacancy.salaryMax?.toLocaleString("es-GT") ?? "—"}` : "A convenir",
  description: vacancy.description,
  requirements: vacancy.requirements.join(", "),
  cvCount: vacancy.metrics?.applicationCount ?? 0,
  analyzedCount: vacancy.metrics?.analyzedCount ?? 0,
  topScore: vacancy.metrics?.topScore ?? null,
  averageScore: vacancy.metrics?.averageScore ?? null,
  status: vacancy.status,
  createdAt: new Date(vacancy.createdAt).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" }),
});

const Plazas = () => {
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedPlazaId, setSelectedPlazaId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<ApiCandidate | null>(null);
  const [loadingVacancies, setLoadingVacancies] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [newPlaza, setNewPlaza] = useState({ title: "", department: "", location: "", type: "Tiempo Completo", salary: "", description: "", requirements: "" });
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ApiCandidate[]>([]);
  const [companySlug, setCompanySlug] = useState("");
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const selectedPlaza = plazas.find((plaza) => plaza.id === selectedPlazaId) ?? null;

  const loadVacancies = useCallback(async () => {
    setLoadingVacancies(true);
    try {
      const [vacancies, tenant] = await Promise.all([
        api<{ data: ApiVacancy[] }>("/vacancies"),
        api<{ data: { slug: string } }>("/tenants/current"),
      ]);
      setPlazas(vacancies.data.map(toPlaza));
      setCompanySlug(tenant.data.slug);
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No se pudieron cargar las plazas");
    } finally {
      setLoadingVacancies(false);
    }
  }, []);

  const loadCandidates = useCallback(async (vacancyId: string, signal?: AbortSignal) => {
    setLoadingCandidates(true);
    try {
      const response = await api<{ data: ApiCandidate[] }>(`/candidates?vacancyId=${encodeURIComponent(vacancyId)}`, { signal });
      if (signal?.aborted) return;
      setCandidates(response.data);
      setError(null);
    } catch (caught) {
      if (signal?.aborted) return;
      setError(caught instanceof ApiClientError ? caught.message : "No se pudieron cargar las postulaciones");
    } finally {
      if (!signal?.aborted) setLoadingCandidates(false);
    }
  }, []);

  useEffect(() => { void loadVacancies(); }, [loadVacancies]);

  useEffect(() => {
    if (!selectedPlazaId) {
      setCandidates([]);
      setLoadingCandidates(false);
      return;
    }
    setCandidates([]);
    const controller = new AbortController();
    void loadCandidates(selectedPlazaId, controller.signal);
    return () => controller.abort();
  }, [selectedPlazaId, loadCandidates]);

  useEffect(() => {
    if (!selectedCandidateId) {
      setCandidateDetail(null);
      return;
    }
    let active = true;
    setCandidateDetail(null);
    setLoadingDetail(true);
    api<{ data: ApiCandidate }>(`/candidates/${selectedCandidateId}`)
      .then((response) => { if (active) setCandidateDetail(response.data); })
      .catch((caught) => { if (active) setError(caught instanceof ApiClientError ? caught.message : "No se pudo cargar la postulación"); })
      .finally(() => { if (active) setLoadingDetail(false); });
    return () => { active = false; };
  }, [selectedCandidateId]);

  const handleSelectPreset = (presetTitle: string) => {
    setSelectedPreset(presetTitle);
    const preset = plazaPresets.find(p => p.title === presetTitle);
    if (preset) {
      setNewPlaza({
        title: preset.title,
        department: preset.department,
        location: "",
        type: "Tiempo Completo",
        salary: preset.salary,
        description: preset.description,
        requirements: preset.requirements,
      });
    }
  };

  const handleCreatePlaza = async () => {
    const salaryValues = (newPlaza.salary.match(/[\d,]+/g) ?? []).map((value) => Number(value.replace(/,/g, "")));
    try {
      const response = await api<{ data: ApiVacancy }>("/vacancies", {
        method: "POST",
        body: JSON.stringify({ title: newPlaza.title, department: newPlaza.department, location: newPlaza.location, workType: workTypeToApi[newPlaza.type], salaryMin: salaryValues[0], salaryMax: salaryValues[1], description: newPlaza.description, requirements: newPlaza.requirements.split(",").map((value) => value.trim()).filter(Boolean), status: "published" }),
      });
      setPlazas((current) => [toPlaza(response.data), ...current]);
      setShowNewDialog(false);
      setNewPlaza({ title: "", department: "", location: "", type: "Tiempo Completo", salary: "", description: "", requirements: "" });
      setSelectedPreset("");
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No se pudo crear la plaza");
    }
  };

  async function updateStatus(plaza: Plaza) {
    const nextStatus = plaza.status === "published" ? "closed" : "published";
    try {
      const response = await api<{ data: ApiVacancy }>(`/vacancies/${plaza.id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
      const saved = toPlaza(response.data);
      setPlazas((current) => current.map((item) => item.id === plaza.id ? { ...saved, cvCount: item.cvCount, analyzedCount: item.analyzedCount, topScore: item.topScore, averageScore: item.averageScore } : item));
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No se pudo actualizar la plaza");
    }
  }

  async function generatePublicLink(plaza: Plaza) {
    if (!companySlug) return setError("No se pudo identificar la empresa para generar el enlace");
    try {
      const response = await api<{ data: { publicId: string } }>(`/vacancies/${plaza.id}/public-link`, { method: "POST" });
      const publicId = response.data.publicId;
      setPlazas((current) => current.map((item) => item.id === plaza.id ? { ...item, publicId } : item));
      const link = `${window.location.origin}/postular/${companySlug}/${publicId}`;
      setPublicLink(link);
      try { await navigator.clipboard.writeText(link); } catch { /* The dialog still exposes the link for manual copy. */ }
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No se pudo generar el enlace público");
    }
  }

  function openPublicForm(plaza: Plaza) {
    if (!companySlug || !plaza.publicId) return setError("No se pudo abrir el formulario de esta plaza");
    window.open(`${window.location.origin}/postular/${companySlug}/${plaza.publicId}`, "_blank", "noopener,noreferrer");
  }

  async function refresh() {
    await loadVacancies();
    if (selectedPlazaId) await loadCandidates(selectedPlazaId);
  }

  async function downloadCV(candidate: ApiCandidate) {
    try {
      const blob = await apiBlob(`/candidates/${candidate._id}/document`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = candidate.sourceDocument?.originalName || "cv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No se pudo descargar el CV");
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success bg-success/10";
    if (score >= 60) return "text-warning bg-warning/10";
    return "text-destructive bg-destructive/10";
  };

  const filteredPlazas = plazas.filter((p) => `${p.title} ${p.department} ${p.location}`.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalCVs = plazas.reduce((total, plaza) => total + plaza.cvCount, 0);
  const totalAnalyzed = plazas.reduce((total, plaza) => total + plaza.analyzedCount, 0);
  const sortedCandidates = [...candidates].sort((a, b) => {
    const aScore = scoreFor(a);
    const bScore = scoreFor(b);
    if (aScore !== null && bScore !== null) return bScore - aScore || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (aScore !== null) return -1;
    if (bScore !== null) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Plazas</h1>
          <p className="text-muted-foreground">Gestiona vacantes y revisa las postulaciones reales de cada plaza.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refresh()} className="gap-2"><RefreshCw className="h-4 w-4" /> Actualizar</Button>
          <Button onClick={() => setShowNewDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> Nueva plaza</Button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Plazas publicadas</p><p className="mt-1 text-2xl font-bold">{loadingVacancies ? "—" : plazas.filter((plaza) => plaza.status === "published").length}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">CVs recibidos</p><p className="mt-1 text-2xl font-bold">{loadingVacancies ? "—" : totalCVs}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Análisis completados</p><p className="mt-1 text-2xl font-bold">{loadingVacancies ? "—" : totalAnalyzed}{!loadingVacancies && <span className="ml-2 text-sm font-normal text-muted-foreground">de {totalCVs} · {totalCVs ? Math.round(totalAnalyzed / totalCVs * 100) : 0}%</span>}</p></div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar plazas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {filteredPlazas.map((plaza, i) => (
            <motion.div key={plaza.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md cursor-pointer" onClick={() => setSelectedPlazaId(plaza.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedPlazaId(plaza.id); } }} aria-label={`Ver postulaciones de ${plaza.title}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-lg font-semibold text-card-foreground">{plaza.title}</h3>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{plaza.status === "published" ? "Publicada" : plaza.status === "draft" ? "Borrador" : "Cerrada"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {plaza.department}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {plaza.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {plaza.type}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{plaza.salary}</p>
                  <p className="text-xs text-muted-foreground">{plaza.analyzedCount} de {plaza.cvCount} CVs analizados ({plaza.cvCount ? Math.round(plaza.analyzedCount / plaza.cvCount * 100) : 0}%)</p>
                </div>
                  <div className="flex flex-wrap items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-card-foreground">{plaza.cvCount}</p>
                    <p className="text-xs text-muted-foreground">CVs recibidos</p>
                  </div>
                    <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{plaza.topScore === null ? "—" : `${plaza.topScore}%`}</p>
                      <p className="text-xs text-muted-foreground">mejor evaluación</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()} aria-label={`Opciones de ${plaza.title}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenuItem onClick={() => setSelectedPlazaId(plaza.id)}><Eye className="mr-2 h-4 w-4" /> Ver postulaciones</DropdownMenuItem>
                        <DropdownMenuItem disabled={plaza.status !== "published"} onClick={() => void generatePublicLink(plaza)}><LinkIcon className="mr-2 h-4 w-4" /> Generar enlace</DropdownMenuItem>
                        <DropdownMenuItem disabled={plaza.status !== "published"} onClick={() => openPublicForm(plaza)}><ExternalLink className="mr-2 h-4 w-4" /> Abrir formulario público</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => void updateStatus(plaza)}><ArchiveRestore className="mr-2 h-4 w-4" /> {plaza.status === "closed" ? "Reabrir plaza" : plaza.status === "draft" ? "Publicar plaza" : "Cerrar plaza"}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loadingVacancies && <p className="text-sm text-muted-foreground">Cargando plazas…</p>}
        {!loadingVacancies && filteredPlazas.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">{plazas.length === 0 ? "Aún no hay plazas. Crea la primera para recibir postulaciones." : "No hay plazas que coincidan con la búsqueda."}</p>}
      </div>

      {/* New Plaza Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Publicar Nueva Plaza</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Preset Selector */}
            <div className="space-y-2">
              <Label>Seleccionar puesto predeterminado (opcional)</Label>
              <Select value={selectedPreset} onValueChange={handleSelectPreset}>
                <SelectTrigger><SelectValue placeholder="Elegir un puesto predeterminado..." /></SelectTrigger>
                <SelectContent>
                  {plazaPresets.map(p => (
                    <SelectItem key={p.title} value={p.title}>{p.title} — {p.department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPreset && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                ✨ Campos pre-rellenados. Puedes editarlos según necesites.
              </div>
            )}

            <div className="space-y-2">
              <Label>Título del puesto</Label>
              <Input value={newPlaza.title} onChange={(e) => setNewPlaza({ ...newPlaza, title: e.target.value })} placeholder="Ej: Desarrollador Frontend" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Input value={newPlaza.department} onChange={(e) => setNewPlaza({ ...newPlaza, department: e.target.value })} placeholder="Ej: Tecnología" />
              </div>
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input value={newPlaza.location} onChange={(e) => setNewPlaza({ ...newPlaza, location: e.target.value })} placeholder="Ej: Guatemala City" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newPlaza.type} onValueChange={(v) => setNewPlaza({ ...newPlaza, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tiempo Completo">Tiempo Completo</SelectItem>
                    <SelectItem value="Medio Tiempo">Medio Tiempo</SelectItem>
                    <SelectItem value="Contrato">Contrato</SelectItem>
                    <SelectItem value="Remoto">Remoto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Salario</Label>
                <Input value={newPlaza.salary} onChange={(e) => setNewPlaza({ ...newPlaza, salary: e.target.value })} placeholder="Ej: Q 8,000 - Q 12,000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={newPlaza.description} onChange={(e) => setNewPlaza({ ...newPlaza, description: e.target.value })} placeholder="Describe el puesto..." />
            </div>
            <div className="space-y-2">
              <Label>Requisitos (la IA usará esto para calificar CVs)</Label>
              <Textarea value={newPlaza.requirements} onChange={(e) => setNewPlaza({ ...newPlaza, requirements: e.target.value })} placeholder="Ej: 3 años de experiencia, React, Node.js..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreatePlaza} className="gap-2" disabled={!newPlaza.title || !newPlaza.department || !newPlaza.location || newPlaza.description.length < 20}>
              <Plus className="h-4 w-4" /> Publicar plaza
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPlaza} onOpenChange={(open) => { if (!open) { setSelectedPlazaId(null); setSelectedCandidateId(null); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedPlaza && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">Postulaciones: {selectedPlaza.title}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedPlaza.cvCount} recibidas · {selectedPlaza.analyzedCount} analizadas{selectedPlaza.averageScore !== null ? ` · promedio ${selectedPlaza.averageScore}%` : ""}</p>
              </DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">Ordenadas por calificación de IA; las pendientes aparecen después.</p>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => void refresh()}><RefreshCw className="h-4 w-4" /> Actualizar</Button>
              </div>
              {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <div className="space-y-3 py-2">
                {sortedCandidates.map((candidate, index) => {
                  const score = scoreFor(candidate);
                  return (
                  <div key={candidate._id} className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-accent/30">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <p className="font-semibold text-foreground">{score !== null ? `#${index + 1} · ` : ""}{candidate.name}</p>
                        <p className="text-sm text-muted-foreground">{candidate.email} · {new Date(candidate.createdAt).toLocaleDateString("es-GT")}</p>
                        <p className="max-w-lg text-sm text-muted-foreground">{candidate.analysis.summary ?? statusFor(candidate)}</p>
                        <Button size="sm" variant="outline" onClick={() => setSelectedCandidateId(candidate._id)}><Eye className="mr-2 h-4 w-4" /> Ver detalles</Button>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`inline-flex rounded-lg px-3 py-1.5 text-lg font-bold ${score === null ? "bg-muted text-muted-foreground" : getScoreColor(score)}`}>{score === null ? "—" : `${score}%`}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{score === null ? statusFor(candidate) : "calificación IA"}</p>
                      </div>
                    </div>
                  </div>
                ); })}
                {loadingCandidates && <p className="text-sm text-muted-foreground">Cargando postulaciones…</p>}
                {!loadingCandidates && candidates.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay postulaciones para esta plaza. Comparte su enlace público para recibir CVs.</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCandidateId} onOpenChange={(open) => { if (!open) setSelectedCandidateId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Detalle de la postulación</DialogTitle></DialogHeader>
          {loadingDetail && <p className="text-sm text-muted-foreground">Cargando detalles…</p>}
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {candidateDetail && (
            <div className="space-y-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-lg font-semibold">{candidateDetail.name}</h3><p className="text-muted-foreground">{candidateDetail.email}{candidateDetail.phone ? ` · ${candidateDetail.phone}` : ""}</p><p className="text-xs text-muted-foreground">Recibido el {new Date(candidateDetail.createdAt).toLocaleString("es-GT")}{candidateDetail.emailMessageId ? " · por correo" : ""}</p></div>
                <div className="text-right"><p className="text-2xl font-bold text-primary">{scoreFor(candidateDetail) === null ? "—" : `${scoreFor(candidateDetail)}%`}</p><p className="text-xs text-muted-foreground">{statusFor(candidateDetail)}</p></div>
              </div>
              {candidateDetail.analysis.recommendation && <p><span className="font-medium">Recomendación de IA:</span> {recommendationLabel[candidateDetail.analysis.recommendation]}</p>}
              {candidateDetail.analysis.confidence !== undefined && <p><span className="font-medium">Confianza del análisis:</span> {Math.round(candidateDetail.analysis.confidence * 100)}%</p>}
              {candidateDetail.analysis.summary && <section><h4 className="font-semibold">Resumen</h4><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{candidateDetail.analysis.summary}</p></section>}
              {Boolean(candidateDetail.analysis.strengths?.length) && <section><h4 className="font-semibold">Fortalezas</h4><ul className="mt-1 list-inside list-disc text-muted-foreground">{candidateDetail.analysis.strengths?.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>}
              {Boolean(candidateDetail.analysis.gaps?.length) && <section><h4 className="font-semibold">Brechas y recomendaciones</h4><ul className="mt-1 list-inside list-disc text-muted-foreground">{candidateDetail.analysis.gaps?.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>}
              {candidateDetail.analysis.securityStatus && candidateDetail.analysis.securityStatus !== "clean" && <section className="rounded-lg border border-warning/30 bg-warning/10 p-3"><h4 className="font-semibold">Revisión de seguridad: {candidateDetail.analysis.securityStatus}</h4>{candidateDetail.analysis.securityFlags?.map((flag, index) => <p key={`${index}-${flag}`} className="text-muted-foreground">{flag}</p>)}</section>}
              {candidateDetail.analysis.error && <p className="rounded-lg bg-destructive/10 p-3 text-destructive">{candidateDetail.analysis.error}</p>}
              {candidateDetail.cvText && <section><h4 className="font-semibold">Texto del CV</h4><div className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-muted-foreground">{candidateDetail.cvText}</div></section>}
              {candidateDetail.sourceDocument?.originalName && <section className="flex flex-wrap items-center gap-3"><FileText className="h-4 w-4" /><span>{candidateDetail.sourceDocument.originalName}</span><Button size="sm" variant="outline" className="gap-2" onClick={() => void downloadCV(candidateDetail)}><Download className="h-4 w-4" /> Descargar CV</Button></section>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!publicLink} onOpenChange={() => setPublicLink(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="font-display">Enlace público de postulación</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Comparte este enlace con los candidatos. No requiere inicio de sesión.</p>
          <Input readOnly value={publicLink ?? ""} onFocus={(event) => event.currentTarget.select()} />
          <DialogFooter><Button onClick={() => setPublicLink(null)}>Listo</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Plazas;
