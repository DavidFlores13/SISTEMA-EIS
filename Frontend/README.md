# Frontend Sistema EIS

Cliente web en React + Vite + Tailwind.

## Que incluye

- Login conectado al backend (`/api/v1/auth/login`)
- Dashboard protegido por token JWT
- Filtros globales por mes, anio y sucursal
- Tarjetas KPI
- Grafico de linea (tendencia de ventas)
- Grafico tipo pastel (distribucion general)
- Capa centralizada de llamadas API en `src/services/api.js`

## Estructura

- `src/app`: router principal
- `src/context`: estado global (auth y filtros)
- `src/components`: componentes reutilizables
- `src/pages`: `LoginPage` y `DashboardPage`
- `src/services`: cliente API

## Configuracion

1. Copia `.env.example` a `.env`
2. Ajusta URL de backend

```
VITE_API_URL=http://localhost:3001/api/v1
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`

## Flujo esperado

1. Levantar backend (`API`)
2. Levantar frontend (`Frontend`)
3. Iniciar sesion con usuario configurado en `.env` del backend
