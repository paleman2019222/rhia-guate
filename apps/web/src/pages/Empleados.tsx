import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, User, Phone, Mail, MapPin, FileText, Plus, UserMinus, Eye, X, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiClientError } from "@/lib/api";

interface Empleado {
  id: string | number;
  dpi: string;
  nombre: string;
  puesto: string;
  departamento: string;
  fechaIngreso: string;
  telefono: string;
  email: string;
  direccion: string;
  salario: number;
  estado: "activo" | "vacaciones" | "suspendido" | "baja";
  avatar: string;
  tipoContrato: "definitivo" | "prueba";
  periodoPruebaMeses?: number;
}

const estadoStyles: Record<string, string> = {
  activo: "bg-success/10 text-success",
  vacaciones: "bg-warning/10 text-warning",
  suspendido: "bg-destructive/10 text-destructive",
  baja: "bg-muted text-muted-foreground",
};

const estadoLabel: Record<string, string> = {
  activo: "Activo",
  vacaciones: "Vacaciones",
  suspendido: "Suspendido",
  baja: "Baja",
};

const formatQ = (n: number) => `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

type NewEmployeeForm = { nombre: string; dpi: string; puesto: string; departamento: string; telefono: string; email: string; direccion: string; salario: string; tipoContrato: "definitivo" | "prueba"; periodoPruebaMeses: string };
type ApiEmployee = { _id: string; dpi: string; name: string; position: string; department: string; hireDate: string; phone?: string; email: string; address?: string; baseSalary: number; status: "active" | "vacation" | "suspended" | "terminated"; contractType: "indefinite" | "fixed_term" | "probation" };

const emptyNew: NewEmployeeForm = { nombre: "", dpi: "", puesto: "", departamento: "", telefono: "", email: "", direccion: "", salario: "", tipoContrato: "definitivo", periodoPruebaMeses: "2" };

const toEmpleado = (employee: ApiEmployee): Empleado => ({
  id: employee._id,
  dpi: employee.dpi,
  nombre: employee.name,
  puesto: employee.position,
  departamento: employee.department,
  fechaIngreso: new Date(employee.hireDate).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" }),
  telefono: employee.phone ?? "",
  email: employee.email,
  direccion: employee.address ?? "",
  salario: employee.baseSalary,
  estado: employee.status === "terminated" ? "baja" : employee.status === "vacation" ? "vacaciones" : employee.status === "suspended" ? "suspendido" : "activo",
  avatar: employee.name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(),
  tipoContrato: employee.contractType === "probation" ? "prueba" : "definitivo",
  periodoPruebaMeses: employee.contractType === "probation" ? 2 : undefined,
});

const Empleados = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Empleado | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showContrato, setShowContrato] = useState(false);
  const [showBaja, setShowBaja] = useState<Empleado | null>(null);
  const [motivoBaja, setMotivoBaja] = useState("");
  const [newEmp, setNewEmp] = useState(emptyNew);
  const [contratoPreview, setContratoPreview] = useState<Empleado | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: ApiEmployee[] }>("/employees")
      .then((response) => setEmpleados(response.data.map(toEmpleado)))
      .catch((caught) => setError(caught instanceof ApiClientError ? caught.message : "No se pudieron cargar los empleados"));
  }, []);

  const filtered = empleados.filter((e) =>
    e.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.dpi.includes(searchQuery) ||
    e.puesto.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    const initials = newEmp.nombre.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const emp: Empleado = {
      id: empleados.length + 1,
      nombre: newEmp.nombre,
      dpi: newEmp.dpi,
      puesto: newEmp.puesto,
      departamento: newEmp.departamento,
      telefono: newEmp.telefono,
      email: newEmp.email,
      direccion: newEmp.direccion,
      salario: parseFloat(newEmp.salario) || 0,
      estado: "activo",
      avatar: initials,
      fechaIngreso: new Date().toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" }),
      tipoContrato: newEmp.tipoContrato,
      periodoPruebaMeses: newEmp.tipoContrato === "prueba" ? parseInt(newEmp.periodoPruebaMeses) : undefined,
    };
    try {
      const response = await api<{ data: ApiEmployee }>("/employees", {
        method: "POST",
        body: JSON.stringify({ employeeCode: `EMP-${Date.now()}`, dpi: newEmp.dpi, name: newEmp.nombre, position: newEmp.puesto, department: newEmp.departamento, phone: newEmp.telefono || undefined, email: newEmp.email, address: newEmp.direccion || undefined, baseSalary: parseFloat(newEmp.salario) || 0, hireDate: new Date().toISOString(), contractType: newEmp.tipoContrato === "prueba" ? "probation" : "indefinite" }),
      });
      const saved = toEmpleado(response.data);
      setEmpleados([saved, ...empleados]);
      setContratoPreview(saved);
      setShowNew(false);
      setShowContrato(true);
      setNewEmp(emptyNew);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No se pudo crear el empleado");
    }
  };

  const handleBaja = async () => {
    if (!showBaja) return;
    try {
      const response = await api<{ data: ApiEmployee }>(`/employees/${showBaja.id}/terminate`, { method: "POST", body: JSON.stringify({ reason: motivoBaja }) });
      const saved = toEmpleado(response.data);
      setEmpleados(prev => prev.map(e => e.id === showBaja.id ? saved : e));
      setShowBaja(null);
      setMotivoBaja("");
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "No se pudo dar de baja al empleado");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Empleados</h1>
          <p className="text-muted-foreground">Expediente digital de tu equipo — busca por nombre o DPI</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Empleado
        </Button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, DPI o puesto..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((emp, i) => (
          <motion.div key={emp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelected(emp)}>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{emp.avatar}</div>
              <div className="flex-1">
                <p className="font-semibold text-card-foreground">{emp.nombre}</p>
                <p className="text-sm text-muted-foreground">{emp.puesto}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoStyles[emp.estado]}`}>{estadoLabel[emp.estado]}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{emp.departamento}</span>
                <span>·</span>
                <span>DPI: {emp.dpi}</span>
              </div>
              {emp.estado !== "baja" && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setShowBaja(emp); }}>
                  <UserMinus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {emp.tipoContrato === "prueba" && (
              <div className="mt-2 rounded-md bg-warning/10 px-2 py-1 text-[11px] font-medium text-warning">Período de prueba — {emp.periodoPruebaMeses} meses</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{selected.avatar}</div>
                  <div>
                    <p>{selected.nombre}</p>
                    <p className="text-sm font-normal text-muted-foreground">{selected.puesto}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={FileText} label="DPI" value={selected.dpi} />
                  <InfoRow icon={User} label="Departamento" value={selected.departamento} />
                  <InfoRow icon={Phone} label="Teléfono" value={selected.telefono} />
                  <InfoRow icon={Mail} label="Email" value={selected.email} />
                  <InfoRow icon={MapPin} label="Dirección" value={selected.direccion} />
                  <InfoRow icon={FileText} label="Fecha Ingreso" value={selected.fechaIngreso} />
                </div>
                <div className="rounded-lg border border-border bg-accent/50 p-4">
                  <p className="text-sm text-muted-foreground">Salario Base</p>
                  <p className="font-display text-2xl font-bold text-foreground">{formatQ(selected.salario)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${estadoStyles[selected.estado]}`}>{estadoLabel[selected.estado]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Contrato:</span>
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                      {selected.tipoContrato === "prueba" ? `Prueba (${selected.periodoPruebaMeses}m)` : "Definitivo"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Employee Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Nuevo Empleado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input value={newEmp.nombre} onChange={e => setNewEmp({ ...newEmp, nombre: e.target.value })} placeholder="Juan Pérez" />
              </div>
              <div className="space-y-2">
                <Label>DPI</Label>
                <Input value={newEmp.dpi} onChange={e => setNewEmp({ ...newEmp, dpi: e.target.value })} placeholder="1234567890101" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Puesto</Label>
                <Input value={newEmp.puesto} onChange={e => setNewEmp({ ...newEmp, puesto: e.target.value })} placeholder="Desarrollador" />
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Input value={newEmp.departamento} onChange={e => setNewEmp({ ...newEmp, departamento: e.target.value })} placeholder="Tecnología" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={newEmp.telefono} onChange={e => setNewEmp({ ...newEmp, telefono: e.target.value })} placeholder="5555-1234" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} placeholder="juan@empresa.gt" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input value={newEmp.direccion} onChange={e => setNewEmp({ ...newEmp, direccion: e.target.value })} placeholder="Zona 10, Guatemala" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salario (Q)</Label>
                <Input type="number" value={newEmp.salario} onChange={e => setNewEmp({ ...newEmp, salario: e.target.value })} placeholder="10000" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Contratación</Label>
                <Select value={newEmp.tipoContrato} onValueChange={v => setNewEmp({ ...newEmp, tipoContrato: v as NewEmployeeForm["tipoContrato"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="definitivo">Contratación Definitiva</SelectItem>
                    <SelectItem value="prueba">Período de Prueba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newEmp.tipoContrato === "prueba" && (
              <div className="space-y-2">
                <Label>Duración del Período de Prueba</Label>
                <Select value={newEmp.periodoPruebaMeses} onValueChange={v => setNewEmp({ ...newEmp, periodoPruebaMeses: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mes</SelectItem>
                    <SelectItem value="2">2 meses</SelectItem>
                    <SelectItem value="3">3 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newEmp.nombre || !newEmp.dpi}>Crear y Generar Contrato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Preview Dialog */}
      <Dialog open={showContrato} onOpenChange={setShowContrato}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {contratoPreview && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">Vista Previa del Contrato</DialogTitle>
              </DialogHeader>
              <div className="rounded-lg border border-border bg-background p-6 space-y-4 text-sm font-serif">
                <h2 className="text-center font-bold text-lg text-foreground">CONTRATO INDIVIDUAL DE TRABAJO</h2>
                <p className="text-center text-muted-foreground text-xs">
                  {contratoPreview.tipoContrato === "prueba" ? `CON PERÍODO DE PRUEBA DE ${contratoPreview.periodoPruebaMeses} MES(ES)` : "CONTRATO DEFINITIVO"}
                </p>
                <hr className="border-border" />
                <p className="text-foreground leading-relaxed">
                  En la ciudad de Guatemala, el día <strong>{contratoPreview.fechaIngreso}</strong>, entre <strong>Mi Empresa S.A.</strong>, representada legalmente, quien en adelante se denominará <em>"El Patrono"</em>, y <strong>{contratoPreview.nombre}</strong>, con DPI número <strong>{contratoPreview.dpi}</strong>, quien en adelante se denominará <em>"El Trabajador"</em>, convienen celebrar el presente contrato individual de trabajo bajo las siguientes cláusulas:
                </p>
                <div className="space-y-2 text-foreground leading-relaxed">
                  <p><strong>PRIMERA:</strong> El Trabajador prestará sus servicios como <strong>{contratoPreview.puesto}</strong> en el departamento de <strong>{contratoPreview.departamento}</strong>.</p>
                  <p><strong>SEGUNDA:</strong> El salario mensual será de <strong>{formatQ(contratoPreview.salario)}</strong>, más la bonificación incentivo de ley de Q 250.00.</p>
                  <p><strong>TERCERA:</strong> La jornada de trabajo será diurna ordinaria de lunes a viernes, de 8:00 a 17:00 horas, con una hora de almuerzo.</p>
                  <p><strong>CUARTA:</strong> {contratoPreview.tipoContrato === "prueba"
                    ? `El presente contrato se celebra con un período de prueba de ${contratoPreview.periodoPruebaMeses} mes(es), durante el cual cualquiera de las partes puede dar por terminada la relación laboral sin responsabilidad.`
                    : "El presente contrato es por tiempo indefinido, pudiendo darse por terminado por cualquiera de las partes conforme lo establece el Código de Trabajo de Guatemala."
                  }</p>
                  <p><strong>QUINTA:</strong> El Trabajador tendrá derecho a las prestaciones de ley: aguinaldo, bono 14, vacaciones (15 días hábiles), e indemnización conforme la legislación guatemalteca vigente.</p>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-8">
                  <div className="text-center">
                    <div className="border-t border-foreground pt-2 mt-12">
                      <p className="font-semibold text-foreground">El Patrono</p>
                      <p className="text-muted-foreground text-xs">Mi Empresa S.A.</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-foreground pt-2 mt-12">
                      <p className="font-semibold text-foreground">El Trabajador</p>
                      <p className="text-muted-foreground text-xs">{contratoPreview.nombre}</p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowContrato(false)}>Cerrar</Button>
                <Button onClick={() => setShowContrato(false)}>Descargar PDF</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Baja Dialog */}
      <Dialog open={!!showBaja} onOpenChange={() => setShowBaja(null)}>
        <DialogContent className="max-w-md">
          {showBaja && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2 text-destructive">
                  <UserMinus className="h-5 w-5" /> Dar de Baja
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Estás a punto de dar de baja a <strong className="text-foreground">{showBaja.nombre}</strong>. Esta acción cambiará su estado a inactivo.</p>
              <div className="space-y-2">
                <Label>Motivo de la baja</Label>
                <Textarea value={motivoBaja} onChange={e => setMotivoBaja(e.target.value)} placeholder="Renuncia voluntaria, despido, fin de contrato..." />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBaja(null)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleBaja} disabled={!motivoBaja}>Confirmar Baja</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </div>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

export default Empleados;
