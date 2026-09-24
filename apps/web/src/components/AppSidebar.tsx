import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  CalendarCheck,
  Sun,
  Brain,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Briefcase, label: "Plazas", path: "/plazas" },
  { icon: Users, label: "Empleados", path: "/empleados" },
  { icon: DollarSign, label: "Planilla", path: "/planilla" },
  { icon: CalendarCheck, label: "Asistencia", path: "/asistencia" },
  { icon: Sun, label: "Vacaciones", path: "/vacaciones" },
  { icon: FileText, label: "Reportes", path: "/reportes" },
  { icon: Brain, label: "Analizador CV", path: "/analizador-cv" },
  { icon: Settings, label: "Configuración", path: "/configuracion" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const items = user?.role === "super_admin" ? [{ icon: ShieldCheck, label: "Portal Admin", path: "/admin" }] : navItems;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
          <Sparkles className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-sidebar-foreground">Rhia</h1>
          <p className="text-xs text-sidebar-muted">Recursos Humanos IA</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1 px-3">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>


      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            {user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "RH"}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">{user?.name ?? "Usuario"}</p>
            <p className="text-xs text-sidebar-muted">{user?.role === "super_admin" ? "Administrador de plataforma" : user?.role === "admin" ? "Administrador RH" : "Equipo RH"}</p>
          </div>
          <button type="button" aria-label="Cerrar sesión" onClick={() => { logout(); navigate("/", { replace: true }); }} className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
