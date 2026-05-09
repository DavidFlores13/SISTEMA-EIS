# API Sistema EIS

Backend en Node.js + Express + SQLite, organizado por capas y versionado de rutas.

## Estructura

- `src/config`: variables de entorno
- `src/lib`: utilidades base (`db`, `AppError`)
- `src/middlewares`: auth JWT, validaciones, errores
- `src/modules`: dominio por modulo (`auth`, `ventas`, `kpis`, etc.)
- `src/routes/v1`: orquestacion de rutas versionadas
- `db/migrations`: cambios estructurales e indices
- `db/seeds`: datos de apoyo
- `test`: pruebas unitarias e integracion

## Configuracion

1. Copia `.env.example` a `.env`
2. Ajusta credenciales y secreto JWT

## Scripts

- `npm run dev` inicia en modo watch
- `npm start` inicia servidor
- `npm run migrate` ejecuta migraciones
- `npm run seed` ejecuta seeds
- `npm test` ejecuta pruebas

## Versionado de API

Todas las rutas estan bajo:

- `/api/v1/...`

## Autenticacion

1. Login:
- `POST /api/v1/auth/login`
- body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

2. Usar token en rutas protegidas:

```http
Authorization: Bearer <token>
```

## Endpoints principales

- `GET /api/v1/sucursales`
- `GET /api/v1/ventas?id_sucursal=1`
- `POST /api/v1/ventas`
- `GET /api/v1/gastos?id_sucursal=1`
- `POST /api/v1/gastos`
- `GET /api/v1/metas?id_sucursal=1&anio=2026&mes=3`
- `POST /api/v1/metas`
- `GET /api/v1/kpis/crecimiento-mensual`
- `GET /api/v1/kpis/estado?anio=2026&mes=3&id_sucursal=1`
- `GET /api/v1/dashboard/resumen`

## Cambios de base agregados

Migracion `001_eis_improvements.sql` incluye:

- Indices para ventas, gastos y metas
- Tabla `recursos_humanos`
- Tabla `clientes_nuevos_mensual`
- Triggers para validar mes y evitar montos negativos

## Docker

```bash
docker build -t eis-api .
docker run -p 3001:3001 --env-file .env eis-api
```
