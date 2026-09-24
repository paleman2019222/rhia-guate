import { motion } from "framer-motion";
import { DollarSign, Download, Search, Calculator } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Empleado {
  id: number;
  nombre: string;
  puesto: string;
  departamento: string;
  salarioBase: number;
  bonificacion: number;
  igss: number;
  isr: number;
  otrasDeduciones: number;
  liquidoRecibir: number;
}

const empleados: Empleado[] = [
  { id: 1, nombre: "Carlos López", puesto: "Gerente de TI", departamento: "Tecnología", salarioBase: 25000, bonificacion: 250, igss: 1212.5, isr: 1875, otrasDeduciones: 0, liquidoRecibir: 22162.5 },
  { id: 2, nombre: "Ana Martínez", puesto: "Contadora", departamento: "Finanzas", salarioBase: 15000, bonificacion: 250, igss: 727.5, isr: 625, otrasDeduciones: 200, liquidoRecibir: 13697.5 },
  { id: 3, nombre: "José García", puesto: "Desarrollador Sr", departamento: "Tecnología", salarioBase: 18000, bonificacion: 250, igss: 873, isr: 1000, otrasDeduciones: 0, liquidoRecibir: 16377 },
  { id: 4, nombre: "María Pérez", puesto: "Diseñadora UX", departamento: "Producto", salarioBase: 14000, bonificacion: 250, igss: 679, isr: 500, otrasDeduciones: 0, liquidoRecibir: 13071 },
  { id: 5, nombre: "Roberto Sánchez", puesto: "Analista RH", departamento: "Recursos Humanos", salarioBase: 12000, bonificacion: 250, igss: 582, isr: 250, otrasDeduciones: 150, liquidoRecibir: 11268 },
  { id: 6, nombre: "Lucía Herrera", puesto: "Asistente Admin", departamento: "Administración", salarioBase: 8000, bonificacion: 250, igss: 388, isr: 0, otrasDeduciones: 0, liquidoRecibir: 7862 },
  { id: 7, nombre: "Pedro Ramírez", puesto: "Desarrollador Jr", departamento: "Tecnología", salarioBase: 10000, bonificacion: 250, igss: 485, isr: 125, otrasDeduciones: 0, liquidoRecibir: 9640 },
  { id: 8, nombre: "Sandra Juárez", puesto: "Ejecutiva de Ventas", departamento: "Ventas", salarioBase: 9000, bonificacion: 250, igss: 436.5, isr: 62.5, otrasDeduciones: 0, liquidoRecibir: 8751 },
];

const formatQ = (n: number) => `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Planilla = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mes, setMes] = useState("marzo-2026");

  const filtered = empleados.filter((e) =>
    e.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.puesto.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totals = filtered.reduce(
    (acc, e) => ({
      salarioBase: acc.salarioBase + e.salarioBase,
      bonificacion: acc.bonificacion + e.bonificacion,
      igss: acc.igss + e.igss,
      isr: acc.isr + e.isr,
      otras: acc.otras + e.otrasDeduciones,
      liquido: acc.liquido + e.liquidoRecibir,
    }),
    { salarioBase: 0, bonificacion: 0, igss: 0, isr: 0, otras: 0, liquido: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Planilla</h1>
          <p className="text-muted-foreground">Cálculo automático de salarios y deducciones</p>
        </div>
        <div className="flex gap-3">
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marzo-2026">Marzo 2026</SelectItem>
              <SelectItem value="febrero-2026">Febrero 2026</SelectItem>
              <SelectItem value="enero-2026">Enero 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-primary p-5 text-primary-foreground">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 opacity-80" />
            <p className="text-sm font-medium opacity-80">Total Salarios Brutos</p>
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{formatQ(totals.salarioBase + totals.bonificacion)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Total Deducciones</p>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-card-foreground">{formatQ(totals.igss + totals.isr + totals.otras)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            <p className="text-sm font-medium text-muted-foreground">Total Líquido</p>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-success">{formatQ(totals.liquido)}</p>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar empleado..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Empleado</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Puesto</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Salario Base</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Bonificación</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">IGSS</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">ISR</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Otras Ded.</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-border last:border-0 transition-colors hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium text-card-foreground">{emp.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.puesto}</td>
                  <td className="px-4 py-3 text-right text-card-foreground">{formatQ(emp.salarioBase)}</td>
                  <td className="px-4 py-3 text-right text-card-foreground">{formatQ(emp.bonificacion)}</td>
                  <td className="px-4 py-3 text-right text-destructive">{formatQ(emp.igss)}</td>
                  <td className="px-4 py-3 text-right text-destructive">{formatQ(emp.isr)}</td>
                  <td className="px-4 py-3 text-right text-destructive">{formatQ(emp.otrasDeduciones)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-success">{formatQ(emp.liquidoRecibir)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-semibold">
                <td colSpan={2} className="px-4 py-3 text-card-foreground">Totales</td>
                <td className="px-4 py-3 text-right text-card-foreground">{formatQ(totals.salarioBase)}</td>
                <td className="px-4 py-3 text-right text-card-foreground">{formatQ(totals.bonificacion)}</td>
                <td className="px-4 py-3 text-right text-destructive">{formatQ(totals.igss)}</td>
                <td className="px-4 py-3 text-right text-destructive">{formatQ(totals.isr)}</td>
                <td className="px-4 py-3 text-right text-destructive">{formatQ(totals.otras)}</td>
                <td className="px-4 py-3 text-right text-success">{formatQ(totals.liquido)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Planilla;
