import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, AlertTriangle, Clock, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface AsistenciaRecord {
  id: number;
  nombre: string;
  puesto: string;
  diasLaborales: string[];
  asistencias: number;
  faltas: number;
  tardanzas: number;
  permisos: number;
  descuento: number;
  salarioDiario: number;
}

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const initialRecords: AsistenciaRecord[] = [
  { id: 1, nombre: "Carlos López", puesto: "Gerente de TI", diasLaborales: ["Lun","Mar","Mié","Jue","Vie"], asistencias: 20, faltas: 1, tardanzas: 2, permisos: 0, descuento: 0, salarioDiario: 1136.36 },
  { id: 2, nombre: "Ana Martínez", puesto: "Contadora", diasLaborales: ["Lun","Mar","Mié","Jue","Vie"], asistencias: 22, faltas: 0, tardanzas: 0, permisos: 0, descuento: 0, salarioDiario: 681.82 },
  { id: 3, nombre: "José García", puesto: "Desarrollador Sr", diasLaborales: ["Lun","Mar","Mié","Jue","Vie"], asistencias: 18, faltas: 2, tardanzas: 1, permisos: 2, descuento: 0, salarioDiario: 818.18 },
  { id: 4, nombre: "María Pérez", puesto: "Diseñadora UX", diasLaborales: ["Lun","Mar","Mié","Jue","Vie","Sáb"], asistencias: 24, faltas: 0, tardanzas: 1, permisos: 1, descuento: 0, salarioDiario: 636.36 },
  { id: 5, nombre: "Roberto Sánchez", puesto: "Analista RH", diasLaborales: ["Lun","Mar","Mié","Jue","Vie"], asistencias: 19, faltas: 3, tardanzas: 0, permisos: 0, descuento: 0, salarioDiario: 545.45 },
  { id: 6, nombre: "Lucía Herrera", puesto: "Asistente Admin", diasLaborales: ["Lun","Mar","Mié","Jue","Vie"], asistencias: 22, faltas: 0, tardanzas: 0, permisos: 0, descuento: 0, salarioDiario: 363.64 },
];

const formatQ = (n: number) => `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Asistencia = () => {
  const [records, setRecords] = useState<AsistenciaRecord[]>(() =>
    initialRecords.map(r => ({ ...r, descuento: r.faltas * r.salarioDiario }))
  );
  const [mes, setMes] = useState("marzo-2026");
  const [diasEmpresa, setDiasEmpresa] = useState(["Lun", "Mar", "Mié", "Jue", "Vie"]);
  const [showConfig, setShowConfig] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<AsistenciaRecord | null>(null);

  const toggleDiaEmpresa = (dia: string) => {
    setDiasEmpresa(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
  };

  const toggleDiaEmpleado = (dia: string) => {
    if (!editingEmpleado) return;
    const newDias = editingEmpleado.diasLaborales.includes(dia)
      ? editingEmpleado.diasLaborales.filter(d => d !== dia)
      : [...editingEmpleado.diasLaborales, dia];
    setEditingEmpleado({ ...editingEmpleado, diasLaborales: newDias });
  };

  const saveEmpleadoDias = () => {
    if (!editingEmpleado) return;
    setRecords(prev => prev.map(r => r.id === editingEmpleado.id ? { ...r, diasLaborales: editingEmpleado.diasLaborales } : r));
    setEditingEmpleado(null);
  };

  const totalDescuentos = records.reduce((s, r) => s + r.descuento, 0);
  const totalFaltas = records.reduce((s, r) => s + r.faltas, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Asistencia</h1>
          <p className="text-muted-foreground">Control de asistencia y descuentos por inasistencias</p>
        </div>
        <div className="flex gap-3">
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="marzo-2026">Marzo 2026</SelectItem>
              <SelectItem value="febrero-2026">Febrero 2026</SelectItem>
              <SelectItem value="enero-2026">Enero 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowConfig(true)} className="gap-2">
            <CalendarCheck className="h-4 w-4" /> Días Laborales
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="text-sm font-medium text-muted-foreground">Días Laborales Empresa</p>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-card-foreground">{diasEmpresa.join(", ")}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium text-muted-foreground">Total Faltas</p>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-destructive">{totalFaltas}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <MinusCircle className="h-5 w-5 text-warning" />
            <p className="text-sm font-medium text-muted-foreground">Total Descuentos</p>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-warning">{formatQ(totalDescuentos)}</p>
        </motion.div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Empleado</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Días Lab.</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Asistencias</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Faltas</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Tardanzas</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Permisos</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Descuento</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 transition-colors hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-card-foreground">{r.nombre}</p>
                    <p className="text-xs text-muted-foreground">{r.puesto}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {diasSemana.map(d => (
                        <span key={d} className={`inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium ${r.diasLaborales.includes(d) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {d[0]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-success font-medium">{r.asistencias}</td>
                  <td className="px-4 py-3 text-center text-destructive font-medium">{r.faltas}</td>
                  <td className="px-4 py-3 text-center text-warning font-medium">{r.tardanzas}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{r.permisos}</td>
                  <td className="px-4 py-3 text-right font-semibold text-destructive">{r.descuento > 0 ? `- ${formatQ(r.descuento)}` : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" onClick={() => setEditingEmpleado(r)}>
                      <Clock className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Company Days Config Dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Días Laborales de la Empresa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Selecciona los días que labora la empresa. Esto aplica por defecto a todos los empleados.</p>
          <div className="flex gap-2 py-4">
            {diasSemana.map(dia => (
              <button
                key={dia}
                onClick={() => toggleDiaEmpresa(dia)}
                className={`flex h-12 w-12 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${diasEmpresa.includes(dia) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >
                {dia}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowConfig(false)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Days Config Dialog */}
      <Dialog open={!!editingEmpleado} onOpenChange={() => setEditingEmpleado(null)}>
        <DialogContent className="max-w-md">
          {editingEmpleado && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">Días Laborales — {editingEmpleado.nombre}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Configura los días específicos que trabaja este empleado.</p>
              <div className="flex gap-2 py-4">
                {diasSemana.map(dia => (
                  <button
                    key={dia}
                    onClick={() => toggleDiaEmpleado(dia)}
                    className={`flex h-12 w-12 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${editingEmpleado.diasLaborales.includes(dia) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                  >
                    {dia}
                  </button>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingEmpleado(null)}>Cancelar</Button>
                <Button onClick={saveEmpleadoDias}>Guardar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Asistencia;
