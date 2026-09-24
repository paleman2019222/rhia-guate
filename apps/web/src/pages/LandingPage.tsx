import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Users, Brain, DollarSign, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Brain, title: "IA para Reclutamiento", description: "Analiza y califica CVs automáticamente. Pre-selección inteligente de candidatos con puntaje de 0 a 100." },
  { icon: Users, title: "Expediente Digital", description: "Toda la información de tus empleados en un solo lugar. Busca por DPI y accede al instante." },
  { icon: DollarSign, title: "Planilla Automática", description: "Calcula salarios, IGSS, ISR y deducciones automáticamente. En Quetzales, listo para Guatemala." },
  { icon: FileSearch, title: "Reportes Inteligentes", description: "Genera reportes de rotación, reclutamiento, vacaciones y más con un click." },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Rhia</span>
          </div>
          <Button onClick={() => navigate("/login")} className="gap-2">
            Ingresar <ArrowRight className="h-4 w-4" />
          </Button>
        </nav>

        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Potenciado por Inteligencia Artificial
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-tight text-foreground md:text-6xl">
              Recursos Humanos
              <br />
              <span className="text-gradient-primary">más inteligentes</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Rhia automatiza el análisis de CVs, gestión de expedientes y cálculo de planilla.
              Diseñado para equipos de RH en Guatemala.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate("/login")} className="gap-2 text-base px-8">
                Comenzar ahora <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8">
                Ver demo
              </Button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-foreground">Todo lo que necesitas</h2>
          <p className="mt-2 text-muted-foreground">Una plataforma completa para gestionar tu equipo</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-7 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 inline-flex rounded-xl bg-accent p-3">
                <feature.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold text-card-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-semibold text-foreground">Rhia</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Rhia. Hecho para Guatemala 🇬🇹</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
