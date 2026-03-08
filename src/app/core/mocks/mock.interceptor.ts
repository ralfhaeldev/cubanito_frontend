import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, delay } from 'rxjs';
import {
  MOCK_USUARIOS, MOCK_SEDES, MOCK_PRODUCTOS,
  MOCK_PEDIDOS, MOCK_CAJA, MOCK_MOVIMIENTOS,
} from './mock.data';
import { EstadoPedido, Pedido } from '../../shared/models';
 

// ─── Activar/desactivar mocks ─────────────────────────────────────────────────
export const MOCKS_ENABLED = true;   // ← cambiar a false cuando el backend esté listo

// Estado en memoria (simula la BD)
let productos  = [...MOCK_PRODUCTOS];
let pedidos    = [...MOCK_PEDIDOS];
let movimientos = [...MOCK_MOVIMIENTOS];
let caja       = { ...MOCK_CAJA };
let usuarios   = MOCK_USUARIOS.map(({ password: _, ...u }) => u);

function ok(body: unknown, ms = 250) {
  return of(new HttpResponse({ status: 200, body })).pipe(delay(ms));
}

function created(body: unknown) {
  return of(new HttpResponse({ status: 201, body })).pipe(delay(300));
}

function noContent() {
  return of(new HttpResponse({ status: 204 })).pipe(delay(200));
}

function makeJwt(payload: Record<string, unknown>): string {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = btoa(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() / 1000 + 28800 }));
  return `${header}.${body}.mock_signature`;
}

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!MOCKS_ENABLED) return next(req);

  const { method, url } = req;

  // Extraer path relativo: /auth/login → auth/login
  const path = url.replace(/^https?:\/\/[^/]+\//, '');

  // ── POST /auth/login ────────────────────────────────────────────────────────
  if (method === 'POST' && path === 'auth/login') {
    const { email, password } = req.body as { email: string; password: string };
    const user = MOCK_USUARIOS.find((u) => u.email === email && u.password === password);

    if (!user) {
      return of(new HttpResponse({
        status: 401,
        body: { message: 'Credenciales inválidas' },
      })).pipe(delay(300));
    }

    const token = makeJwt({ sub: user.id, email: user.email, rol: user.rol, sedeId: user.sedeId });
    return ok({ accessToken: token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, sedeId: user.sedeId } });
  }

  // ── GET /sedes ──────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'sedes') {
    return ok(MOCK_SEDES);
  }

  // ── GET /productos ──────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'productos') {
    return ok(productos);
  }

  // ── POST /productos ─────────────────────────────────────────────────────────
  if (method === 'POST' && path === 'productos') {
    const body = req.body as { nombre: string; precioVenta: number; precioCompra: number };
    const nuevo = { id: `p-${Date.now()}`, ...body, activo: true };
    productos = [nuevo, ...productos];
    return created(nuevo);
  }

  // ── PATCH /productos/:id ────────────────────────────────────────────────────
  if (method === 'PATCH' && path.startsWith('productos/')) {
    const id  = path.split('/')[1];
    const body = req.body as Partial<typeof productos[0]>;
    productos = productos.map((p) => p.id === id ? { ...p, ...body } : p);
    return ok(productos.find((p) => p.id === id));
  }

  // ── DELETE /productos/:id ───────────────────────────────────────────────────
  if (method === 'DELETE' && path.startsWith('productos/')) {
    const id = path.split('/')[1];
    productos = productos.map((p) => p.id === id ? { ...p, activo: false } : p);
    return noContent();
  }

  // ── GET /pedidos ────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'pedidos') {
    return ok(pedidos);
  }

  // ── GET /pedidos/activos ────────────────────────────────────────────────────
  if (method === 'GET' && path === 'pedidos/activos') {
    const activos = pedidos.filter((p) =>
      ![EstadoPedido.Finalizado, EstadoPedido.Rechazado].includes(p.estado),
    );
    return ok(activos);
  }

  // ── GET /pedidos/:id ────────────────────────────────────────────────────────
  if (method === 'GET' && path.startsWith('pedidos/') && path.split('/').length === 2) {
    const id = path.split('/')[1];
    return ok(pedidos.find((p) => p.id === id) ?? null);
  }

  // ── POST /pedidos ───────────────────────────────────────────────────────────
  if (method === 'POST' && path === 'pedidos') {
    const body = req.body as Partial<Pedido>;
    const nuevo: Pedido = {
      id: `ped-${Date.now()}`,
      tipo: body.tipo!,
      estado: EstadoPedido.Pendiente,
      items: body.items ?? [],
      clienteDomicilio: body.clienteDomicilio,
      total: body.items?.reduce((s, i) => s + i.subtotal, 0) ?? 0,
      meseroId: 'u-3',
      meseroNombre: 'Pedro Mesero',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    pedidos = [nuevo, ...pedidos];
    return created(nuevo);
  }

  // ── PATCH /pedidos/:id/estado ───────────────────────────────────────────────
  if (method === 'PATCH' && path.match(/^pedidos\/[^/]+\/estado$/)) {
    const id     = path.split('/')[1];
    const estado = (req.body as { estado: EstadoPedido }).estado;
    pedidos = pedidos.map((p) => p.id === id ? { ...p, estado, updatedAt: new Date().toISOString() } : p);
    return ok(pedidos.find((p) => p.id === id));
  }

  // ── POST /pedidos/:id/finalizar ─────────────────────────────────────────────
  if (method === 'POST' && path.match(/^pedidos\/[^/]+\/finalizar$/)) {
    const id = path.split('/')[1];
    pedidos = pedidos.map((p) =>
      p.id === id ? { ...p, estado: EstadoPedido.Finalizado, updatedAt: new Date().toISOString() } : p,
    );
    return ok({ success: true });
  }

  // ── GET /caja ───────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'caja') {
    return ok(caja);
  }

  // ── POST /caja/abrir ────────────────────────────────────────────────────────
  if (method === 'POST' && path === 'caja/abrir') {
    const { montoInicial } = req.body as { montoInicial: number };
    caja = { id: `caja-${Date.now()}`, fecha: new Date().toISOString().split('T')[0], montoInicial, abierta: true, abiertaPor: 'u-2' };
    return created(caja);
  }

  // ── POST /caja/cerrar ───────────────────────────────────────────────────────
  if (method === 'POST' && path === 'caja/cerrar') {
    const { montoFinal } = req.body as { montoFinal: number };
    caja = { ...caja, montoFinal, abierta: false, cerradaPor: 'u-2' };
    return ok(caja);
  }

  // ── GET /movimientos ────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'movimientos') {
    return ok(movimientos);
  }

  // ── POST /movimientos ───────────────────────────────────────────────────────
  if (method === 'POST' && path === 'movimientos') {
    const body = req.body as { tipo: string; monto: number; descripcion: string };
    const nuevo = { id: `mov-${Date.now()}`, cajaId: caja.id, tipo: body.tipo as any, monto: body.monto, descripcion: body.descripcion, createdAt: new Date().toISOString() };
    movimientos = [nuevo, ...movimientos];
    return created(nuevo);
  }

  // ── GET /usuarios ───────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'usuarios') {
    return ok(usuarios);
  }

  // ── Cualquier otra request — pasar al backend real ──────────────────────────
  return next(req);
};