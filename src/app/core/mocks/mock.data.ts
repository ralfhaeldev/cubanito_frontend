import { Sede, Usuario, Rol, Producto, Pedido, TipoPedido, EstadoPedido, Caja, Movimiento, TipoMovimiento } from "../../shared/models";
 
// ─── Sedes ────────────────────────────────────────────────────────────────────


export const MOCK_SEDES: Sede[] = [
  { id: 'sede-1', nombre: 'Sede Centro',   activa: true },
  { id: 'sede-2', nombre: 'Sede Norte',    activa: true },
  { id: 'sede-3', nombre: 'Sede Sur',      activa: false },
];

// ─── Usuarios (credenciales de prueba) ───────────────────────────────────────
//
//  email                     password   rol
//  ------------------------  ---------  ----------------
//  superadmin@test.com       1234       super_admin
//  admin@sede1.com           1234       admin_sede
//  mesero@sede1.com          1234       mesero
//  cocina@sede1.com          1234       cocina
//  domiciliario@sede1.com    1234       domiciliario

export const MOCK_USUARIOS: (Usuario & { password: string; sedeId: string | null })[] = [
  { id: 'u-1', nombre: 'Carlos Super',    email: 'superadmin@test.com',      password: '1234', rol: Rol.SuperAdmin,   sedeId: null,     activo: true },
  { id: 'u-2', nombre: 'Ana Admin',       email: 'admin@sede1.com',          password: '1234', rol: Rol.AdminSede,    sedeId: 'sede-1', activo: true },
  { id: 'u-3', nombre: 'Pedro Mesero',    email: 'mesero@sede1.com',         password: '1234', rol: Rol.Mesero,       sedeId: 'sede-1', activo: true },
  { id: 'u-4', nombre: 'Luis Cocina',     email: 'cocina@sede1.com',         password: '1234', rol: Rol.Cocina,       sedeId: 'sede-1', activo: true },
  { id: 'u-5', nombre: 'Mario Domicilio', email: 'domiciliario@sede1.com',   password: '1234', rol: Rol.Domiciliario, sedeId: 'sede-1', activo: true },
];

// ─── Productos ────────────────────────────────────────────────────────────────

export const MOCK_PRODUCTOS: Producto[] = [
  { id: 'p-1', nombre: 'Cubanito Clásico',    precioVenta: 12000, precioCompra: 5000,  activo: true },
  { id: 'p-2', nombre: 'Cubanito Especial',   precioVenta: 15000, precioCompra: 6500,  activo: true },
  { id: 'p-3', nombre: 'Cubanito BBQ',        precioVenta: 14000, precioCompra: 6000,  activo: true },
  { id: 'p-4', nombre: 'Gaseosa',             precioVenta: 3000,  precioCompra: 1500,  activo: true },
  { id: 'p-5', nombre: 'Agua',                precioVenta: 2000,  precioCompra: 800,   activo: true },
  { id: 'p-6', nombre: 'Papa Francesa',       precioVenta: 6000,  precioCompra: 2000,  activo: true },
  { id: 'p-7', nombre: 'Cubanito Vegetariano',precioVenta: 13000, precioCompra: 5500,  activo: false },
];

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export const MOCK_PEDIDOS: Pedido[] = [
  {
    id: 'ped-1',
    tipo: TipoPedido.Local,
    estado: EstadoPedido.Pendiente,
    meseroId: 'u-3',
    meseroNombre: 'Pedro Mesero',
    total: 15000,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    items: [
      { id: 'i-1', productoId: 'p-1', productoNombre: 'Cubanito Clásico', cantidad: 1, precioUnitario: 12000, subtotal: 12000 },
      { id: 'i-2', productoId: 'p-4', productoNombre: 'Gaseosa',          cantidad: 1, precioUnitario: 3000,  subtotal: 3000 },
    ],
  },
  {
    id: 'ped-2',
    tipo: TipoPedido.Domicilio,
    estado: EstadoPedido.EnProceso,
    meseroId: 'u-3',
    meseroNombre: 'Pedro Mesero',
    total: 33000,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    clienteDomicilio: { nombre: 'Juan García', telefono: '3001234567', direccion: 'Cra 45 #23-10 Apto 301' },
    items: [
      { id: 'i-3', productoId: 'p-2', productoNombre: 'Cubanito Especial', cantidad: 2, precioUnitario: 15000, subtotal: 30000 },
      { id: 'i-4', productoId: 'p-5', productoNombre: 'Agua',              cantidad: 1, precioUnitario: 2000,  subtotal: 2000 },
      { id: 'i-5', productoId: 'p-4', productoNombre: 'Gaseosa',           cantidad: 1, precioUnitario: 3000,  subtotal: 3000 },  // ajuste
    ],
  },
  {
    id: 'ped-3',
    tipo: TipoPedido.Local,
    estado: EstadoPedido.Entregado,
    meseroId: 'u-3',
    meseroNombre: 'Pedro Mesero',
    total: 20000,
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    items: [
      { id: 'i-6', productoId: 'p-3', productoNombre: 'Cubanito BBQ',  cantidad: 1, precioUnitario: 14000, subtotal: 14000 },
      { id: 'i-7', productoId: 'p-6', productoNombre: 'Papa Francesa', cantidad: 1, precioUnitario: 6000,  subtotal: 6000 },
    ],
  },
  {
    id: 'ped-4',
    tipo: TipoPedido.Local,
    estado: EstadoPedido.Finalizado,
    meseroId: 'u-3',
    meseroNombre: 'Pedro Mesero',
    total: 27000,
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    items: [
      { id: 'i-8', productoId: 'p-1', productoNombre: 'Cubanito Clásico', cantidad: 2, precioUnitario: 12000, subtotal: 24000 },
      { id: 'i-9', productoId: 'p-5', productoNombre: 'Agua',             cantidad: 1, precioUnitario: 2000,  subtotal: 2000 },
      { id: 'i-a', productoId: 'p-4', productoNombre: 'Gaseosa',          cantidad: 1, precioUnitario: 3000,  subtotal: 3000 }, // ajuste
    ],
  },
];

// ─── Caja ─────────────────────────────────────────────────────────────────────

export const MOCK_CAJA: Caja = {
  id:           'caja-1',
  fecha:        new Date().toISOString().split('T')[0],
  montoInicial: 50000,
  abierta:      true,
  abiertaPor:   'u-2',
};

// ─── Movimientos ──────────────────────────────────────────────────────────────

export const MOCK_MOVIMIENTOS: Movimiento[] = [
  { id: 'mov-1', cajaId: 'caja-1', tipo: TipoMovimiento.Ingreso, monto: 27000, descripcion: 'Pago pedido #ped-4',          createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: 'mov-2', cajaId: 'caja-1', tipo: TipoMovimiento.Gasto,   monto: 8000,  descripcion: 'Compra de insumos — pan',     createdAt: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 'mov-3', cajaId: 'caja-1', tipo: TipoMovimiento.Egreso,  monto: 5000,  descripcion: 'Pago servicio de aseo',       createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
];