# Frontend Context — Cubanitos Restaurant Management System

> Referencia completa del frontend Angular para alinear el backend NestJS.
> Base URL de la API: `http://localhost:3000` (prefijo `/api` en el backend).
> Mock interceptor activo con `MOCKS_ENABLED = true` en `mock.interceptor.ts`.

---

## Tabla de Contenidos

1. [Arquitectura General](#1-arquitectura-general)
2. [Roles y Permisos](#2-roles-y-permisos)
3. [Rutas y Guards](#3-rutas-y-guards)
4. [Entidades / Interfaces](#4-entidades--interfaces)
5. [Módulos y Componentes por Feature](#5-módulos-y-componentes-por-feature)
6. [Catálogo Completo de Endpoints](#6-catálogo-completo-de-endpoints)
7. [Flujo de Autenticación (JWT)](#7-flujo-de-autenticación-jwt)
8. [WebSocket — Eventos en Tiempo Real](#8-websocket--eventos-en-tiempo-real)
9. [Lógica de Negocio en el Mock](#9-lógica-de-negocio-en-el-mock)
10. [Servicios Core](#10-servicios-core)

---

## 1. Arquitectura General

- **Framework:** Angular 21 (standalone components, sin NgModules)
- **Estado:** Angular Signals (`signal`, `computed`, `effect`)
- **HTTP:** `HttpClient` inyectado directamente en componentes vía `inject(HttpClient)`
- **Estilos:** Tailwind CSS v3 + `@tailwindcss/forms`
- **Locale:** `es` (español) — moneda formateada con `CopPipe`
- **Lazy loading:** cada feature carga su propio bundle de rutas
- **Layouts:**
  - `AdminLayoutComponent` — shell con sidebar, envuelve la mayoría de rutas
  - `CocinaLayoutComponent` — pantalla completa oscura para cocina
  - `DomiciliarioLayout` — pantalla completa para domiciliarios

```
src/app/
├── core/
│   ├── auth/          auth.service.ts, auth.guard.ts
│   ├── interceptors/  auth.interceptor.ts
│   ├── mocks/         mock.interceptor.ts, mock.data.ts
│   ├── tenant/        tenant.service.ts
│   └── websocket/     socket.service.ts
├── features/
│   ├── auth/          login
│   ├── dashboard/
│   ├── pedidos/       lista-pedidos, form-pedido, detalle-pedido
│   ├── productos/     lista-productos, form-producto
│   ├── inventario/    lista-inventario, form-item-inventario, form-ajuste-inventario
│   ├── caja/          caja, form-abrir-caja, form-cerrar-caja, form-movimiento
│   ├── reportes/
│   ├── usuarios/      lista-usuarios, form-usuario
│   ├── sedes/         lista-sedes, form-sede
│   ├── cocina/        vista-cocina
│   └── domiciliario/  vista-domiciliario
└── shared/
    ├── models/        index.ts  ← todas las interfaces y enums
    └── pipes/         cop.pipe.ts
```

---

## 2. Roles y Permisos

Definidos en `src/app/shared/models/index.ts`:

| Enum value       | String literal   | Descripción                                           |
|------------------|------------------|-------------------------------------------------------|
| `Rol.Owner`      | `"owner"`        | Dueño — gestión de sedes y vista global               |
| `Rol.SuperAdmin` | `"super_admin"`  | Admin cross-sede — selecciona sede activa dinámicamente |
| `Rol.AdminSede`  | `"admin_sede"`   | Admin de una sede — gestión completa de su sede       |
| `Rol.Mesero`     | `"mesero"`       | Crea y gestiona pedidos de mesa/domicilio             |
| `Rol.Cocina`     | `"cocina"`       | Vista de cocina (Kanban) — solo lectura + cambio de estado |
| `Rol.Domiciliario`| `"domiciliario"` | Vista de domicilios pendientes — solo lectura         |

**JWT payload esperado** (decodificado en el frontend via `decodeJwt`):

```typescript
interface JwtPayload {
  sub:    string;        // userId (UUID)
  nombre: string;
  email:  string;
  rol:    Rol;
  sedeId: string | null; // null para SuperAdmin / Owner
  iat?:   number;
  exp?:   number;
}
```

---

## 3. Rutas y Guards

```typescript
// app.routes.ts
const routes = [
  { path: '',          redirectTo: '/dashboard' },
  { path: 'login',     canActivate: [guestGuard] },

  // Admin layout
  { path: '',  component: AdminLayoutComponent, canActivate: [authGuard], children: [
    { path: 'dashboard',   roles: [Rol.Owner, Rol.SuperAdmin, Rol.AdminSede] },
    { path: 'pedidos',     roles: [Rol.SuperAdmin, Rol.AdminSede, Rol.Mesero] },
    { path: 'productos',   roles: [Rol.AdminSede] },
    { path: 'inventario',  roles: [Rol.AdminSede] },
    { path: 'caja',        roles: [Rol.AdminSede] },
    { path: 'reportes',    roles: [Rol.Owner, Rol.SuperAdmin, Rol.AdminSede] },
    { path: 'usuarios',    roles: [Rol.AdminSede] },
    { path: 'sedes',       roles: [Rol.Owner] },
  ]},

  // Layouts especiales
  { path: 'cocina',       component: CocinaLayout,       roles: [Rol.Cocina, Rol.AdminSede] },
  { path: 'domiciliario', component: DomiciliarioLayout, roles: [Rol.Domiciliario, Rol.AdminSede] },
];
```

### Guards

| Guard                   | Comportamiento                                                      |
|-------------------------|---------------------------------------------------------------------|
| `authGuard`             | Verifica JWT válido y no expirado; redirige a `/login` si no hay    |
| `guestGuard`            | Redirige a `/dashboard` si ya está autenticado                      |
| `roleGuard(roles[])`    | Factory — verifica que `currentUser.rol` esté en la lista de roles  |

---

## 4. Entidades / Interfaces

### Enums

```typescript
enum Rol           { Owner, SuperAdmin, AdminSede, Mesero, Cocina, Domiciliario }
enum EstadoPedido  { Pendiente, EnProceso, Enviado, Entregado, Finalizado, Rechazado }
enum TipoPedido    { Local = 'local', Domicilio = 'domicilio' }
enum MetodoPago    { Efectivo = 'efectivo', Transferencia = 'transferencia' }
enum TipoMovimiento{ Ingreso = 'ingreso', Egreso = 'egreso', Gasto = 'gasto' }
enum TipoProducto  { Simple = 'simple', Preparado = 'preparado' }
```

### Auth

```typescript
interface LoginResponse {
  accessToken: string;
  user: { id: string; nombre: string; email: string; rol: Rol; sedeId: string | null; };
}
```

### Inventario

```typescript
interface ItemInventario {
  id:          string;
  nombre:      string;
  unidad:      string;      // 'kg' | 'g' | 'und' | 'lt' | 'ml'
  stockActual: number;
  stockMinimo: number;
  stockIdeal:  number;
  categoria:   string;
  activo:      boolean;
  ultimoAjuste: string | null;  // ISO date
}

interface AjusteInventario {
  id:         string;
  itemId:     string;
  itemNombre: string;
  tipo:       'entrada' | 'salida' | 'ajuste';
  cantidad:   number;
  motivo:     string;
  creadoPor:  string;
  createdAt:  string;
}
```

### Productos

```typescript
interface Ingrediente {
  itemInventarioId: string;
  itemNombre:       string;
  cantidad:         number;   // cantidad por unidad del producto
  unidad:           string;
}

interface Producto {
  id:               string;
  nombre:           string;
  precioVenta:      number;
  precioCompra:     number;   // calculado de ingredientes si tipo === 'preparado'
  activo:           boolean;
  tipo:             TipoProducto;
  itemInventarioId?: string;   // solo si tipo === 'simple'
  ingredientes?:    Ingrediente[]; // solo si tipo === 'preparado'
}
```

### Pedidos

```typescript
interface PedidoItem {
  id:             string;
  productoId:     string;
  productoNombre: string;
  cantidad:       number;
  precioUnitario: number;
  subtotal:       number;
}

interface ClienteDomicilio {
  nombre:    string;
  telefono:  string;
  direccion: string;
}

interface Pedido {
  id:               string;
  tipo:             TipoPedido;
  estado:           EstadoPedido;
  items:            PedidoItem[];
  total:            number;
  meseroId:         string;
  meseroNombre:     string;
  clienteDomicilio?: ClienteDomicilio;
  createdAt:        string;
  updatedAt:        string;
}
```

### Caja y Movimientos

```typescript
interface Caja {
  id:           string;
  fecha:        string;
  montoInicial: number;
  montoFinal?:  number;
  abierta:      boolean;
  abiertaPor:   string;
  cerradaPor?:  string;
}

interface Movimiento {
  id:          string;
  cajaId:      string;
  tipo:        TipoMovimiento;
  monto:       number;
  descripcion: string;
  createdAt:   string;
}
```

### Usuarios y Sedes

```typescript
interface Usuario {
  id:     string;
  nombre: string;
  email:  string;
  rol:    Rol;
  activo: boolean;
}

interface Sede {
  id:     string;
  nombre: string;
  activa: boolean;
}
```

### Reportes

```typescript
interface VentaDiaria {
  fecha:      string;
  ventas:     number;
  pedidos:    number;
  domicilios: number;
}

interface ProductoVendido {
  nombre:   string;
  cantidad: number;
  ingresos: number;
}

interface CajaHistorial {
  id:           string;
  fecha:        string;
  montoInicial: number;
  montoFinal:   number | null;
  ingresos:     number;
  egresos:      number;
  abierta:      boolean;
  abiertaPor:   string;
}
```

---

## 5. Módulos y Componentes por Feature

### 5.1 Auth

| Componente         | Ruta     | HTTP calls                                |
|--------------------|----------|-------------------------------------------|
| `LoginComponent`   | `/login` | `POST /auth/login` → `LoginResponse`      |

**Request body:**
```json
{ "email": "string", "password": "string" }
```

**Response:**
```json
{
  "accessToken": "jwt.token.here",
  "user": { "id": "uuid", "nombre": "string", "email": "string", "rol": "admin_sede", "sedeId": "uuid|null" }
}
```

---

### 5.2 Dashboard

| Componente          | HTTP calls (forkJoin paralelo)                                      |
|---------------------|---------------------------------------------------------------------|
| `DashboardComponent`| `GET /orders` → `Pedido[]`                                          |
|                     | `GET /caja` → `Caja`                                                |
|                     | `GET /movimientos` → `Movimiento[]`                                 |

KPIs calculados en el frontend: total del día, pedidos activos, ingresos de caja.

---

### 5.3 Pedidos

| Componente           | HTTP calls                                                           |
|----------------------|----------------------------------------------------------------------|
| `ListaPedidosComponent` | `GET /orders` → `Pedido[]`                                       |
| `FormPedidoComponent`   | `GET /product` → `Producto[]` (filtra `activo === true`)         |
|                      | `POST /orders` → `Pedido`                                            |
| `DetallePedidoComponent`| `PATCH /orders/:id/status` → `Pedido`                            |
|                      | `POST /orders/:id/finalizar` → `{ success: true }`                   |

**POST /orders — Request body:**
```json
{
  "tipo": "local | domicilio",
  "items": [
    { "productoId": "uuid", "productoNombre": "string", "cantidad": 2, "precioUnitario": 6000, "subtotal": 12000 }
  ],
  "clienteDomicilio": { "nombre": "string", "telefono": "string", "direccion": "string" }
}
```
> `clienteDomicilio` solo se incluye si `tipo === 'domicilio'`.

**PATCH /orders/:id/status — Request body:**
```json
{ "estado": "en_proceso | enviado | entregado | finalizado | rechazado" }
```

**POST /orders/:id/finalizar — Request body:**
```json
{ "metodo": "efectivo | transferencia", "monto": 20000, "vuelto": 8000 }
```

---

### 5.4 Productos

| Componente              | HTTP calls                                                        |
|-------------------------|-------------------------------------------------------------------|
| `ListaProductosComponent` | `GET /product` → `Producto[]`                                  |
|                          | `GET /inventory` → `ItemInventario[]` (para mostrar stock)      |
|                          | `PATCH /product/:id` → `Producto` (toggle `activo`)             |
| `FormProductoComponent`  | `GET /inventory` → `ItemInventario[]` (para selector de ítems)  |
|                          | `POST /product` → `Producto`                                    |
|                          | `PATCH /product/:id` → `Producto`                               |

**POST /product — Request body (tipo simple):**
```json
{
  "nombre": "Gaseosa",
  "tipo": "simple",
  "precioVenta": 2500,
  "precioCompra": 1200,
  "itemInventarioId": "uuid",
  "activo": true
}
```

**POST /product — Request body (tipo preparado):**
```json
{
  "nombre": "Cubanito",
  "tipo": "preparado",
  "precioVenta": 6000,
  "precioCompra": 2400,
  "ingredientes": [
    { "itemInventarioId": "uuid", "itemNombre": "Pan", "cantidad": 1, "unidad": "und" },
    { "itemInventarioId": "uuid", "itemNombre": "Carne", "cantidad": 0.15, "unidad": "kg" }
  ],
  "activo": true
}
```

---

### 5.5 Inventario

| Componente                    | HTTP calls                                                     |
|-------------------------------|----------------------------------------------------------------|
| `ListaInventarioComponent`    | `GET /inventory` → `ItemInventario[]`                         |
|                               | `GET /inventory/ajustes` → `AjusteInventario[]`               |
| `FormItemInventarioComponent` | `POST /inventory` → `ItemInventario`                          |
| `FormAjusteInventarioComponent`| `POST /inventory/ajustes` → `AjusteInventario`               |

**POST /inventory — Request body:**
```json
{
  "nombre": "Pan de hamburguesa",
  "categoria": "Panadería",
  "unidad": "und",
  "stockActual": 100,
  "stockMinimo": 20,
  "stockIdeal": 150,
  "activo": true
}
```

**POST /inventory/ajustes — Request body:**
```json
{
  "itemId": "uuid",
  "tipo": "entrada | salida | ajuste",
  "cantidad": 50,
  "motivo": "Compra semanal"
}
```
> Lógica de ajuste: `entrada` suma al stock, `salida` resta (mínimo 0), `ajuste` reemplaza el stock con el nuevo valor.

---

### 5.6 Caja

| Componente               | HTTP calls                                                       |
|--------------------------|------------------------------------------------------------------|
| `CajaComponent`          | `GET /caja` → `Caja` (caja activa o última)                     |
|                          | `GET /movimientos` → `Movimiento[]`                              |
| `FormAbrirCajaComponent` | `POST /caja/abrir` → `Caja`                                     |
| `FormCerrarCajaComponent`| `POST /caja/cerrar` → `Caja`                                    |
| `FormMovimientoComponent`| `POST /movimientos` → `Movimiento`                              |

**POST /caja/abrir — Request body:**
```json
{ "montoInicial": 50000 }
```

**POST /caja/cerrar — Request body:**
```json
{ "montoFinal": 185000 }
```

**POST /movimientos — Request body:**
```json
{
  "tipo": "ingreso | egreso | gasto",
  "monto": 15000,
  "descripcion": "Compra de insumos"
}
```

---

### 5.7 Reportes

| Componente           | HTTP calls                                                          |
|----------------------|---------------------------------------------------------------------|
| `ReportesComponent`  | `GET /reports/summary?periodo=today\|7d\|30d` → resumen de métricas|
|                      | `GET /reports/sales?periodo=today\|7d\|30d` → `VentaDiaria[]`      |
|                      | `GET /reports/product-performance?periodo=today\|7d\|30d` → `ProductoVendido[]` |
|                      | `GET /reportes/caja-historial` → `CajaHistorial[]`                 |

> Notar el prefijo diferente: `reports/` para ventas y `reportes/` para caja-historial.

**GET /reports/summary — Response:**
```json
{
  "totalVentas":     185000,
  "totalPedidos":    42,
  "totalDomicilios": 8,
  "ticketPromedio":  4404
}
```

**GET /reports/sales — Response:** `VentaDiaria[]`
```json
[{ "fecha": "2026-03-23", "ventas": 95000, "pedidos": 22, "domicilios": 4 }]
```

**GET /reports/product-performance — Response:** `ProductoVendido[]`
```json
[{ "nombre": "Cubanito", "cantidad": 50, "ingresos": 300000 }]
```

**GET /reportes/caja-historial — Response:** `CajaHistorial[]`
```json
[{
  "id": "uuid", "fecha": "2026-03-22",
  "montoInicial": 50000, "montoFinal": 185000,
  "ingresos": 150000, "egresos": 15000,
  "abierta": false, "abiertaPor": "Ana Admin"
}]
```

---

### 5.8 Usuarios

| Componente              | HTTP calls                                                       |
|-------------------------|------------------------------------------------------------------|
| `ListaUsuariosComponent`| `GET /usuarios` → `Usuario[]`                                   |
|                         | `GET /branches` → `Sede[]` (para mostrar nombre de sede)        |
|                         | `PATCH /usuarios/:id` → `Usuario` (toggle `activo`)             |
| `FormUsuarioComponent`  | `GET /branches` → `Sede[]` (para selector en formulario)        |
|                         | `POST /usuarios` → `Usuario`                                    |
|                         | `PATCH /usuarios/:id` → `Usuario`                               |

**POST /usuarios — Request body:**
```json
{
  "nombre": "Carlos Mesero",
  "email": "carlos@cubanitos.co",
  "password": "1234",
  "rol": "mesero",
  "sedeId": "uuid",
  "activo": true
}
```

**PATCH /usuarios/:id — Request body (crear):**
```json
{ "nombre": "string", "email": "string", "rol": "mesero", "sedeId": "uuid", "activo": true }
```
> En modo edición **no** se envía `password`.

---

### 5.9 Sedes

| Componente           | HTTP calls                                                        |
|----------------------|-------------------------------------------------------------------|
| `ListaSedesComponent`| `GET /branches` → `Sede[]`                                       |
|                      | `PATCH /branches/:id` → `Sede` (toggle `activa`)                 |
| `FormSedeComponent`  | `POST /branches` → `Sede`                                        |
|                      | `PATCH /branches/:id` → `Sede`                                   |

**POST /branches — Request body:**
```json
{ "nombre": "Sede Norte", "activa": true }
```

---

### 5.10 Cocina

| Componente         | HTTP calls                                                            |
|--------------------|-----------------------------------------------------------------------|
| `VistaCocinaComponent` | `GET /orders/activos` → `Pedido[]` (excluye Finalizado/Rechazado)|
|                    | `PATCH /orders/:id/status` → `Pedido`                                 |

> Polling cada **12 segundos** para refrescar pedidos activos.
> Flujo de estados en cocina: `Pendiente → EnProceso → Enviado`.

---

### 5.11 Domiciliario

| Componente              | HTTP calls                                                       |
|-------------------------|------------------------------------------------------------------|
| `VistaDomiciliarioComponent` | `GET /orders` → `Pedido[]` (filtra por tipo `domicilio` y estados activos en el frontend) |
|                         | `PATCH /orders/:id/status` → `Pedido`                           |

> Muestra pedidos con `tipo === 'domicilio'` y estados `Enviado` o `EnProceso`.
> Botón "Entregado" hace `PATCH /orders/:id/status` con `{ estado: 'entregado' }`.

---

## 6. Catálogo Completo de Endpoints

> Prefijo del backend: `/api` (si está configurado). URL base frontend: `http://localhost:3000`.

### Auth

| Método | Ruta           | Request Body                        | Response            | Roles       |
|--------|----------------|-------------------------------------|---------------------|-------------|
| POST   | `/auth/login`  | `{ email, password }`               | `LoginResponse`     | público     |

### Branches (Sedes)

| Método | Ruta              | Request Body              | Response   | Roles        |
|--------|-------------------|---------------------------|------------|--------------|
| GET    | `/branches`       | —                         | `Sede[]`   | autenticado  |
| POST   | `/branches`       | `{ nombre, activa }`      | `Sede`     | Owner        |
| PATCH  | `/branches/:id`   | `Partial<Sede>`           | `Sede`     | Owner        |
| DELETE | `/branches/:id`   | —                         | 204        | Owner        |

### Productos

| Método | Ruta            | Request Body              | Response      | Roles        |
|--------|-----------------|---------------------------|---------------|--------------|
| GET    | `/product`      | —                         | `Producto[]`  | autenticado  |
| POST   | `/product`      | `CreateProductoDto`       | `Producto`    | AdminSede    |
| PATCH  | `/product/:id`  | `Partial<Producto>`       | `Producto`    | AdminSede    |
| DELETE | `/product/:id`  | —                         | 204 (soft)    | AdminSede    |

### Pedidos

| Método | Ruta                        | Request Body                        | Response           | Roles                             |
|--------|-----------------------------|-------------------------------------|--------------------|-----------------------------------|
| GET    | `/orders`                   | —                                   | `Pedido[]`         | Admin+                            |
| GET    | `/orders/activos`           | —                                   | `Pedido[]`         | Mesero, Cocina, Admin+            |
| GET    | `/orders/:id`               | —                                   | `Pedido`           | autenticado                       |
| POST   | `/orders`                   | `CreatePedidoDto`                   | `Pedido`           | Mesero, Admin+                    |
| PATCH  | `/orders/:id/status`        | `{ estado: EstadoPedido }`          | `Pedido`           | Mesero, Cocina, Domiciliario, Admin+ |
| POST   | `/orders/:id/finalizar`     | `{ metodo, monto, vuelto }`         | `{ success: true }`| Mesero, Admin+                    |

### Inventario

| Método | Ruta                    | Request Body              | Response              | Roles     |
|--------|-------------------------|---------------------------|-----------------------|-----------|
| GET    | `/inventory`            | —                         | `ItemInventario[]`    | AdminSede |
| POST   | `/inventory`            | `CreateItemDto`           | `ItemInventario`      | AdminSede |
| PATCH  | `/inventory/:id`        | `Partial<ItemInventario>` | `ItemInventario`      | AdminSede |
| GET    | `/inventory/ajustes`    | —                         | `AjusteInventario[]`  | AdminSede |
| POST   | `/inventory/ajustes`    | `CreateAjusteDto`         | `AjusteInventario`    | AdminSede |

### Caja

| Método | Ruta            | Request Body             | Response   | Roles     |
|--------|-----------------|--------------------------|------------|-----------|
| GET    | `/caja`         | —                        | `Caja`     | AdminSede |
| POST   | `/caja/abrir`   | `{ montoInicial }`       | `Caja`     | AdminSede |
| POST   | `/caja/cerrar`  | `{ montoFinal }`         | `Caja`     | AdminSede |

### Movimientos

| Método | Ruta           | Request Body                           | Response       | Roles     |
|--------|----------------|----------------------------------------|----------------|-----------|
| GET    | `/movimientos` | —                                      | `Movimiento[]` | AdminSede |
| POST   | `/movimientos` | `{ tipo, monto, descripcion }`         | `Movimiento`   | AdminSede |

### Usuarios

| Método | Ruta             | Request Body          | Response    | Roles     |
|--------|------------------|-----------------------|-------------|-----------|
| GET    | `/usuarios`      | —                     | `Usuario[]` | AdminSede |
| POST   | `/usuarios`      | `CreateUsuarioDto`    | `Usuario`   | AdminSede |
| PATCH  | `/usuarios/:id`  | `Partial<Usuario>`    | `Usuario`   | AdminSede |

### Reportes

| Método | Ruta                          | Query params              | Response              | Roles              |
|--------|-------------------------------|---------------------------|-----------------------|--------------------|
| GET    | `/reports/summary`            | `periodo=today\|7d\|30d`  | `SummaryDto`          | Admin+, Owner      |
| GET    | `/reports/sales`              | `periodo=today\|7d\|30d`  | `VentaDiaria[]`       | Admin+, Owner      |
| GET    | `/reports/product-performance`| `periodo=today\|7d\|30d`  | `ProductoVendido[]`   | Admin+, Owner      |
| GET    | `/reportes/caja-historial`    | `branchId?` (opcional)    | `CajaHistorial[]`     | Admin+, Owner      |

---

## 7. Flujo de Autenticación (JWT)

```
1. POST /auth/login  →  { accessToken, user }
2. Frontend guarda token en localStorage como "rm_token"
3. AuthService decodifica el JWT con decodeJwt() y expone signals:
     currentUser  → JwtPayload | null
     isLoggedIn   → boolean
     rol          → Rol | null
     sedeId       → string | null
     isSuperAdmin → boolean
4. auth.interceptor.ts agrega a cada request:
     Authorization: Bearer <rm_token>
5. Si el backend responde 401 → AuthService.logout() → redirige a /login
```

**Señales expuestas por AuthService:**

| Signal          | Tipo               | Descripción                                |
|-----------------|--------------------|--------------------------------------------|
| `currentUser`   | `JwtPayload\|null` | Payload decodificado del JWT               |
| `isLoggedIn`    | `boolean`          | `currentUser !== null && !expired`         |
| `rol`           | `Rol\|null`        | `currentUser?.rol`                         |
| `sedeId`        | `string\|null`     | `currentUser?.sedeId`                      |
| `isSuperAdmin`  | `boolean`          | `rol === SuperAdmin || rol === Owner`       |

**TenantService:**
- SuperAdmin/Owner: puede seleccionar sede activa dinámicamente desde el dashboard
- Otros roles: `sedeId` viene fijo en el JWT y no cambia

---

## 8. WebSocket — Eventos en Tiempo Real

**URL de conexión:** `environment.wsUrl` (ej: `ws://localhost:3000`)
**Auth:** token JWT enviado como query param al conectar
**Librería frontend:** Socket.IO client

### Eventos que el frontend escucha

| Evento                      | Payload                                     | Componentes que lo consumen          |
|-----------------------------|---------------------------------------------|--------------------------------------|
| `pedido:nuevo`              | `{ pedido: Pedido }`                        | `ListaPedidosComponent`, `VistaCocinaComponent` |
| `pedido:estado_actualizado` | `{ pedidoId: string, estado: EstadoPedido }`| `ListaPedidosComponent`, `VistaCocinaComponent` |

### Comportamiento esperado del backend
- Emitir `pedido:nuevo` cuando se crea un pedido via `POST /orders`
- Emitir `pedido:estado_actualizado` cuando cambia el estado via `PATCH /orders/:id/status`

---

## 9. Lógica de Negocio en el Mock

### Finalización de pedido (`POST /orders/:id/finalizar`)

Al finalizar un pedido, el mock ejecuta `descontarInventario(pedido)`:

1. **Productos SIMPLE** (`tipo === 'simple' && itemInventarioId`):
   - Descuenta del inventario: `stockActual -= item.cantidad`
   - Crea ajuste de tipo `'salida'` con motivo `"Venta — pedido #XXXXXX"`

2. **Productos PREPARADO** (`tipo === 'preparado' && ingredientes.length > 0`):
   - Por cada ingrediente: `stockActual -= ingrediente.cantidad * item.cantidad`
   - Crea ajuste de tipo `'salida'` por cada ingrediente

3. Crea un `Movimiento` de tipo `'ingreso'` con `monto = pedido.total` en la caja activa.

**El backend debe replicar esta misma lógica al recibir `POST /orders/:id/finalizar`.**

### Ajuste de inventario (`POST /inventory/ajustes`)

| tipo      | Efecto sobre stockActual              |
|-----------|---------------------------------------|
| `entrada` | `stockActual += cantidad`             |
| `salida`  | `stockActual = max(0, stockActual - cantidad)` |
| `ajuste`  | `stockActual = cantidad` (reemplaza)  |

---

## 10. Servicios Core

### AuthService (`src/app/core/auth/auth.service.ts`)

- Almacena JWT en `localStorage['rm_token']`
- Decodifica JWT con `decodeJwt()` (base64 del payload, sin verificar firma en frontend)
- Métodos: `login()`, `logout()`, `isTokenExpired()`

### TenantService (`src/app/core/tenant/tenant.service.ts`)

- Gestiona la `sedeActiva` para SuperAdmin/Owner
- Otros roles: `sedeActiva` = `sedeId` del JWT (inmutable)
- Expone signal `sedeActiva: string | null`

### SocketService (`src/app/core/websocket/socket.service.ts`)

```typescript
// Conexión
connect(token: string): void  // conecta a wsUrl con { auth: { token } }
disconnect(): void

// Eventos
on<T>(event: string): Observable<T>

// Uso en componentes:
socketService.on<{ pedido: Pedido }>('pedido:nuevo').subscribe(...)
socketService.on<{ pedidoId: string, estado: EstadoPedido }>('pedido:estado_actualizado').subscribe(...)
```

### AuthInterceptor (`src/app/core/interceptors/auth.interceptor.ts`)

```typescript
// Añade a cada request HTTP:
headers: { Authorization: `Bearer ${localStorage.getItem('rm_token')}` }

// En respuesta 401:
authService.logout()
router.navigate(['/login'])
```

### MockInterceptor (`src/app/core/mocks/mock.interceptor.ts`)

- Activo cuando `MOCKS_ENABLED = true`
- Intercepta ANTES que `authInterceptor` (orden en `app.config.ts`)
- Elimina el prefijo `https?://[host]/api/` de la URL antes de hacer match
- Ignora query params al hacer match de ruta
- Responde con `HttpResponse` directamente, sin llamar al backend real

---

## Resumen de Mapeo Frontend → Backend

| Frontend (URL) | Backend (controller) | Implementado |
|----------------|----------------------|--------------|
| `/auth/login` | `AutController` | ✅ |
| `/branches` CRUD | `BranchesController` | ✅ |
| `/product` CRUD | `ProductsController` | ✅ |
| `/orders` + `/orders/activos` | `OrderController` | ✅ |
| `/orders/:id/status` | `OrderController` | ✅ |
| `/orders/:id/finalizar` | `OrderController` | ✅ |
| `/inventory` CRUD | `InventoryController` | ✅ |
| `/inventory/ajustes` GET+POST | `InventoryController` | ✅ |
| `/caja` GET + abrir + cerrar | `CajaController` | ✅ |
| `/movimientos` GET + POST | `MovimientosController` | ✅ |
| `/usuarios` CRUD | `UsuariosController` | ✅ |
| `/reports/summary` | `ReportsController` | ✅ |
| `/reports/sales` | `ReportsController` | ✅ |
| `/reports/product-performance` | `ReportsController` | ✅ |
| `/reports/ventas-diarias` | `ReportsController` | ✅ |
| `/reportes/caja-historial` | `ReportesController` | ✅ |
| WebSocket `pedido:nuevo` | `OrdersGateway` | ⚠️ pendiente |
| WebSocket `pedido:estado_actualizado` | `OrdersGateway` | ⚠️ pendiente |
