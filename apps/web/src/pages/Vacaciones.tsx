import { motion } from "framer-motion";
import { CalendarDays, Sun, Clock, CheckCircle2 } from "lucide-react";

interface VacacionEmpleado {
  id: number;
  nombre: string;
  puesto: string;
  fechaIngreso: string;
  aniosTrabajados: number;
  diasCorrespondientes: number;
  diasTomados: number;
  diasDisponibles: number;
  proximoAniversario: string;
  estado: "disponible" | "en-vacaciones" | "agotadas";
}

const empleadosVac: VacacionEmpleado[] = [
  { id: 1, nombre: "Carlos López", puesto: "Gerente de TI", fechaIngreso: "15 Ene 2020", aniosTrabajados: 6, diasCorrespondientes: 15, diasTomados: 5, diasDisponibles: 10, proximoAniversario: "15 Ene 2027", estado: "disponible" },
  { id: 2, nombre: "Ana Martínez", puesto: "Contadora", fechaIngreso: "3 Mar 2021", aniosTrabajados: 5, diasCorrespondientes: 15, diasTomados: 15, diasDisponibles: 0, proximoAniversario: "3 Mar 2027", estado: "agotadas" },
  { id: 3, nombre: "José García", puesto: "Desarrollador Sr", fechaIngreso: "20 Jul 2019", aniosTrabajados: 6, diasCorrespondientes: 15, diasTomados: 8, diasDisponibles: 7, proximoAniversario: "20 Jul 2026", estado: "en-vacaciones" },
  { id: 4, nombre: "María Pérez", puesto: "Diseñadora UX", fechaIngreso: "8 Sep 2022", aniosTrabajados: 3, diasCorrespondientes: 15, diasTomados: 3, diasDisponibles: 12, proximoAniversario: "8 Sep 2026", estado: "disponible" },
  { id: 5, nombre: "Roberto Sánchez", puesto: "Analista RH", fechaIngreso: "12 Feb 2021", aniosTrabajados: 5, diasCorrespondientes: 15, diasTomados: 10, diasDisponibles: 5, proximoAniversario: "12 Feb 2027", estado: "disponible" },
  { id: 6, nombre: "Lucía Herrera", puesto: "Asistente Admin", fechaIngreso: "5 Jun 2023", aniosTrabajados: 2, diasCorrespondientes: 15, diasTomados: 0, diasDisponibles: 15, proximoAniversario: "5 Jun 2026", estado: "disponible" },
];

const estadoStyles: Record<string, string> = {
  "disponible": "bg-success/10 text-success",
  "en-vacaciones": "bg-warning/10 text-warning",
  "agotadas": "bg-destructive/10 text-destructive",
};

const estadoLabel: Record<string, string> = {
  "disponible": "Disponible",
  "en-vacaciones": "En Vacaciones",
  "agotadas": "Agotadas",
};

const Vacaciones = () => {
  const totalDisponibles = empleadosVac.reduce((s, e) => s + e.diasDisponibles, 0);
  const enVacaciones = empleadosVac.filter(e => e.estado === "en-vacaciones").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Vacaciones</h1>
        <p className="text-muted-foreground">Cálculo automático según el Código de Trabajo de Guatemala — 15 días hábiles por año laborado</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Total Días Disponibles</p>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-card-foreground">{totalDisponibles} días</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-warning" />
            <p className="text-sm font-medium text-muted-foreground">En Vacaciones</p>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-warning">{enVacaciones} empleados</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="text-sm font-medium text-muted-foreground">Empleados</p>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-card-foreground">{empleadosVac.length}</p>
        </motion.div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Clock className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-semibold text-foreground text-sm">Cálculo Automático</p>
          <p className="text-sm text-muted-foreground">Las vacaciones se calculan automáticamente según la fecha de ingreso. En Guatemala, todo trabajador tiene derecho a 15 días hábiles de vacaciones remuneradas después de cada año de trabajo continuo.</p>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Empleado</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Fecha Ingreso</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Años</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Días Corresp.</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Tomados</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Disponibles</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Próx. Aniversario</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {empleadosVac.map((emp) => (
                <tr key={emp.id} className="border-b border-border last:border-0 transition-colors hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-card-foreground">{emp.nombre}</p>
                    <p className="text-xs text-muted-foreground">{emp.puesto}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.fechaIngreso}</td>
                  <td className="px-4 py-3 text-center text-card-foreground font-medium">{emp.aniosTrabajados}</td>
                  <td className="px-4 py-3 text-center text-card-foreground">{emp.diasCorrespondientes}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{emp.diasTomados}</td>
                  <td className="px-4 py-3 text-center font-bold text-primary">{emp.diasDisponibles}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.proximoAniversario}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoStyles[emp.estado]}`}>
                      {estadoLabel[emp.estado]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Per-employee progress bars */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {empleadosVac.map((emp, i) => (
          <motion.div key={emp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04 }} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-card-foreground text-sm">{emp.nombre}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${estadoStyles[emp.estado]}`}>{estadoLabel[emp.estado]}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(emp.diasTomados / emp.diasCorrespondientes) * 100}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
              <span>{emp.diasTomados} tomados</span>
              <span>{emp.diasDisponibles} disponibles</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Vacaciones;
