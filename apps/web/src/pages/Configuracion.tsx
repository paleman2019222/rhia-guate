import { motion } from "framer-motion";
import { Building2, Bell, Shield, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const Configuracion = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Ajustes de tu empresa y preferencias</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Company Info */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-card-foreground">Empresa</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input defaultValue="Mi Empresa S.A." />
            </div>
            <div className="space-y-2">
              <Label>NIT</Label>
              <Input defaultValue="12345678-9" />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input defaultValue="Zona 10, Guatemala City" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input defaultValue="2222-3333" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-card-foreground">Notificaciones</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Alertas de vacaciones</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Nuevos CVs recibidos</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Recordatorio de planilla</Label>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        <Button className="gap-2">Guardar Cambios</Button>
      </motion.div>
    </div>
  );
};

export default Configuracion;
