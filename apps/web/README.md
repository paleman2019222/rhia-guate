# RHIA Web

Cliente React/Vite del monorepo RHIA.

Configura `VITE_API_BASE_URL` en `.env` a partir de `.env.example`. Desde la raíz del monorepo usa:

```sh
npm run dev:web
```

La aplicación consume la API JWT de `apps/api`; no contiene datos de empleados ni secretos de infraestructura en el bundle.
