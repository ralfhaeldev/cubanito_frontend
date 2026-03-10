# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build
npm test           # run tests (Vitest via ng test)
```

To run a single spec file, use the Angular CLI with a file pattern:
```bash
npx ng test --include="**/pedidos.spec.ts"
```

## Architecture Overview

Angular 21 standalone-component app (no NgModules) for a restaurant management system called **Cubanito**. Uses signals throughout for state management instead of RxJS subjects.

### Feature Modules (lazy-loaded)

Each feature under `src/app/features/` follows a consistent structure:
- `<feature>.routes.ts` — route definitions
- `services/<feature>.ts` — HTTP service
- `components/` — smart + presentational components

| Route | Feature | Roles |
|-------|---------|-------|
| `/dashboard` | Dashboard with charts | SuperAdmin, AdminSede |
| `/pedidos` | Order management | SuperAdmin, AdminSede, Mesero |
| `/productos` | Product catalog | AdminSede |
| `/inventario` | Stock/inventory | AdminSede |
| `/caja` | Cash register | AdminSede |
| `/reportes` | Sales reports | SuperAdmin, AdminSede |
| `/usuarios` | User management | AdminSede |
| `/sedes` | Branch management | SuperAdmin |
| `/cocina` | Kitchen display (full-screen) | Cocina, AdminSede |
| `/domiciliario` | Delivery view (full-screen) | Domiciliario, AdminSede |

### Layouts

- **AdminLayoutComponent** — main shell with sidebar, wraps most routes
- **CocinaLayoutComponent** — full-screen dark layout for kitchen display
- **DomiciliarioLayout** — full-screen layout for delivery personnel

### Core Services

- **AuthService** (`src/app/core/auth/auth.service.ts`) — JWT-based auth using Angular signals. Token stored in `localStorage` as `rm_token`. Exposes signals: `currentUser`, `isLoggedIn`, `rol`, `sedeId`, `isSuperAdmin`.
- **TenantService** (`src/app/core/tenant/tenant.service.ts`) — manages active `Sede`. SuperAdmin selects a sede in the dashboard; other roles use the `sedeId` from their JWT.
- **SocketService** (`src/app/core/websocket/socket.service.ts`) — Socket.IO client for real-time order events (`pedido:nuevo`, `pedido:estado_actualizado`).

### Guards

- `authGuard` — requires valid, non-expired JWT
- `guestGuard` — redirects logged-in users to their home route
- `roleGuard(roles[])` — factory guard used inline in route definitions

### Mock Interceptor

`src/app/core/mocks/mock.interceptor.ts` intercepts all HTTP calls and returns in-memory data when `MOCKS_ENABLED = true`. It simulates the full REST API including auth, CRUD, and business logic (inventory deduction on order finalization). **The mock interceptor must be registered before `authInterceptor`** in `app.config.ts`.

To disable mocks and connect to a real backend, set `MOCKS_ENABLED = false` in `mock.interceptor.ts`. The backend URL is `http://localhost:3000` (configured in `src/environments/environment.ts`).

### Roles

Defined in `src/app/shared/models/index.ts`:
- `SuperAdmin` — cross-sede admin, selects active sede dynamically
- `AdminSede` — manages a single sede
- `Mesero` — creates/manages orders
- `Cocina` — kitchen display only
- `Domiciliario` — delivery view only

### Shared Models

All domain interfaces and enums are centralized in `src/app/shared/models/index.ts`. Key types: `Pedido`, `Producto` (with `TipoProducto.Simple | Preparado`), `ItemInventario`, `Caja`, `Movimiento`, `Usuario`, `Sede`.

### Styling

Tailwind CSS v3 with `@tailwindcss/forms` plugin. Locale set to `es` (Spanish) for currency/date formatting. Currency formatting uses the custom `CopPipe` (`src/app/shared/pipes/cop.pipe.ts`).
