import {
  Rol,
  EstadoPedido,
  TipoPedido,
  TipoMovimiento,
  TipoProducto,
  Producto,
  Pedido,
  Caja,
  Movimiento,
  Sede,
  ItemInventario,
  AjusteInventario,
  Usuario
} from '../../shared/models';

// ─── Sedes ────────────────────────────────────────────────────────────────────
export const MOCK_SEDES: Sede[] = [
  { id: 'sede-1', nombre: 'Sede Centro', activa: true },
  { id: 'sede-2', nombre: 'Sede Norte', activa: true },
  { id: 'sede-3', nombre: 'Sede Sur', activa: false },
];

// ─── Usuarios ─────────────────────────────────────────────────────────────────
export const MOCK_USUARIOS: (Omit<Usuario, 'password'> & {
  password: string;
  sedeId: string | null;
})[] = [
  {
    id: 'u-0',
    nombre: 'Owner Plataforma',
    email: 'owner@plataforma.com',
    password: '1234',
    rol: Rol.Owner,
    sedeId: null,
    activo: true,
  },
  {
    id: 'u-1',
    nombre: 'Carlos Super',
    email: 'superadmin@test.com',
    password: '1234',
    rol: Rol.SuperAdmin,
    sedeId: null,
    activo: true,
  },
  {
    id: 'u-2',
    nombre: 'Ana Admin',
    email: 'admin@sede1.com',
    password: '1234',
    rol: Rol.AdminSede,
    sedeId: 'sede-1',
    activo: true,
  },
  {
    id: 'u-3',
    nombre: 'Pedro Mesero',
    email: 'mesero@sede1.com',
    password: '1234',
    rol: Rol.Mesero,
    sedeId: 'sede-1',
    activo: true,
  },
  {
    id: 'u-4',
    nombre: 'Luis Cocina',
    email: 'cocina@sede1.com',
    password: '1234',
    rol: Rol.Cocina,
    sedeId: 'sede-1',
    activo: true,
  },
  {
    id: 'u-5',
    nombre: 'Mario Domicilio',
    email: 'domiciliario@sede1.com',
    password: '1234',
    rol: Rol.Domiciliario,
    sedeId: 'sede-1',
    activo: true,
  },
];

