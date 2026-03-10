// ─── Enums ────────────────────────────────────────────────────────────────────

export enum Rol {
  SuperAdmin = 'super_admin',
  AdminSede = 'admin_sede',
  Mesero = 'mesero',
  Cocina = 'cocina',
  Domiciliario = 'domiciliario',
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub:     string;   // userId
  nombre:  string;
  email:   string;
  rol:     Rol;
  sedeId:  string | null;  // null para Super Admin
  iat?:    number;
  exp?:    number;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id:     string;
    nombre: string;
    email:  string;
    rol:    Rol;
    sedeId: string | null;
  };
}

// ─── Estados de pedido ──────────────────────────────────────────────────────

export enum EstadoPedido {
  Pendiente = 'pendiente',
  EnProceso = 'en_proceso',
  Enviado = 'enviado',
  Entregado = 'entregado',
  Finalizado = 'finalizado',
  Rechazado = 'rechazado',
}

export enum TipoPedido {
  Local = 'local',
  Domicilio = 'domicilio',
}

export enum MetodoPago {
  Efectivo = 'efectivo',
  Transferencia = 'transferencia',
}

export enum TipoMovimiento {
  Ingreso = 'ingreso',
  Egreso = 'egreso',
  Gasto = 'gasto',
}

/**
 * simple    → producto directo (ej: gaseosa). Tiene stock propio vinculado a un ítem de inventario.
 * preparado → producto elaborado (ej: cubanito). Descuenta ingredientes del inventario al venderse.
 */
export enum TipoProducto {
  Simple = 'simple',
  Preparado = 'preparado',
}

// ─── Inventario ───────────────────────────────────────────────────────────────

export interface ItemInventario {
  id: string;
  nombre: string;
  unidad: string; // 'kg' | 'g' | 'und' | 'lt' | 'ml'
  stockActual: number;
  stockMinimo: number;
  stockIdeal: number;
  categoria: string;
  activo: boolean;
  ultimoAjuste: string | null; // ISO date
}

export interface AjusteInventario {
  id: string;
  itemId: string;
  itemNombre: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string;
  creadoPor: string;
  createdAt: string;
}

// ─── Ingrediente (para productos preparados) ──────────────────────────────────

export interface Ingrediente {
  itemInventarioId: string;
  itemNombre: string;
  cantidad: number; // cantidad por unidad del producto
  unidad: string;
}

// ─── Producto ─────────────────────────────────────────────────────────────────

export interface Producto {
  id: string;
  nombre: string;
  precioVenta: number;
  precioCompra: number; // para 'simple' es el precio de compra directo;
  // para 'preparado' se calcula a partir de los ingredientes
  activo: boolean;

  // ── Nuevos campos ──────────────────────────────────────────────────
  tipo: TipoProducto;
  itemInventarioId?: string; // solo si tipo === 'simple'
  ingredientes?: Ingrediente[]; // solo si tipo === 'preparado'
}

// ─── Pedido ───────────────────────────────────────────────────────────────────

export interface PedidoItem {
  id: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ClienteDomicilio {
  nombre: string;
  telefono: string;
  direccion: string;
}

export interface Pedido {
  id: string;
  tipo: TipoPedido;
  estado: EstadoPedido;
  items: PedidoItem[];
  total: number;
  meseroId: string;
  meseroNombre: string;
  clienteDomicilio?: ClienteDomicilio;
  createdAt: string;
  updatedAt: string;
}

// ─── Caja & Movimientos ───────────────────────────────────────────────────────

export interface Caja {
  id: string;
  fecha: string;
  montoInicial: number;
  montoFinal?: number;
  abierta: boolean;
  abiertaPor: string;
  cerradaPor?: string;
}

export interface Movimiento {
  id: string;
  cajaId: string;
  tipo: TipoMovimiento;
  monto: number;
  descripcion: string;
  createdAt: string;
}

// ─── Usuarios & Sedes ─────────────────────────────────────────────────────────

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface Sede {
  id: string;
  nombre: string;
  activa: boolean;
}

// ─── Reportes ────────────────────────────────────────────────────────────────

export interface VentaDiaria {
  fecha: string;
  ventas: number;
  pedidos: number;
  domicilios: number;
}

export interface ProductoVendido {
  nombre: string;
  cantidad: number;
  ingresos: number;
}

export interface CajaHistorial {
  id: string;
  fecha: string;
  montoInicial: number;
  montoFinal: number | null;
  ingresos: number;
  egresos: number;
  abierta: boolean;
  abiertaPor: string;
}
