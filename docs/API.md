# API REST v1

Base local: `http://localhost:3001/api/v1`. Las respuestas de éxito usan `{ "data": ... }`; los errores usan `{ "error": "...", "details"?: ... }`.

Las rutas de empresa requieren `Authorization: Bearer <accessToken>`. `POST /auth/login`, `GET /health` y las postulaciones públicas no requieren JWT. Las rutas de integración de n8n usan los headers secretos indicados abajo.

## Autenticación

| Método y ruta | Roles | Descripción |
|---|---|---|
| `POST /auth/login` | Público | Recibe `email`, `password`; retorna JWT y perfil. |
| `GET /auth/me` | Autenticado | Retorna el perfil de la sesión. |

## Administración de plataforma

| Método y ruta | Descripción |
|---|---|
| `GET /admin/plans` | Lista planes y feature flags. |
| `POST /admin/plans` | Crea un plan; body: `code`, `name`, `description`, `priceMonthly`, `features`. |
| `PATCH /admin/plans/:planId` | Actualiza precio, estado y/o flags del plan. |
| `GET /admin/tenants` | Lista empresas con su plan. |
| `POST /admin/tenants` | Crea empresa y administrador inicial. Body: `name`, `slug`, `planId`, `primaryAdmin`. |
| `PATCH /admin/tenants/:tenantId` | Cambia `planId`, `status` o `featureOverrides` de una empresa. |

Estas rutas requieren `super_admin`. El portal web `/admin` permite activar/desactivar cada función por plan.

## Empresa y usuarios

| Método y ruta | Roles | Descripción |
|---|---|---|
| `GET /tenants/current` | Cualquier usuario | Empresa y plan de la sesión. |
| `GET /tenants/current/users` | Admin | Lista usuarios de la empresa. |
| `POST /tenants/current/users` | Admin | Crea usuario `admin` o `hr`. |
| `PATCH /tenants/current/users/:userId` | Admin | Cambia nombre, rol, estado o contraseña. |

## Empleados

| Método y ruta | Roles | Descripción |
|---|---|---|
| `GET /employees?search=` | Autenticado | Lista empleados filtrados por empresa. |
| `POST /employees` | Admin, HR | Crea empleado. Requiere DPI, nombre, correo, puesto, departamento, fecha y salario. |
| `GET /employees/:employeeId` | Autenticado | Obtiene un expediente. |
| `PATCH /employees/:employeeId` | Admin, HR | Actualiza campos del empleado. |
| `POST /employees/:employeeId/terminate` | Admin | Marca finalización y persiste `reason`. |

## Plazas

| Método y ruta | Roles | Descripción |
|---|---|---|
| `GET /vacancies?status=&search=` | Autenticado | Lista vacantes de la empresa. |
| `POST /vacancies` | Admin, HR | Crea una vacante. |
| `GET /vacancies/:vacancyId` | Autenticado | Detalle de una vacante. |
| `PATCH /vacancies/:vacancyId` | Admin, HR | Actualiza o cierra una vacante. |
| `POST /vacancies/:vacancyId/public-link` | Admin, HR | Genera o recupera el identificador único para su enlace público de postulación. |

## Candidatos y análisis de CV

| Método y ruta | Roles | Descripción |
|---|---|---|
| `GET /candidates?vacancyId=` | Autenticado | Lista candidatos, opcionalmente por plaza. |
| `POST /candidates` | Admin, HR + `cvAnalyzer` | `multipart/form-data`; requiere `vacancyId`, `name`, `email` y `cvText` o `document`. |
| `GET /candidates/:candidateId` | Autenticado | Devuelve candidato y resultado. |
| `POST /candidates/:candidateId/analyze` | Admin, HR + `cvAnalyzer` | Encola el análisis en n8n y devuelve 202. |
| `POST /integrations/n8n/cv-analysis/callback` | Secret n8n | Recibe resultado firmado, sin JWT. |
| `GET /integrations/n8n/email/companies/:companySlug/vacancies?title=` | Token workflow | Obtiene la plaza publicada por título exacto para un correo. |
| `POST /integrations/n8n/email/companies/:companySlug/cv-analysis` | Secret n8n | Registra el candidato y su análisis recibido por Gmail. |

El callback debe incluir header `x-n8n-callback-secret` y body `requestId`, `status` (`completed` o `failed`). Para un resultado completado puede incluir `isValidCV`, `securityStatus`, `securityFlags`, `confidence`, `score`, `summary`, `strengths`, `gaps`, `recommendation` y `rawResponse`. Para un fallo debe incluir `error`.

La integración de Gmail se documenta en [N8N_EMAIL_CV.md](N8N_EMAIL_CV.md). Ambas rutas están limitadas a una empresa activa con la función `cvAnalyzer` habilitada.

## Salud

| Método y ruta | Descripción |
|---|---|
| `GET /health` | Liveness check sin autenticación. |

## Postulaciones públicas

| Método y ruta | Descripción |
|---|---|
| `GET /public/companies/:companySlug/vacancies/:publicId` | Devuelve datos seguros de una plaza publicada, sin autenticación. |
| `POST /public/companies/:companySlug/vacancies/:publicId/applications` | Recibe `multipart/form-data` con `name`, `email`, `phone?`, `cvText?` y `document?`. Crea el candidato y encola análisis si el plan incluye `cvAnalyzer`. |

El enlace que comparte una empresa es `https://dominio/postular/:companySlug/:publicId`. Las plazas cerradas, empresas suspendidas y enlaces inexistentes devuelven 404.