// ─── Inventario ───────────────────────────────────────────────────────────────
export const MOCK_INVENTARIO: ItemInventario[] = [
  // Panadería
  {
    id: 'inv-1',
    nombre: 'Pan de hamburguesa',
    unidad: 'und',
    stockActual: 45,
    stockMinimo: 20,
    stockIdeal: 100,
    categoria: 'Panadería',
    activo: true,
    ultimoAjuste: null,
  },
  {
    id: 'inv-2',
    nombre: 'Pan de perro',
    unidad: 'und',
    stockActual: 8,
    stockMinimo: 15,
    stockIdeal: 60,
    categoria: 'Panadería',
    activo: true,
    ultimoAjuste: null,
  },
  // Carnes
  {
    id: 'inv-3',
    nombre: 'Carne molida',
    unidad: 'kg',
    stockActual: 4.5,
    stockMinimo: 3,
    stockIdeal: 10,
    categoria: 'Carnes',
    activo: true,
    ultimoAjuste: null,
  },
  {
    id: 'inv-4',
    nombre: 'Pollo desmechado',
    unidad: 'kg',
    stockActual: 1.2,
    stockMinimo: 2,
    stockIdeal: 8,
    categoria: 'Carnes',
    activo: true,
    ultimoAjuste: null,
  },
  {
    id: 'inv-5',
    nombre: 'Jamón serrano',
    unidad: 'kg',
    stockActual: 2.8,
    stockMinimo: 1,
    stockIdeal: 5,
    categoria: 'Carnes',
    activo: true,
    ultimoAjuste: null,
  },
  // Lácteos
  {
    id: 'inv-6',
    nombre: 'Queso mozzarella',
    unidad: 'kg',
    stockActual: 3.2,
    stockMinimo: 2,
    stockIdeal: 6,
    categoria: 'Lácteos',
    activo: true,
    ultimoAjuste: null,
  },
  {
    id: 'inv-7',
    nombre: 'Queso cheddar',
    unidad: 'kg',
    stockActual: 0.8,
    stockMinimo: 1,
    stockIdeal: 4,
    categoria: 'Lácteos',
    activo: true,
    ultimoAjuste: null,
  },
  // Salsas
  {
    id: 'inv-8',
    nombre: 'Mayonesa',
    unidad: 'lt',
    stockActual: 2.5,
    stockMinimo: 1,
    stockIdeal: 5,
    categoria: 'Salsas',
    activo: true,
    ultimoAjuste: null,
  },
  {
    id: 'inv-9',
    nombre: 'Salsa BBQ',
    unidad: 'lt',
    stockActual: 0.4,
    stockMinimo: 0.5,
    stockIdeal: 3,
    categoria: 'Salsas',
    activo: true,
    ultimoAjuste: null,
  },
  // Verduras
  {
    id: 'inv-a',
    nombre: 'Lechuga',
    unidad: 'und',
    stockActual: 12,
    stockMinimo: 5,
    stockIdeal: 20,
    categoria: 'Verduras',
    activo: true,
    ultimoAjuste: null,
  },
  {
    id: 'inv-b',
    nombre: 'Tomate',
    unidad: 'kg',
    stockActual: 2.1,
    stockMinimo: 1,
    stockIdeal: 4,
    categoria: 'Verduras',
    activo: true,
    ultimoAjuste: null,
  },
  {
    id: 'inv-c',
    nombre: 'Cebolla caramelizada',
    unidad: 'kg',
    stockActual: 0.3,
    stockMinimo: 0.5,
    stockIdeal: 2,
    categoria: 'Verduras',
    activo: true,
    ultimoAjuste: null,
  },
  // Bebidas (ítems de inventario para productos simples)
  {
    id: 'inv-d',
    nombre: 'Gaseosa 350ml',
    unidad: 'und',
    stockActual: 24,
    stockMinimo: 12,
    stockIdeal: 48,
    categoria: 'Bebidas',
    activo: true,
    ultimoAjuste: null,
  },
  {
    id: 'inv-e',
    nombre: 'Agua 500ml',
    unidad: 'und',
    stockActual: 6,
    stockMinimo: 10,
    stockIdeal: 36,
    categoria: 'Bebidas',
    activo: true,
    ultimoAjuste: null,
  },
  // Tubérculos
  {
    id: 'inv-f',
    nombre: 'Papa criolla',
    unidad: 'kg',
    stockActual: 5.5,
    stockMinimo: 3,
    stockIdeal: 10,
    categoria: 'Tubérculos',
    activo: true,
    ultimoAjuste: null,
  },
];

