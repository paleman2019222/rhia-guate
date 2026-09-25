# Servicios de la API

| Servicio | Archivo | Responsabilidad |
|---|---|---|
| Configuración | `apps/api/src/config/env.ts` | Valida todas las variables de entorno al iniciar. |
| Base de datos | `apps/api/src/config/database.ts` | Conecta Mongoose a MongoDB. |
| Autenticación | `apps/api/src/services/auth.service.ts` | Firma y valida access tokens JWT. |
| Feature flags | `apps/api/src/services/feature.service.ts` | Resuelve plan + overrides de la empresa y bloquea funciones no contratadas. |
| n8n | `apps/api/src/services/n8n.service.ts` | Despacha análisis de CV, timeout de 15 s y token saliente. |
| Gmail vía n8n | `apps/api/src/controllers/emailIntegration.controller.ts` | Consulta una plaza publicada dentro de la empresa, recibe resultados firmados y evita duplicados por ID de mensaje. |
| Cuarentena de postulaciones | `apps/api/src/services/quarantine.service.ts`, `apps/api/src/controllers/quarantine.controller.ts` | Aísla transaccionalmente CVs sospechosos en una colección MongoDB separada y expone lectura por plaza y empresa. |
| Upload CV | `apps/api/src/middleware/upload.middleware.ts` | Valida y persiste temporalmente documentos de CV. |
| RBAC | `apps/api/src/middleware/auth.middleware.ts`, `role.middleware.ts` | Autenticación bearer y autorización por rol. |
| Tenant scope | `apps/api/src/utils/tenant.ts` | Obliga el filtro de empresa en todas las rutas operativas. |
| Errores | `apps/api/src/middleware/error.middleware.ts` | Convierte errores de dominio, Zod y Mongo a respuestas seguras. |

Los controladores validan la entrada y limitan las operaciones a la empresa correspondiente. No hay acceso a MongoDB desde el navegador.
