import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { BriefcaseBusiness, CheckCircle2, FileUp } from "lucide-react";
import { ApiClientError, publicApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PublicVacancy = { company: string; vacancy: { id: string; title: string; department: string; location: string; workType: string; salaryMin?: number; salaryMax?: number; description: string; requirements: string[] } };

export default function PublicApplication() {
  const { companySlug, vacancyId } = useParams();
  const [vacancy, setVacancy] = useState<PublicVacancy | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", cvText: "" });
  const [document, setDocument] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companySlug || !vacancyId) return;
    publicApi<{ data: PublicVacancy }>(`/public/companies/${companySlug}/vacancies/${vacancyId}`)
      .then((response) => setVacancy(response.data))
      .catch((caught) => setError(caught instanceof ApiClientError ? "Esta plaza ya no está disponible." : "No se pudo cargar la plaza."))
      .finally(() => setLoading(false));
  }, [companySlug, vacancyId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!companySlug || !vacancyId) return;
    setError(null);
    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      if (form.phone) payload.append("phone", form.phone);
      if (form.cvText) payload.append("cvText", form.cvText);
      if (document) payload.append("document", document);
      await publicApi(`/public/companies/${companySlug}/vacancies/${vacancyId}/applications`, { method: "POST", body: payload });
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No fue posible enviar tu postulación.");
    }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Cargando plaza…</main>;
  if (error && !vacancy) return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="max-w-md rounded-xl border border-destructive/20 bg-card p-8 text-center"><h1 className="font-display text-2xl font-bold">Plaza no disponible</h1><p className="mt-2 text-muted-foreground">{error}</p></div></main>;
  if (!vacancy) return null;
  if (submitted) return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="max-w-lg rounded-2xl border border-border bg-card p-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-success" /><h1 className="mt-4 font-display text-3xl font-bold">¡Postulación recibida!</h1><p className="mt-2 text-muted-foreground">Gracias por postularte a {vacancy.vacancy.title}. El equipo de {vacancy.company} revisará tu información.</p></div></main>;

  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6"><div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.2fr]"><section className="rounded-2xl border border-border bg-card p-6"><p className="text-sm font-medium text-primary">{vacancy.company}</p><h1 className="mt-2 font-display text-3xl font-bold">{vacancy.vacancy.title}</h1><div className="mt-4 space-y-2 text-sm text-muted-foreground"><p>{vacancy.vacancy.department} · {vacancy.vacancy.location}</p><p>{vacancy.vacancy.workType}</p>{(vacancy.vacancy.salaryMin !== undefined || vacancy.vacancy.salaryMax !== undefined) && <p>Salario: Q {vacancy.vacancy.salaryMin?.toLocaleString("es-GT") ?? "—"} - Q {vacancy.vacancy.salaryMax?.toLocaleString("es-GT") ?? "—"}</p>}</div><h2 className="mt-7 font-display text-lg font-semibold">Descripción</h2><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{vacancy.vacancy.description}</p><h2 className="mt-7 font-display text-lg font-semibold">Requisitos</h2><ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">{vacancy.vacancy.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul></section><section className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-semibold">Postúlate a esta plaza</h2></div><p className="mt-1 text-sm text-muted-foreground">Tus datos serán compartidos únicamente con la empresa contratante.</p>{error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<form onSubmit={submit} className="mt-5 space-y-4"><div className="space-y-2"><Label htmlFor="applicant-name">Nombre completo</Label><Input id="applicant-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="applicant-email">Correo electrónico</Label><Input id="applicant-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="applicant-phone">Teléfono</Label><Input id="applicant-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="applicant-file">CV adjunto</Label><Input id="applicant-file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setDocument(event.target.files?.[0] ?? null)} /><p className="text-xs text-muted-foreground">PDF, DOC o DOCX; máximo 10 MB.</p></div><div className="space-y-2"><Label htmlFor="applicant-cv-text">O pega el texto de tu CV</Label><Textarea id="applicant-cv-text" value={form.cvText} onChange={(event) => setForm({ ...form, cvText: event.target.value })} /></div><Button disabled={!form.name || !form.email || (!document && !form.cvText)} className="w-full gap-2"><FileUp className="h-4 w-4" /> Enviar postulación</Button></form></section></div></main>;
}