export const MOCK_AJUSTES: AjusteInventario[] = [
  {
    id: 'aj-1',
    itemId: 'inv-1',
    itemNombre: 'Pan de hamburguesa',
    tipo: 'entrada',
    cantidad: 50,
    motivo: 'Compra proveedor panadería',
    creadoPor: 'Ana Admin',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'aj-2',
    itemId: 'inv-3',
    itemNombre: 'Carne molida',
    tipo: 'salida',
    cantidad: 2.5,
    motivo: 'Uso en producción del día',
    creadoPor: 'Ana Admin',
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'aj-3',
    itemId: 'inv-9',
    itemNombre: 'Salsa BBQ',
    tipo: 'ajuste',
    cantidad: 0.4,
    motivo: 'Conteo físico de inventario',
    creadoPor: 'Ana Admin',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

// ─── Productos ────────────────────────────────────────────────────────────────
// Productos SIMPLES → vinculados directamente a un ítem de inventario
// Productos PREPARADOS → tienen lista de ingredientes que se descuentan al vender

export const MOCK_PRODUCTOS: Producto[] = [
  // ── Preparados ───────────────────────────────────────────────────────────────
  {
    id: 'p-1',
    nombre: 'Cubanito Clásico',
    tipo: TipoProducto.Preparado,
    precioVenta: 12000,
    precioCompra: 5000,
    activo: true,
    ingredientes: [
      { itemInventarioId: 'inv-1', itemNombre: 'Pan de hamburguesa', cantidad: 1, unidad: 'und' },
      { itemInventarioId: 'inv-3', itemNombre: 'Carne molida', cantidad: 0.12, unidad: 'kg' },
      { itemInventarioId: 'inv-6', itemNombre: 'Queso mozzarella', cantidad: 0.04, unidad: 'kg' },
      { itemInventarioId: 'inv-8', itemNombre: 'Mayonesa', cantidad: 0.02, unidad: 'lt' },
      { itemInventarioId: 'inv-a', itemNombre: 'Lechuga', cantidad: 0.25, unidad: 'und' },
      { itemInventarioId: 'inv-b', itemNombre: 'Tomate', cantidad: 0.05, unidad: 'kg' },
    ],
  },
  {
    id: 'p-2',
    nombre: 'Cubanito Especial',
    tipo: TipoProducto.Preparado,
    precioVenta: 15000,
    precioCompra: 6500,
    activo: true,
    ingredientes: [
      { itemInventarioId: 'inv-1', itemNombre: 'Pan de hamburguesa', cantidad: 1, unidad: 'und' },
      { itemInventarioId: 'inv-3', itemNombre: 'Carne molida', cantidad: 0.15, unidad: 'kg' },
      { itemInventarioId: 'inv-5', itemNombre: 'Jamón serrano', cantidad: 0.05, unidad: 'kg' },
      { itemInventarioId: 'inv-7', itemNombre: 'Queso cheddar', cantidad: 0.05, unidad: 'kg' },
      { itemInventarioId: 'inv-8', itemNombre: 'Mayonesa', cantidad: 0.02, unidad: 'lt' },
      {
        itemInventarioId: 'inv-c',
        itemNombre: 'Cebolla caramelizada',
        cantidad: 0.03,
        unidad: 'kg',
      },
    ],
  },
  {
    id: 'p-3',
    nombre: 'Cubanito BBQ',
    tipo: TipoProducto.Preparado,
    precioVenta: 14000,
    precioCompra: 6000,
    activo: true,
    ingredientes: [
      { itemInventarioId: 'inv-1', itemNombre: 'Pan de hamburguesa', cantidad: 1, unidad: 'und' },
      { itemInventarioId: 'inv-3', itemNombre: 'Carne molida', cantidad: 0.15, unidad: 'kg' },
      { itemInventarioId: 'inv-6', itemNombre: 'Queso mozzarella', cantidad: 0.04, unidad: 'kg' },
      { itemInventarioId: 'inv-9', itemNombre: 'Salsa BBQ', cantidad: 0.03, unidad: 'lt' },
    ],
  },
  {
    id: 'p-6',
    nombre: 'Papa Francesa',
    tipo: TipoProducto.Preparado,
    precioVenta: 6000,
    precioCompra: 2000,
    activo: true,
    ingredientes: [
      { itemInventarioId: 'inv-f', itemNombre: 'Papa criolla', cantidad: 0.2, unidad: 'kg' },
    ],
  },
  // ── Simples (vinculados a inventario directamente) ───────────────────────────
  {
    id: 'p-4',
    nombre: 'Gaseosa',
    tipo: TipoProducto.Simple,
    precioVenta: 3000,
    precioCompra: 1500,
    activo: true,
    itemInventarioId: 'inv-d',
  },
  {
    id: 'p-5',
    nombre: 'Agua',
    tipo: TipoProducto.Simple,
    precioVenta: 2000,
    precioCompra: 800,
    activo: true,
    itemInventarioId: 'inv-e',
  },
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
      {
        id: 'i-1',
        productoId: 'p-1',
        productoNombre: 'Cubanito Clásico',
        cantidad: 1,
        precioUnitario: 12000,
        subtotal: 12000,
      },
      {
        id: 'i-2',
        productoId: 'p-4',
        productoNombre: 'Gaseosa',
        cantidad: 1,
        precioUnitario: 3000,
        subtotal: 3000,
      },
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
    clienteDomicilio: { nombre: 'Juan García', telefono: '3001234567', direccion: 'Cra 45 #23-10' },
    items: [
      {
        id: 'i-3',
        productoId: 'p-2',
        productoNombre: 'Cubanito Especial',
        cantidad: 2,
        precioUnitario: 15000,
        subtotal: 30000,
      },
      {
        id: 'i-4',
        productoId: 'p-5',
        productoNombre: 'Agua',
        cantidad: 1,
        precioUnitario: 2000,
        subtotal: 2000,
      },
      {
        id: 'i-5',
        productoId: 'p-4',
        productoNombre: 'Gaseosa',
        cantidad: 1,
        precioUnitario: 3000,
        subtotal: 3000,
      },
    ],
  },
  {
    id: 'ped-3',
    tipo: TipoPedido.Local,
    estado: EstadoPedido.Finalizado,
    meseroId: 'u-3',
    meseroNombre: 'Pedro Mesero',
    total: 20000,
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    items: [
      {
        id: 'i-6',
        productoId: 'p-3',
        productoNombre: 'Cubanito BBQ',
        cantidad: 1,
        precioUnitario: 14000,
        subtotal: 14000,
      },
      {
        id: 'i-7',
        productoId: 'p-6',
        productoNombre: 'Papa Francesa',
        cantidad: 1,
        precioUnitario: 6000,
        subtotal: 6000,
      },
    ],
  },
];

// ─── Caja ─────────────────────────────────────────────────────────────────────
export const MOCK_CAJA: Caja = {
  id: 'caja-1',
  fecha: new Date().toISOString().split('T')[0],
  montoInicial: 50000,
  abierta: true,
  abiertaPor: 'u-2',
};

// ─── Movimientos ──────────────────────────────────────────────────────────────
export const MOCK_MOVIMIENTOS: Movimiento[] = [
  {
    id: 'mov-1',
    cajaId: 'caja-1',
    tipo: TipoMovimiento.Ingreso,
    monto: 20000,
    descripcion: 'Pago pedido #ped-3',
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: 'mov-2',
    cajaId: 'caja-1',
    tipo: TipoMovimiento.Gasto,
    monto: 8000,
    descripcion: 'Compra insumos — pan',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
];

// ─── Datos de reportes (sin cambios) ─────────────────────────────────────────

function diasAtras(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export const MOCK_VENTAS_DIARIAS = [
  { fecha: diasAtras(6), ventas: 187000, pedidos: 14, domicilios: 4 },
  { fecha: diasAtras(5), ventas: 234000, pedidos: 18, domicilios: 6 },
  { fecha: diasAtras(4), ventas: 156000, pedidos: 12, domicilios: 3 },
  { fecha: diasAtras(3), ventas: 298000, pedidos: 23, domicilios: 8 },
  { fecha: diasAtras(2), ventas: 312000, pedidos: 25, domicilios: 9 },
  { fecha: diasAtras(1), ventas: 267000, pedidos: 20, domicilios: 7 },
  { fecha: diasAtras(0), ventas: 95000, pedidos: 8, domicilios: 3 },
];

export const MOCK_PRODUCTOS_VENDIDOS = [
  { nombre: 'Cubanito Clásico', cantidad: 87, ingresos: 1044000 },
  { nombre: 'Cubanito Especial', cantidad: 64, ingresos: 960000 },
  { nombre: 'Cubanito BBQ', cantidad: 51, ingresos: 714000 },
  { nombre: 'Gaseosa', cantidad: 98, ingresos: 294000 },
  { nombre: 'Papa Francesa', cantidad: 43, ingresos: 258000 },
  { nombre: 'Agua', cantidad: 72, ingresos: 144000 },
];

export const MOCK_CAJA_HISTORIAL = [
  {
    id: 'caja-7',
    fecha: diasAtras(6),
    montoInicial: 50000,
    montoFinal: 225000,
    ingresos: 187000,
    egresos: 12000,
    abierta: false,
    abiertaPor: 'Ana Admin',
  },
  {
    id: 'caja-6',
    fecha: diasAtras(5),
    montoInicial: 60000,
    montoFinal: 278000,
    ingresos: 234000,
    egresos: 16000,
    abierta: false,
    abiertaPor: 'Ana Admin',
  },
  {
    id: 'caja-5',
    fecha: diasAtras(4),
    montoInicial: 50000,
    montoFinal: 193000,
    ingresos: 156000,
    egresos: 13000,
    abierta: false,
    abiertaPor: 'Ana Admin',
  },
  {
    id: 'caja-4',
    fecha: diasAtras(3),
    montoInicial: 70000,
    montoFinal: 347000,
    ingresos: 298000,
    egresos: 21000,
    abierta: false,
    abiertaPor: 'Ana Admin',
  },
  {
    id: 'caja-3',
    fecha: diasAtras(2),
    montoInicial: 60000,
    montoFinal: 358000,
    ingresos: 312000,
    egresos: 14000,
    abierta: false,
    abiertaPor: 'Ana Admin',
  },
  {
    id: 'caja-2',
    fecha: diasAtras(1),
    montoInicial: 50000,
    montoFinal: 304000,
    ingresos: 267000,
    egresos: 13000,
    abierta: false,
    abiertaPor: 'Ana Admin',
  },
  {
    id: 'caja-1',
    fecha: diasAtras(0),
    montoInicial: 50000,
    montoFinal: null,
    ingresos: 20000,
    egresos: 8000,
    abierta: true,
    abiertaPor: 'Ana Admin',
  },
];
