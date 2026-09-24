# Arquitectura

RHIA usa un monorepo npm workspaces. El frontend nunca accede a MongoDB ni a secretos de n8n: consume la API REST con un JWT de corta duración.

```text
React/Vite (apps/web) --Bearer JWT--> Express API (apps/api) --Mongoose--> MongoDB
                                            |
                                            +-- webhook firmado --> n8n / IA
                                                                    |
                                      callback firmado <-------------+
```

## Aislamiento multiempresa

Cada entidad operativa tiene un campo `tenant`. El middleware extrae el tenant del JWT y todos los repositorios consultan con ese filtro. Un `super_admin` debe especificar `x-tenant-id` al usar una ruta de una empresa concreta, para evitar que el contexto se infiera accidentalmente.

## Roles

| Rol | Alcance |
|---|---|
| `super_admin` | Plataforma: planes, empresas, funciones por plan y acceso de soporte con `x-tenant-id`. |
| `admin` | Configura usuarios y opera los datos de su empresa. |
| `hr` | Gestiona empleados, plazas y candidatos de su empresa. |

## Planes y funciones

Los documentos `Plan` contienen flags editables desde el portal `/admin`. Los tres planes iniciales se crean con `npm run seed:plans`:

| Función | Starter | Professional | Enterprise |
|---|---:|---:|---:|
| Gestión de empleados/planilla/reportes | Sí | Sí | Sí |
| Analizador de CV | No | Sí | Sí |
| Carga de PDF/DOC/DOCX | No | Sí | Sí |
| Acceso API | No | No | Sí |

Un administrador de plataforma también puede definir `featureOverrides` por empresa mediante `PATCH /api/v1/admin/tenants/:tenantId`.

## Seguridad operacional

- Contraseñas con bcrypt (12 rounds); no se devuelven en respuestas.
- JWT firmado con `JWT_SECRET` de mínimo 32 caracteres.
- CORS con lista explícita de orígenes.
- Helmet, límite JSON de 2 MB y archivos de CV limitados a 10 MB/PDF/DOC/DOCX.
- El callback de n8n exige `x-n8n-callback-secret`.
- Los archivos locales en `apps/api/uploads` son adecuados para desarrollo. En producción se debe sustituir ese adaptador por almacenamiento privado S3/GCS/Azure Blob con URL firmada y análisis antivirus.
