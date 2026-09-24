import { Briefcase, Users, FileText, CalendarClock, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";

const vacationAlerts = [
  { name: "Carlos López", action: "Sale de vacaciones", date: "8 Mar 2026", type: "leaving" as const },
  { name: "Ana Martínez", action: "Regresa de vacaciones", date: "10 Mar 2026", type: "returning" as const },
  { name: "José García", action: "Sale de vacaciones", date: "15 Mar 2026", type: "leaving" as const },
  { name: "María Pérez", action: "Regresa de vacaciones", date: "12 Mar 2026", type: "returning" as const },
];

const activePlazas = [
  { title: "Desarrollador Full Stack", cvs: 47, score: 85, department: "Tecnología" },
  { title: "Analista Contable", cvs: 23, score: 72, department: "Finanzas" },
  { title: "Diseñador UX/UI", cvs: 31, score: 90, department: "Producto" },
];

const recentActivity = [
  { text: "IA analizó 12 CVs para Desarrollador Full Stack", time: "Hace 2 horas" },
  { text: "Nuevo CV recibido para Analista Contable", time: "Hace 3 horas" },
  { text: "Planilla de febrero generada exitosamente", time: "Ayer" },
  { text: "Expediente actualizado: Roberto Sánchez", time: "Ayer" },
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-display text-3xl font-bold text-foreground"
        >
          Buenos días, María 👋
        </motion.h1>
        <p className="mt-1 text-muted-foreground">
          Aquí tienes un resumen de tu equipo hoy, 4 de marzo 2026
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} title="Plazas Activas" value={3} subtitle="2 nuevas esta semana" variant="primary" />
        <StatCard icon={FileText} title="CVs Recibidos" value={101} subtitle="47 analizados por IA" trend={{ value: "23% vs mes anterior", positive: true }} />
        <StatCard icon={Users} title="Empleados" value={84} subtitle="3 nuevos ingresos" />
        <StatCard icon={TrendingUp} title="Planilla Mes" value="Q 342,800" subtitle="Febrero 2026" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Positions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-semibold text-card-foreground">Plazas Activas</h2>
            <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles className="h-3 w-3" />
              IA Activa
            </div>
          </div>
          <div className="space-y-4">
            {activePlazas.map((plaza, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-4 transition-colors hover:bg-accent/50"
              >
                <div>
                  <p className="font-medium text-card-foreground">{plaza.title}</p>
                  <p className="text-sm text-muted-foreground">{plaza.department}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-card-foreground">{plaza.cvs} CVs</p>
                    <p className="text-xs text-muted-foreground">recibidos</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${plaza.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-primary">{plaza.score}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Vacation Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <CalendarClock className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-card-foreground">Vacaciones</h2>
          </div>
          <div className="space-y-3">
            {vacationAlerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                <div
                  className={`mt-0.5 h-2 w-2 rounded-full ${
                    alert.type === "leaving" ? "bg-warning" : "bg-success"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{alert.name}</p>
                  <p className="text-xs text-muted-foreground">{alert.action}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">{alert.date}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h2 className="font-display text-lg font-semibold text-card-foreground mb-4">Actividad Reciente</h2>
        <div className="space-y-3">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm text-card-foreground">{item.text}</p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
