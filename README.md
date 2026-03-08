# 🍔 Restaurant Manager — Frontend

Aplicación web construida con **Angular** y **Tailwind CSS** para la gestión integral de restaurantes multi-sede. Soporta múltiples roles de usuario, comunicación en tiempo real vía WebSockets y una interfaz adaptada por rol.

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 17+ | Framework principal |
| Tailwind CSS | 3.x | Estilos utilitarios |
| TypeScript | 5.x | Lenguaje base |
| RxJS | 7.x | Programación reactiva |
| Socket.IO Client | 4.x | WebSockets en tiempo real |
| Angular Router | - | Navegación y guards |

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── auth/                    # Login, guards, interceptores JWT
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   ├── tenant/                  # Manejo de sede activa en sesión
│   │   │   └── tenant.service.ts
│   │   └── websocket/               # Servicio global de WebSocket
│   │       └── socket.service.ts
│   │
│   ├── shared/
│   │   ├── components/              # Componentes UI reutilizables
│   │   │   ├── table/
│   │   │   ├── modal/
│   │   │   ├── badge-estado/        # Badge de estado de pedido
│   │   │   └── ...
│   │   └── pipes/                   # Pipes personalizados
│   │
│   ├── features/
│   │   ├── dashboard/               # Dashboard por rol
│   │   ├── pedidos/                 # Gestión de pedidos
│   │   ├── productos/               # Catálogo de productos por sede
│   │   ├── inventario/              # Control de stock
│   │   ├── caja/                    # Apertura/cierre de caja
│   │   ├── movimientos/             # Ingresos, egresos y gastos
│   │   ├── reportes/                # Gráficas y reportes
│   │   └── usuarios/                # Gestión de usuarios de la sede
│   │
│   └── layouts/
│       ├── admin-layout/            # Layout completo para Admin y Super Admin
│       ├── cocina-layout/           # Vista simplificada para cocina
│       └── mesero-layout/           # Vista de toma de pedidos
```

---

## 👥 Roles y Acceso

| Rol | Vistas disponibles |
|---|---|
| **Super Admin** | Selector de sede, gestión de sedes, reportes por sede, usuarios globales |
| **Admin Sede** | Dashboard, pedidos, caja, movimientos, reportes, productos, usuarios |
| **Mesero** | Crear pedidos, ver pedidos activos propios |
| **Cocina** | Cola de pedidos, cambiar estado a _En Proceso_ |
| **Domiciliario** | Pedidos asignados a domicilio, marcar como _Enviado_ |

---

## 🔄 Flujo de Estados de Pedido

```
Pendiente → En Proceso → Entregado → Finalizado
                       ↘ Enviado ↗     (solo domicilios)
                       ↘ Rechazado
```

> **Nota:** Solo el **Admin de Sede** puede ejecutar la transición `Entregado → Finalizado` tras confirmar el pago.

---

## ⚡ WebSockets

La aplicación se conecta a un gateway por sede usando **Socket.IO**. Los canales activos son:

| Evento | Descripción | Roles que escuchan |
|---|---|---|
| `pedido:nuevo` | Nuevo pedido registrado | Cocina |
| `pedido:estado` | Cambio de estado en un pedido | Mesero, Domiciliario |
| `pedido:finalizado` | Pedido cobrado y cerrado | Admin |

Cada conexión queda suscrita al **room** de su sede correspondiente.

---

## 🔐 Autenticación

- Login por sede — el usuario selecciona o es redirigido a la sede correspondiente
- JWT almacenado en memoria de sesión
- El token contiene: `userId`, `rol`, `sedeId`
- Guards de ruta validan rol y sede en cada navegación
- El **Super Admin** tiene un selector de sede en su dashboard para navegar entre tenants

---

## 🚀 Instalación y Ejecución

### Prerrequisitos

- Node.js >= 18
- npm >= 9

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/restaurant-manager-frontend.git
cd restaurant-manager-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL del backend y WS

# 4. Ejecutar en desarrollo
npm run start

# 5. Build de producción
npm run build
```

### Variables de entorno

```env
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000
```

---

## 🧪 Tests

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run e2e
```

---

## 📐 Convenciones

- Componentes en `PascalCase`, archivos en `kebab-case`
- Un módulo por feature con lazy loading
- Servicios en `core/` son singleton globales
- Tailwind para todos los estilos — sin CSS custom salvo excepciones justificadas
- Reactive Forms para todos los formularios
- Manejo de errores centralizado vía interceptor HTTP

---

## 📌 Roadmap Frontend

- [ ] Zona pública de menú online para clientes
- [ ] Módulo de tracking de domicilios
- [ ] Reportes avanzados con tiempos por estado
- [ ] PWA / notificaciones push para cocina