import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Plazas from "./pages/Plazas";
import Empleados from "./pages/Empleados";
import Planilla from "./pages/Planilla";
import Asistencia from "./pages/Asistencia";
import Vacaciones from "./pages/Vacaciones";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import CVAnalyzer from "./pages/CVAnalyzer";
import AdminPortal from "./pages/AdminPortal";
import PublicApplication from "./pages/PublicApplication";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/postular/:companySlug/:vacancyId" element={<PublicApplication />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/plazas" element={<Plazas />} />
                <Route path="/empleados" element={<Empleados />} />
                <Route path="/planilla" element={<Planilla />} />
                <Route path="/asistencia" element={<Asistencia />} />
                <Route path="/vacaciones" element={<Vacaciones />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/configuracion" element={<Configuracion />} />
                <Route path="/analizador-cv" element={<CVAnalyzer />} />
                <Route path="/admin" element={<AdminPortal />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
