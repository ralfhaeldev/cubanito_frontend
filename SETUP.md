# 🚀 Setup — Restaurant Manager Frontend (Angular 21)

## 1. Prerrequisitos

```bash
node -v   # >= 20
npm -v    # >= 10
```

---

## 2. Crear el proyecto

```bash
ng new restaurant-manager-frontend \
  --routing=false \
  --style=css \
  --standalone=true    # default en Angular 21, todos standalone

cd restaurant-manager-frontend
```

> `--routing=false` porque las rutas se manejan directamente en `app.routes.ts`.

---

## 3. Instalar dependencias

```bash
# Producción
npm install socket.io-client chart.js date-fns

# Dev (Tailwind)
npm install -D tailwindcss @tailwindcss/forms postcss autoprefixer

npx tailwindcss init
```

> En Angular 21 **no se usa `@auth0/angular-jwt`**. El decode del JWT se hace con `atob()` nativo incluido en `auth.service.ts`.

---

## 4. Copiar los archivos base del zip

```
tailwind.config.js                 → raíz
src/styles.css                     → reemplaza el existente
src/main.ts                        → reemplaza el existente
src/environments/                  → carpeta completa
src/app/app.config.ts              → nuevo archivo (reemplaza AppModule)
src/app/app.component.ts           → reemplaza el existente
src/app/app.routes.ts              → nuevo archivo (reemplaza app-routing.module.ts)
src/app/core/                      → carpeta completa
src/app/shared/                    → carpeta completa
src/app/layouts/                   → carpeta completa
src/app/features/auth/             → carpeta completa
```

---

## 5. Configurar `angular.json`

```json
"styles": ["src/styles.css"]
```

---

## 6. Generar features restantes

```bash
node generate-features.mjs
```

Genera componentes standalone + servicios + archivos `.routes.ts` por feature.

---

## 7. Variables de entorno

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  wsUrl:  'http://localhost:3000',
};
```

---

## 8. Levantar

```bash
ng serve   # → http://localhost:4200
```

---

## 📁 Estructura final

```
src/app/
├── app.config.ts           ✅ providers centralizados (sin AppModule)
├── app.component.ts        ✅ solo <router-outlet />
├── app.routes.ts           ✅ lazy loading por feature (sin NgModule)
│
├── core/
│   ├── auth/
│   │   ├── auth.service.ts     ✅ signals + JWT decode nativo
│   │   └── auth.guard.ts       ✅ guards funcionales
│   ├── tenant/
│   │   └── tenant.service.ts   ✅ signals
│   ├── websocket/
│   │   └── socket.service.ts   ✅
│   └── interceptors/
│       └── auth.interceptor.ts ✅ interceptor funcional
│
├── shared/
│   ├── models/index.ts         ✅ enums + interfaces
│   ├── pipes/cop.pipe.ts       ✅ formato COP
│   └── components/
│       └── badge-estado/       ✅ input signals
│
├── layouts/
│   ├── admin-layout/           ✅ @if / @for / signals
│   ├── cocina-layout/          ✅ tiempo real + signals
│   └── domiciliario-layout/    ⬜ pendiente
│
└── features/
    ├── auth/
    │   ├── auth.routes.ts      ✅
    │   └── login/              ✅ signals
    ├── dashboard/              ⬜ generar con script
    ├── pedidos/                ⬜ generar con script
    ├── productos/              ⬜ generar con script
    ├── inventario/             ⬜ generar con script
    ├── caja/                   ⬜ generar con script
    ├── movimientos/            ⬜ generar con script
    ├── reportes/               ⬜ generar con script
    ├── usuarios/               ⬜ generar con script
    └── sedes/                  ⬜ generar con script
```

---

## ⚡ Diferencias clave vs Angular anterior

| Concepto | Antes | Angular 21 |
|---|---|---|
| Bootstrap | `AppModule` + `platformBrowserDynamic` | `bootstrapApplication` + `appConfig` |
| Módulos | `NgModule` por feature | Sin módulos — solo `Routes` + standalone components |
| Guards | Clases `CanActivate` | Funciones `CanActivateFn` con `inject()` |
| Interceptores | Clase `HttpInterceptor` | Función `HttpInterceptorFn` |
| Estado reactivo | `BehaviorSubject` | `signal()` + `computed()` |
| Control flow | `*ngIf` / `*ngFor` | `@if` / `@for` / `@switch` |
| Inputs | `@Input()` decorador | `input()` / `input.required()` signal-based |
| RouterModule | `RouterModule.forRoot()` | `provideRouter()` en `appConfig` |
