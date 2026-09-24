# RHIA Platform

Monorepo para la plataforma multiempresa de Recursos Humanos RHIA.

## Estructura

- `apps/web`: SPA React/Vite para usuarios de cada empresa y administración de plataforma.
- `apps/api`: API REST Express/MongoDB con JWT, RBAC, feature flags y webhooks n8n.
- `packages/shared`: contrato compartido de roles, planes y funciones.
- `docs`: arquitectura, API y configuración de n8n.

## Inicio local

1. Copia `apps/api/.env.example` a `apps/api/.env` y configura MongoDB, JWT y secretos n8n. `MONGODB_DB_NAME` selecciona la base de datos (por defecto `rhiagt`); en MongoDB Atlas se crea al guardar el primer documento.
2. Copia `apps/web/.env.example` a `apps/web/.env` si la API no estará en `http://localhost:3001`.
3. Ejecuta `npm install` desde la raíz.
4. Ejecuta `npm run seed:plans` y después `npm run bootstrap:superadmin`.
5. En dos terminales, ejecuta `npm run dev:api` y `npm run dev:web`.

Consulta [la documentación de API](docs/API.md), [la arquitectura](docs/ARCHITECTURE.md), [los servicios](docs/SERVICES.md) y [la integración n8n](docs/N8N_CV_ANALYZER.md).

## Despliegue de la API en Render

En un servicio web con el directorio raíz del repositorio, usa este comando de compilación para incluir TypeScript y las definiciones de tipos requeridas durante el build:

```bash
npm ci --include=dev && npm run build --workspace=@rhia/api
```

Comando de inicio:

```bash
npm run start --workspace=@rhia/api
```
