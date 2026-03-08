// ─── Roles ──────────────────────────────────────────────────────────────────

export enum Rol {
  SuperAdmin   = 'super_admin',
  AdminSede    = 'admin_sede',
  Mesero       = 'mesero',
  Cocina       = 'cocina',
  Domiciliario = 'domiciliario',
}

// ─── Estados de pedido ──────────────────────────────────────────────────────

export enum EstadoPedido {
  Pendiente  = 'pendiente',
  EnProceso  = 'en_proceso',
  Enviado    = 'enviado',
  Entregado  = 'entregado',
  Finalizado = 'finalizado',
  Rechazado  = 'rechazado',
}

export enum TipoPedido {
  Local      = 'local',
  Domicilio  = 'domicilio',
}

export enum MetodoPago {
  Efectivo      = 'efectivo',
  Transferencia = 'transferencia',
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub:     string;   // userId
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

// ─── Sede ────────────────────────────────────────────────────────────────────

export interface Sede {
  id:     string;
  nombre: string;
  activa: boolean;
}

// ─── Usuario ─────────────────────────────────────────────────────────────────

export interface Usuario {
  id:     string;
  nombre: string;
  email:  string;
  rol:    Rol;
  activo: boolean;
}

// ─── Producto ────────────────────────────────────────────────────────────────

export interface Producto {
  id:            string;
  nombre:        string;
  precioVenta:   number;
  precioCompra:  number;
  activo:        boolean;
}

// ─── Pedido ──────────────────────────────────────────────────────────────────

export interface PedidoItem {
  id:              string;
  productoId:      string;
  productoNombre:  string;
  cantidad:        number;
  precioUnitario:  number;
  subtotal:        number;
}

export interface ClienteDomicilio {
  nombre:    string;
  telefono:  string;
  direccion: string;
}

export interface Pedido {
  id:                string;
  tipo:              TipoPedido;
  estado:            EstadoPedido;
  items:             PedidoItem[];
  clienteDomicilio?: ClienteDomicilio;
  total:             number;
  meseroId:          string;
  meseroNombre:      string;
  createdAt:         string;
  updatedAt:         string;
}

// ─── Pago ────────────────────────────────────────────────────────────────────

export interface Pago {
  id:         string;
  pedidoId:   string;
  metodo:     MetodoPago;
  monto:      number;
  vuelto?:    number;
  createdAt:  string;
}

// ─── Caja ────────────────────────────────────────────────────────────────────

export interface Caja {
  id:           string;
  fecha:        string;
  montoInicial: number;
  montoFinal?:  number;
  abierta:      boolean;
  abiertaPor:   string;
  cerradaPor?:  string;
}

// ─── Movimiento ──────────────────────────────────────────────────────────────

export enum TipoMovimiento {
  Ingreso = 'ingreso',
  Egreso  = 'egreso',
  Gasto   = 'gasto',
}

export interface Movimiento {
  id:          string;
  cajaId:      string;
  tipo:        TipoMovimiento;
  monto:       number;
  descripcion: string;
  createdAt:   string;
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data:    T;
  message: string;
}

export interface PaginatedResponse<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}

// ─── Inventario ──────────────────────────────────────────────────────────────

export interface ItemInventario {
  id:            string;
  nombre:        string;
  unidad:        string;       // 'kg' | 'g' | 'und' | 'lt' | 'ml'
  stockActual:   number;
  stockMinimo:   number;
  stockIdeal:    number;
  categoria:     string;
  activo:        boolean;
  ultimoAjuste:  string | null; // ISO date
}

export interface AjusteInventario {
  id:          string;
  itemId:      string;
  itemNombre:  string;
  tipo:        'entrada' | 'salida' | 'ajuste';
  cantidad:    number;
  motivo:      string;
  creadoPor:   string;
  createdAt:   string;
}