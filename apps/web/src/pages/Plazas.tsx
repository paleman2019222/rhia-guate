import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Search, MapPin, Clock, Users, MoreHorizontal, Link as LinkIcon, ExternalLink, ArchiveRestore, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiClientError } from "@/lib/api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Plaza {
  id: string | number;
  publicId?: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string;
  cvCount: number;
  topScore: number;
  status: "active" | "closed";
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

type ApiVacancy = { _id: string; publicId?: string; title: string; department: string; location: string; workType: "full_time" | "part_time" | "contract" | "remote"; salaryMin?: number; salaryMax?: number; description: string; requirements: string[]; status: "draft" | "published" | "closed"; createdAt: string };
type ApiCandidate = { _id: string; name: string; email: string; analysis: { status: string; score?: number; summary?: string; strengths?: string[] } };

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
  cvCount: 0,
  topScore: 0,
  status: vacancy.status === "closed" ? "closed" : "active",
  createdAt: new Date(vacancy.createdAt).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" }),
});

const Plazas = () => {
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedPlaza, setSelectedPlaza] = useState<Plaza | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [newPlaza, setNewPlaza] = useState({ title: "", department: "", location: "", type: "Tiempo Completo", salary: "", description: "", requirements: "" });
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ApiCandidate[]>([]);
  const [companySlug, setCompanySlug] = useState("");
  const [publicLink, setPublicLink] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api<{ data: ApiVacancy[] }>("/vacancies"), api<{ data: { slug: string } }>("/tenants/current")])
      .then(([vacancies, tenant]) => { setPlazas(vacancies.data.map(toPlaza)); setCompanySlug(tenant.data.slug); })
      .catch((caught) => setError(caught instanceof ApiClientError ? caught.message : "No se pudieron cargar las plazas"));
  }, []);

  useEffect(() => {
    if (!selectedPlaza) {
      setCandidates([]);
      return;
    }
    api<{ data: ApiCandidate[] }>(`/candidates?vacancyId=${encodeURIComponent(String(selectedPlaza.id))}`)
      .then((response) => setCandidates(response.data))
      .catch((caught) => setError(caught instanceof ApiClientError ? caught.message : "No se pudieron cargar los CVs"));
  }, [selectedPlaza]);

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
      setPlazas([toPlaza(response.data), ...plazas]);
      setShowNewDialog(false);
      setNewPlaza({ title: "", department: "", location: "", type: "Tiempo Completo", salary: "", description: "", requirements: "" });
      setSelectedPreset("");
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No se pudo crear la plaza");
    }
  };

  async function updateStatus(plaza: Plaza) {
    const nextStatus = plaza.status === "closed" ? "published" : "closed";
    try {
      const response = await api<{ data: ApiVacancy }>(`/vacancies/${plaza.id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
      const saved = toPlaza(response.data);
      setPlazas((current) => current.map((item) => item.id === plaza.id ? saved : item));
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success bg-success/10";
    if (score >= 60) return "text-warning bg-warning/10";
    return "text-destructive bg-destructive/10";
  };

  const getScoreBar = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  const filteredPlazas = plazas.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Plazas</h1>
          <p className="text-muted-foreground">Publica y gestiona tus vacantes con IA</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Plaza
        </Button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar plazas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {filteredPlazas.map((plaza, i) => (
            <motion.div key={plaza.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md cursor-pointer" onClick={() => setSelectedPlaza(plaza)}>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-lg font-semibold text-card-foreground">{plaza.title}</h3>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{plaza.status === "active" ? "Activa" : "Cerrada"}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {plaza.department}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {plaza.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {plaza.type}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{plaza.salary}</p>
                </div>
                  <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-card-foreground">{plaza.cvCount}</p>
                    <p className="text-xs text-muted-foreground">CVs recibidos</p>
                  </div>
                    <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{plaza.topScore}%</p>
                      <p className="text-xs text-muted-foreground">mejor match</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()} aria-label={`Opciones de ${plaza.title}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenuItem onClick={() => setSelectedPlaza(plaza)}><Eye className="mr-2 h-4 w-4" /> Ver candidatos</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void generatePublicLink(plaza)}><LinkIcon className="mr-2 h-4 w-4" /> Generar enlace</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void generatePublicLink(plaza)}><ExternalLink className="mr-2 h-4 w-4" /> Abrir formulario público</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => void updateStatus(plaza)}><ArchiveRestore className="mr-2 h-4 w-4" /> {plaza.status === "closed" ? "Reabrir plaza" : "Cerrar plaza"}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
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
              <Sparkles className="h-4 w-4" /> Publicar con IA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CV Review Dialog */}
      <Dialog open={!!selectedPlaza} onOpenChange={() => setSelectedPlaza(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedPlaza && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  CVs para: {selectedPlaza.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">Candidatos pre-seleccionados y calificados por IA según los requisitos del puesto</p>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {candidates.map((candidate) => (
                  <div key={candidate._id} className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-accent/30">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <p className="font-semibold text-foreground">{candidate.name}</p>
                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                        <p className="text-sm text-muted-foreground">{candidate.analysis.summary ?? "Pendiente de análisis"}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(candidate.analysis.strengths ?? []).map((h) => (
                            <span key={h} className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{h}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-lg font-bold ${getScoreColor(candidate.analysis.score ?? 0)}`}>{candidate.analysis.score ?? "—"}</div>
                        <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${getScoreBar(candidate.analysis.score ?? 0)}`} style={{ width: `${candidate.analysis.score ?? 0}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">coincidencia</p>
                      </div>
                    </div>
                  </div>
                ))}
                {candidates.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay candidatos para esta plaza. Puedes agregarlos desde Analizador CV.</p>}
              </div>
            </>
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
