# Manual de Usuario — Restaurant Manager

Sistema de gestión para restaurantes multi-sede. Cubre el ciclo completo de operación: pedidos, cocina, domicilios, inventario, caja y reportes.

---

## Tabla de contenidos

1. [Roles y permisos](#1-roles-y-permisos)
2. [Credenciales de prueba](#2-credenciales-de-prueba)
3. [Flujo completo de un pedido](#3-flujo-completo-de-un-pedido)
4. [Guía por rol](#4-guía-por-rol)
   - [Super Admin](#41-super-admin)
   - [Admin Sede](#42-admin-sede)
   - [Mesero](#43-mesero)
   - [Cocina](#44-cocina)
   - [Domiciliario](#45-domiciliario)
5. [Módulos en detalle](#5-módulos-en-detalle)
   - [Pedidos](#51-pedidos)
   - [Productos](#52-productos)
   - [Inventario](#53-inventario)
   - [Caja](#54-caja)
   - [Reportes](#55-reportes)
   - [Usuarios](#56-usuarios)
   - [Sedes](#57-sedes)
6. [Lógica de negocio](#6-lógica-de-negocio)

---

## 1. Roles y permisos

El sistema tiene cinco roles. Cada rol accede únicamente a las secciones que necesita para su trabajo.

| Rol | Ruta inicial | Módulos accesibles |
|---|---|---|
| **Owner** | `/dashboard` | Dashboard · Reportes · Sedes (crear / gestionar) |
| **Super Admin** | `/dashboard` | Dashboard · Reportes |
| **Admin Sede** | `/dashboard` | Dashboard · Pedidos · Productos · Inventario · Caja · Reportes · Usuarios |
| **Mesero** | `/pedidos` | Pedidos (sin pestaña Finalizados) |
| **Cocina** | `/cocina` | Vista Cocina (pantalla completa) |
| **Domiciliario** | `/domiciliario` | Vista Domiciliario (pantalla completa) |

**Reglas importantes:**
- Un usuario sin sesión activa es redirigido a `/auth/login`.
- Un usuario autenticado que intenta acceder a una ruta que no le corresponde es redirigido a su página de inicio.
- El **Owner** es el único que puede crear y gestionar sedes — acción comercial reservada para la empresa proveedora del software.
- El **Super Admin** y el **Owner** no tienen `sedeId` — operan de forma global y seleccionan la sede activa desde el dashboard.
- El **Admin Sede** tiene su sede fijada en el JWT y solo gestiona esa sede.

---

## 2. Credenciales de prueba

Todas las cuentas usan la contraseña `1234`. El modo mock está activo por defecto.

| Usuario | Email | Rol |
|---|---|---|
| Owner Plataforma | `owner@plataforma.com` | Owner |
| Carlos Super | `superadmin@test.com` | Super Admin |
| Ana Admin | `admin@sede1.com` | Admin Sede |
| Pedro Mesero | `mesero@sede1.com` | Mesero |
| Luis Cocina | `cocina@sede1.com` | Cocina |
| Mario Domicilio | `domiciliario@sede1.com` | Domiciliario |

---

## 3. Flujo completo de un pedido

Un pedido pasa por hasta seis estados. Cada estado lo avanza un rol diferente.

```
[Mesero crea]
      │
      ▼
  PENDIENTE ──────────────────────────────────────────────────────► RECHAZADO
      │                                                           (Admin Sede)
      │ Cocina: "Tomar pedido"
      ▼
  EN PROCESO ─────────────────────────────────────────────────────► RECHAZADO
      │                                                           (Admin Sede)
      │ Cocina: "Marcar listo"
      ▼
   ENVIADO ──────────────────────────────────────────────────────► RECHAZADO
      │                                                           (Admin Sede)
      │ Domiciliario: "Marcar entregado" (solo domicilios)
      │ Admin Sede: "Marcar entregado" (cualquier tipo)
      ▼
  ENTREGADO ──────────────────────────────────────────────────────► RECHAZADO
      │                                                           (Admin Sede)
      │ Admin Sede: "Cobrar y finalizar"
      ▼
  FINALIZADO  ← descuenta inventario + registra ingreso en caja
```

### Transiciones por rol

| Acción | Rol | Estado origen | Estado destino |
|---|---|---|---|
| Crear pedido | Mesero / Admin Sede | — | Pendiente |
| Tomar pedido | Cocina / Admin Sede | Pendiente | En proceso |
| Marcar listo | Cocina / Admin Sede | En proceso | Enviado |
| Marcar enviado (domicilio) | Domiciliario | En proceso | Enviado |
| Marcar entregado | Admin Sede | En proceso / Enviado | Entregado |
| Cobrar y finalizar | Admin Sede | Entregado | Finalizado |
| Rechazar | Admin Sede | Cualquier estado activo | Rechazado |

### Qué ocurre al finalizar un pedido

1. El stock de inventario se descuenta automáticamente:
   - **Producto simple:** se descuenta 1 unidad × cantidad vendida del ítem vinculado.
   - **Producto preparado:** se descuenta cada ingrediente según su receta × cantidad vendida.
2. Se crea un movimiento de tipo **Ingreso** en la caja del día con el total del pedido.
3. El pedido aparece en el dashboard y en los reportes.

---

## 4. Guía por rol

### 4.1 Super Admin

El Super Admin tiene visión global de toda la cadena. No opera una sede específica.

**Al iniciar sesión:**
- Llega al **Dashboard** con estadísticas consolidadas.
- Debe seleccionar una sede activa para ver datos específicos de ella.

**Tareas principales:**

| Tarea | Dónde hacerlo |
|---|---|
| Crear / editar / pausar una sede | Módulo **Sedes** |
| Ver ventas y métricas | Módulo **Reportes** (selector de período: hoy / 7 días / 30 días) |
| Ver estado general de pedidos del día | **Dashboard** |

---

### 4.2 Admin Sede

Es el rol con más permisos dentro de una sede. Coordina todas las operaciones del día.

**Rutina de apertura:**
1. Ir a **Caja** → clic en **Abrir caja**.
2. Ingresar el monto inicial en efectivo.
3. Confirmar apertura.

**Durante el turno:**
- Supervisar pedidos en **Pedidos** → pestaña *Activos*.
- Marcar pedidos como entregados y cobrarlos.
- Registrar gastos u otros movimientos en **Caja** → botón *Movimiento*.
- Ajustar stock manualmente en **Inventario** cuando sea necesario.

**Cobro de un pedido (paso a paso):**
1. Abrir el pedido desde la lista (clic sobre la tarjeta).
2. Si el pedido está en *En proceso* o *Enviado*: clic en **Marcar como entregado**.
3. Con el pedido en *Entregado*: clic en **Cobrar y finalizar**.
4. Seleccionar el método de pago:
   - **Efectivo:** ingresar el monto recibido. El sistema muestra el vuelto en verde (o el faltante en rojo). El botón *Confirmar pago* se habilita cuando el monto es suficiente.
   - **Transferencia:** el botón *Confirmar pago* se habilita de inmediato.
5. Clic en **Confirmar pago**. El pedido pasa a *Finalizado*.

**Rutina de cierre:**
1. Ir a **Caja** → clic en **Cerrar caja**.
2. Revisar el resumen: monto inicial, ingresos, egresos y monto esperado.
3. Ingresar el monto real contado en caja.
4. Confirmar cierre. El sistema registra la discrepancia.

---

### 4.3 Mesero

El mesero crea pedidos y los monitorea hasta que son cobrados.

**Crear un pedido (paso a paso):**
1. Ir a **Pedidos** → clic en **Nuevo pedido**.
2. En el panel izquierdo: buscar o filtrar productos y hacer clic en **+** para agregarlos al carrito.
3. Ajustar cantidades con los botones **−** y **+** en el carrito.
4. Seleccionar el tipo de pedido:
   - **Mesa / Local:** no requiere datos adicionales.
   - **Domicilio:** completar nombre, teléfono y dirección del cliente.
5. Clic en **Crear pedido**.

**Seguimiento:**
- Los pedidos creados aparecen en la pestaña *Activos*.
- Una etiqueta **nuevo** (naranja) aparece por 8 segundos al crear el pedido.
- El mesero puede ver el progreso del pedido pero no puede cambiar su estado ni cobrarlo.
- La pestaña *Finalizados* no está disponible para el mesero.

---

### 4.4 Cocina

La vista de cocina es una pantalla completa de tipo **Kanban** con tres columnas.

**Columnas:**

| Columna | Color | Pedidos que muestra | Acción disponible |
|---|---|---|---|
| Pendientes | Amarillo | `estado = Pendiente` | **Tomar pedido** → pasa a *En proceso* |
| En preparación | Azul | `estado = En proceso` | **Marcar listo** → pasa a *Enviado* |
| Listos para entregar | Verde | `estado = Enviado` | Solo lectura — esperando retiro |

**Indicadores visuales:**
- Un pedido en *Pendiente* con más de 15 minutos sin atender muestra el badge **⚡ Urgente** en rojo parpadeante.
- Los pedidos de domicilio muestran la dirección del cliente en un recuadro azul.
- La pantalla se actualiza automáticamente cada 12 segundos.

**Cómo operar:**
1. Al llegar un pedido nuevo, aparece en la columna *Pendientes*.
2. Clic en **Tomar pedido** para moverlo a *En preparación*.
3. Cuando está listo, clic en **Marcar listo** para moverlo a *Listos para entregar*.
4. El domiciliario o el admin retirarán el pedido desde ahí.

---

### 4.5 Domiciliario

La vista del domiciliario es una pantalla completa dividida en dos paneles.

**Panel izquierdo — Listos para entregar:**
- Muestra pedidos con `tipo = Domicilio` y `estado = Enviado`.
- Cada tarjeta incluye: nombre del cliente, teléfono (enlace directo para llamar), dirección, lista de productos y total.
- Clic en **Marcar como entregado** para registrar la entrega.

**Panel derecho — Entregados hoy:**
- Historial de entregas completadas en el día actual.
- Muestra un resumen con el total acumulado de entregas.

**Cómo operar:**
1. Cuando cocina marca un domicilio como listo, aparece en el panel izquierdo.
2. El domiciliario sale a entregar y, al hacerlo, clic en **Marcar como entregado**.
3. El pedido se mueve al panel derecho y queda disponible para cobro por parte del admin.

---

## 5. Módulos en detalle

### 5.1 Pedidos

**Pestañas disponibles:**

| Pestaña | Contenido | Visible para |
|---|---|---|
| Activos | Pedidos en estado Pendiente, En proceso, Enviado, Entregado | Todos |
| Todos | Todos los pedidos con filtro opcional por estado | Todos |
| Domicilios | Solo pedidos tipo Domicilio en estados activos | Todos |
| Finalizados | Pedidos Finalizados y Rechazados | Solo Admin Sede |

**Panel de detalle (al hacer clic en un pedido):**
- Timeline visual del progreso del pedido.
- Lista de productos con cantidades y subtotales.
- Datos del cliente (si es domicilio).
- Nombre del mesero que tomó el pedido.
- Acciones disponibles según el rol y el estado actual del pedido.

---

### 5.2 Productos

Gestión del catálogo de productos de la sede.

**Tipos de producto:**

| Tipo | Descripción | Inventario |
|---|---|---|
| **Directo (Simple)** | Se vende tal cual. Ej: gaseosa, agua. | Descuenta 1 unidad del ítem vinculado al venderse. |
| **Preparado** | Se elabora con ingredientes. Ej: cubanito. | Descuenta cada ingrediente según la receta al venderse. |

**Indicadores de margen:**

| Margen | Color | Señal |
|---|---|---|
| ≥ 40% | Verde | Rentabilidad saludable |
| ≥ 20% | Ámbar | Rentabilidad aceptable |
| < 20% | Rojo | Rentabilidad baja |

**Crear un producto preparado (paso a paso):**
1. Clic en **Nuevo producto**.
2. Seleccionar tipo **Preparado**.
3. Ingresar nombre, precio de venta y costo de producción.
4. En la sección *Ingredientes*: clic en **Añadir**, seleccionar el ítem de inventario y definir la cantidad usada por unidad producida.
5. Repetir para cada ingrediente.
6. Clic en **Crear producto**.

---

### 5.3 Inventario

Control de stock de todos los insumos de la sede.

**Niveles de stock:**

| Nivel | Condición | Color |
|---|---|---|
| **OK** | `stockActual >= stockMinimo` | Verde |
| **Bajo** | `stockMinimo × 0.5 ≤ stockActual < stockMinimo` | Ámbar |
| **Crítico** | `stockActual < stockMinimo × 0.5` o `stockActual ≤ 0` | Rojo |

**Tipos de ajuste manual:**

| Tipo | Efecto | Cuándo usarlo |
|---|---|---|
| Entrada | `stock += cantidad` | Llegó mercancía del proveedor |
| Salida | `stock = max(0, stock - cantidad)` | Merma, pérdida, retiro |
| Ajuste | `stock = cantidad` | Conteo físico de inventario |

**Registrar una entrada de mercancía (paso a paso):**
1. Localizar el ítem en la lista (usar búsqueda o filtro de categoría).
2. Clic en el ícono **tune** (ajustar) del ítem.
3. Seleccionar tipo **Entrada**.
4. Ingresar la cantidad recibida y el motivo (ej: "Compra proveedor X").
5. Clic en **Confirmar ajuste**.

**Crear un nuevo ítem de inventario:**
1. Clic en **Nuevo ítem** (esquina superior derecha del módulo).
2. Completar: nombre, categoría, unidad de medida, stock inicial, stock mínimo y stock ideal.
3. Clic en **Crear ítem**.

---

### 5.4 Caja

Control del efectivo y movimientos financieros del día.

**Estados de la caja:**
- **Abierta:** se pueden registrar movimientos. Muestra el balance en tiempo real.
- **Cerrada:** no se pueden registrar movimientos hasta que se abra una nueva.

**Tipos de movimiento:**

| Tipo | Color | Efecto en balance | Ejemplo |
|---|---|---|---|
| Ingreso | Verde | + | Pago de pedido (automático) |
| Egreso | Rojo | − | Devolución a cliente |
| Gasto | Naranja | − | Compra de insumos en efectivo |

> Los pagos de pedidos crean automáticamente un movimiento de tipo *Ingreso* al finalizar el pedido. No es necesario registrarlos manualmente.

**Balance estimado al cierre:**
```
Balance = montoInicial + Σ Ingresos − Σ (Egresos + Gastos)
```

---

### 5.5 Reportes

Análisis de rendimiento con tres períodos seleccionables: **Hoy**, **7 días** y **30 días**.

**KPIs:**
- **Ventas totales:** suma de todos los pedidos finalizados en el período.
- **Pedidos:** cantidad total de pedidos finalizados.
- **Ticket promedio:** ventas totales ÷ cantidad de pedidos.
- **Domicilios:** cantidad de pedidos tipo domicilio finalizados.

**Gráficas:**
1. **Ventas por día** (barras): evolución de ingresos diarios.
2. **Pedidos vs Domicilios** (líneas): comparativo de volumen total vs domicilios.
3. **Distribución por producto** (dona): participación de los 5 productos más vendidos.

**Tabla Historial de caja:** muestra los últimos 7 cierres de caja con columnas de apertura, ingresos, egresos, cierre y balance resultante.

---

### 5.6 Usuarios

Gestión del equipo de la sede (visible solo para Admin Sede).

**Roles asignables a nuevos usuarios:**
- Admin Sede, Mesero, Cocina, Domiciliario.
  *(El rol Super Admin no se puede asignar desde este módulo.)*

**Crear un usuario (paso a paso):**
1. Clic en **Nuevo usuario**.
2. Completar nombre, email, rol y sede.
3. Clic en **Crear usuario**.

**Activar / desactivar un usuario:**
- Clic en el toggle de estado en la tarjeta del usuario.
- Un usuario desactivado no puede iniciar sesión.

---

### 5.7 Sedes

Gestión de sucursales (visible solo para Super Admin).

**Crear una sede (paso a paso):**
1. Clic en la tarjeta **Agregar sede** al final de la grilla.
2. Ingresar el nombre de la nueva sede.
3. Clic en **Crear sede**.

**Pausar / activar una sede:**
- Clic en **Pausar** para marcar la sede como inactiva.
- Clic en **Activar** para reactivarla.
- Una sede inactiva sigue existiendo en el sistema pero no aparece como opción en la selección de sede del Super Admin.

---

## 6. Lógica de negocio

### Descuento automático de inventario

El descuento ocurre **únicamente al finalizar un pedido** (no al crearlo ni en estados intermedios).

**Producto simple (Directo):**
```
stock_nuevo = stock_actual − cantidad_vendida
```

**Producto preparado:**
```
por cada ingrediente en la receta:
  stock_nuevo = stock_actual − (cantidad_ingrediente × cantidad_vendida)
```

Cada descuento genera un registro de ajuste del tipo *salida* con el motivo `"Venta — pedido #XXXXXX"`.

### Visibilidad de pedidos en cocina

La vista de cocina solo muestra pedidos **activos** (estados: Pendiente, En proceso, Enviado). Los pedidos Finalizados y Rechazados no aparecen.

### Pedidos urgentes

Un pedido en estado *Pendiente* con más de **15 minutos** sin ser tomado por cocina se marca automáticamente como **⚡ Urgente** con una animación parpadeante.

### Cálculo de vuelto en efectivo

```
vuelto = monto_recibido − total_pedido
```

- Si `vuelto >= 0`: se muestra en verde como "Vuelto".
- Si `vuelto < 0`: se muestra en rojo como "Falta".
- El botón *Confirmar pago* solo se habilita cuando `monto_recibido >= total_pedido`.

### Margen de rentabilidad de productos

```
margen% = ((precio_venta − costo) / precio_venta) × 100
```

Se muestra en el listado de productos y en el formulario de creación/edición.
