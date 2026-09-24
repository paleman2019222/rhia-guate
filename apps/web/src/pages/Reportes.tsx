import { motion } from "framer-motion";
import { FileText, Download, TrendingUp, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const reportes = [
  { title: "Planilla Mensual", description: "Reporte detallado de salarios, deducciones y pagos del mes", icon: DollarSign, date: "Generado: Mar 2026" },
  { title: "Rotación de Personal", description: "Análisis de ingresos y egresos de empleados", icon: Users, date: "Generado: Mar 2026" },
  { title: "Análisis de Reclutamiento", description: "Estadísticas de plazas, CVs recibidos y contrataciones", icon: TrendingUp, date: "Generado: Mar 2026" },
  { title: "Vacaciones y Permisos", description: "Resumen de días tomados y pendientes por empleado", icon: FileText, date: "Generado: Mar 2026" },
];

const Reportes = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Genera y descarga reportes de tu equipo</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reportes.map((reporte, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-accent p-2.5">
                  <reporte.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-card-foreground">{reporte.title}</h3>
                  <p className="text-xs text-muted-foreground">{reporte.date}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{reporte.description}</p>
            </div>
            <Button variant="outline" className="mt-4 gap-2 self-start">
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Reportes;
