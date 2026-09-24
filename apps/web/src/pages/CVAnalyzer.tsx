import { useEffect, useState, type FormEvent } from "react";
import { Brain, FileUp, Sparkles } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Vacancy = { _id: string; title: string; status: string };
type Candidate = { _id: string; name: string; email: string; emailMessageId?: string; vacancy?: { title: string }; analysis: { status: string; score?: number; confidence?: number; isValidCV?: boolean; securityStatus?: string; securityFlags?: string[]; summary?: string; strengths?: string[]; gaps?: string[]; recommendation?: string } };
type Tenant = { plan?: { features?: { cvAnalyzer?: boolean; cvDocumentUpload?: boolean } } };

export default function CVAnalyzer() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [documentUploadEnabled, setDocumentUploadEnabled] = useState(false);
  const [form, setForm] = useState({ vacancyId: "", name: "", email: "", phone: "", cvText: "" });
  const [document, setDocument] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const [tenantResponse, vacancyResponse, candidateResponse] = await Promise.all([
        api<{ data: Tenant }>("/tenants/current"),
        api<{ data: Vacancy[] }>("/vacancies?status=published"),
        api<{ data: Candidate[] }>("/candidates"),
      ]);
      setEnabled(Boolean(tenantResponse.data.plan?.features?.cvAnalyzer));
      setDocumentUploadEnabled(Boolean(tenantResponse.data.plan?.features?.cvDocumentUpload));
      setVacancies(vacancyResponse.data);
      setCandidates(candidateResponse.data);
    } catch (error) {
      setMessage(error instanceof ApiClientError ? error.message : "No se pudo cargar el analizador");
    }
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => { if (value) payload.append(key, value); });
      if (document) payload.append("document", document);
      const created = await api<{ data: Candidate }>("/candidates", { method: "POST", body: payload });
      await api(`/candidates/${created.data._id}/analyze`, { method: "POST" });
      setForm({ vacancyId: "", name: "", email: "", phone: "", cvText: "" });
      setDocument(null);
      setMessage("CV enviado a análisis. El resultado aparecerá al completar el flujo de n8n.");
      await load();
    } catch (error) {
      setMessage(error instanceof ApiClientError ? error.message : "No se pudo enviar el CV");
    } finally {
      setLoading(false);
    }
  }

  if (enabled === false) {
    return <div className="rounded-xl border border-warning/30 bg-warning/10 p-6"><h1 className="font-display text-2xl font-bold">Analizador de CVs no incluido</h1><p className="mt-2 text-sm text-muted-foreground">Tu plan actual no tiene activa esta función. Un administrador de plataforma puede habilitarla desde el portal de planes.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div><h1 className="flex items-center gap-2 font-display text-3xl font-bold"><Brain className="h-7 w-7 text-primary" /> Analizador de CVs</h1><p className="mt-1 text-muted-foreground">Carga un CV, asócialo a una plaza y envíalo al flujo de evaluación de n8n.</p></div>
      {message && <p role="status" className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{message}</p>}
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Vacante publicada</Label><Select value={form.vacancyId} onValueChange={(vacancyId) => setForm({ ...form, vacancyId })}><SelectTrigger><SelectValue placeholder="Selecciona una plaza" /></SelectTrigger><SelectContent>{vacancies.map((vacancy) => <SelectItem key={vacancy._id} value={vacancy._id}>{vacancy.title}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="candidate-name">Nombre</Label><Input id="candidate-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
          <div className="space-y-2"><Label htmlFor="candidate-email">Correo</Label><Input id="candidate-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
          <div className="space-y-2"><Label htmlFor="candidate-phone">Teléfono</Label><Input id="candidate-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
        </div>
        <div className="space-y-2"><Label htmlFor="candidate-cv">Texto del CV</Label><Textarea id="candidate-cv" value={form.cvText} onChange={(event) => setForm({ ...form, cvText: event.target.value })} placeholder="Pega aquí el contenido del CV si no adjuntas un archivo." /></div>
        <div className="space-y-2"><Label htmlFor="candidate-document">Archivo CV (PDF, DOC o DOCX; máximo 10 MB)</Label><Input id="candidate-document" type="file" disabled={!documentUploadEnabled} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setDocument(event.target.files?.[0] ?? null)} />{!documentUploadEnabled && <p className="text-xs text-muted-foreground">La carga de documentos no está incluida en el plan actual; puedes pegar el texto del CV.</p>}</div>
        <Button disabled={loading || !form.vacancyId || !form.name || !form.email || (!form.cvText && !document)} className="gap-2"><FileUp className="h-4 w-4" />{loading ? "Enviando…" : "Enviar a análisis"}</Button>
      </form>
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Sparkles className="h-5 w-5 text-primary" /> Análisis recientes</h2>
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <div key={candidate._id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{candidate.name}</p>
                  <p className="text-sm text-muted-foreground">{candidate.email}</p>
                  <p className="text-sm text-muted-foreground">{candidate.vacancy?.title ?? "Plaza no disponible"}{candidate.emailMessageId ? " · Recibido por correo" : ""}</p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{candidate.analysis.status}</span>
              </div>
              {candidate.analysis.status === "completed" && (
                <div className="mt-3 space-y-1 text-sm">
                  <p>Puntaje: <strong>{candidate.analysis.score ?? 0}/100</strong> · Recomendación: <strong>{candidate.analysis.recommendation ?? "review"}</strong></p>
                  {candidate.analysis.confidence !== undefined && <p>Confianza: {Math.round(candidate.analysis.confidence * 100)}%</p>}
                  <p>{candidate.analysis.summary}</p>
                  {Boolean(candidate.analysis.strengths?.length) && <p>Fortalezas: {candidate.analysis.strengths?.join(", ")}</p>}
                  {Boolean(candidate.analysis.gaps?.length) && <p>Brechas: {candidate.analysis.gaps?.join(", ")}</p>}
                  {candidate.analysis.securityStatus && <p className={candidate.analysis.securityStatus === "clean" ? "text-success" : "text-warning"}>Seguridad: {candidate.analysis.securityStatus}{candidate.analysis.securityFlags?.length ? ` · ${candidate.analysis.securityFlags.join(", ")}` : ""}</p>}
                </div>
              )}
            </div>
          ))}
          {candidates.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay CVs enviados.</p>}
        </div>
      </section>
    </div>
  );
}
