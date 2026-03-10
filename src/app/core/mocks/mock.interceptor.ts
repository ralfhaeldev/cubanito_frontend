import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, delay } from 'rxjs';
import {
  MOCK_USUARIOS,
  MOCK_SEDES,
  MOCK_PRODUCTOS,
  MOCK_PEDIDOS,
  MOCK_CAJA,
  MOCK_MOVIMIENTOS,
  MOCK_INVENTARIO,
  MOCK_AJUSTES,
  MOCK_VENTAS_DIARIAS,
  MOCK_PRODUCTOS_VENDIDOS,
  MOCK_CAJA_HISTORIAL,
} from './mock.data';
import { EstadoPedido, Pedido, TipoProducto } from '../../shared/models';

export const MOCKS_ENABLED = true;

// ─── Estado mutable en memoria ────────────────────────────────────────────────
let productos = [...MOCK_PRODUCTOS];
let pedidos = [...MOCK_PEDIDOS];
let movimientos = [...MOCK_MOVIMIENTOS];
let caja = { ...MOCK_CAJA };
let usuarios = MOCK_USUARIOS.map(({ password: _p, ...u }) => u);
let sedes = [...MOCK_SEDES];
let inventario = [...MOCK_INVENTARIO];
let ajustes = [...MOCK_AJUSTES];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ok = (body: unknown, ms = 250) => of(new HttpResponse({ status: 200, body })).pipe(delay(ms));
const created = (body: unknown) => of(new HttpResponse({ status: 201, body })).pipe(delay(300));
const noContent = () => of(new HttpResponse({ status: 204 })).pipe(delay(200));

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(
    JSON.stringify({ ...payload, iat: Date.now(), exp: Math.floor(Date.now() / 1000) + 28800 }),
  );
  return `${header}.${body}.mock_signature`;
}

function descontarInventario(pedido: Pedido): void {
  const now = new Date().toISOString();

  for (const item of pedido.items) {
    const producto = productos.find((p) => p.id === item.productoId);
    if (!producto) continue;

    if (producto.tipo === TipoProducto.Simple && producto.itemInventarioId) {
      const descuento = item.cantidad;
      inventario = inventario.map((inv) =>
        inv.id === producto.itemInventarioId
          ? { ...inv, stockActual: Math.max(0, inv.stockActual - descuento), ultimoAjuste: now }
          : inv,
      );
      ajustes = [
        {
          id: `aj-${Date.now()}-${item.productoId}`,
          itemId: producto.itemInventarioId,
          itemNombre:
            inventario.find((i) => i.id === producto.itemInventarioId)?.nombre ?? producto.nombre,
          tipo: 'salida' as const,
          cantidad: descuento,
          motivo: `Venta — pedido #${pedido.id.slice(-6).toUpperCase()}`,
          creadoPor: 'Sistema',
          createdAt: now,
        },
        ...ajustes,
      ];
    }

    if (producto.tipo === TipoProducto.Preparado && producto.ingredientes?.length) {
      for (const ing of producto.ingredientes) {
        const descuento = ing.cantidad * item.cantidad;
        inventario = inventario.map((inv) =>
          inv.id === ing.itemInventarioId
            ? { ...inv, stockActual: Math.max(0, inv.stockActual - descuento), ultimoAjuste: now }
            : inv,
        );
        ajustes = [
          {
            id: `aj-${Date.now()}-${ing.itemInventarioId}`,
            itemId: ing.itemInventarioId,
            itemNombre: ing.itemNombre,
            tipo: 'salida' as const,
            cantidad: descuento,
            motivo: `Venta — pedido #${pedido.id.slice(-6).toUpperCase()} (${producto.nombre})`,
            creadoPor: 'Sistema',
            createdAt: now,
          },
          ...ajustes,
        ];
      }
    }
  }
}

// ─── Interceptor ──────────────────────────────────────────────────────────────
export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!MOCKS_ENABLED) return next(req);

  const { method } = req;
  const path = req.url.replace(/^https?:\/\/[^/]+\//, '').split('?')[0];
  const params = new URL(req.url, 'http://localhost').searchParams;

  // ── Auth ───────────────────────────────────────────────────────────────────
  if (method === 'POST' && path === 'auth/login') {
    const { email, password } = req.body as { email: string; password: string };
    const user = MOCK_USUARIOS.find((u) => u.email === email && u.password === password);
    if (!user)
      return of(
        new HttpResponse({ status: 401, body: { message: 'Credenciales inválidas' } }),
      ).pipe(delay(300));
    const token = makeJwt({ sub: user.id, nombre: user.nombre, email: user.email, rol: user.rol, sedeId: user.sedeId });
    return ok({
      accessToken: token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        sedeId: user.sedeId,
      },
    });
  }

  // ── Sedes ──────────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'sedes') return ok(sedes);
  if (method === 'POST' && path === 'sedes') {
    const body = req.body as { nombre: string };
    const nueva = { id: `sede-${Date.now()}`, nombre: body.nombre, activa: true };
    sedes = [...sedes, nueva];
    return created(nueva);
  }
  if (method === 'PATCH' && path.startsWith('sedes/')) {
    const id = path.split('/')[1];
    sedes = sedes.map((s) => (s.id === id ? { ...s, ...(req.body as object) } : s));
    return ok(sedes.find((s) => s.id === id));
  }
  if (method === 'DELETE' && path.startsWith('sedes/')) {
    const id = path.split('/')[1];
    sedes = sedes.filter((s) => s.id !== id);
    return noContent();
  }

  // ── Productos ──────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'productos') return ok(productos);
  if (method === 'POST' && path === 'productos') {
    const body = req.body as (typeof productos)[0];
    const nuevo = { ...body, id: `p-${Date.now()}`, activo: true };
    productos = [nuevo, ...productos];
    return created(nuevo);
  }
  if (method === 'PATCH' && path.startsWith('productos/')) {
    const id = path.split('/')[1];
    productos = productos.map((p) => (p.id === id ? { ...p, ...(req.body as object) } : p));
    return ok(productos.find((p) => p.id === id));
  }
  if (method === 'DELETE' && path.startsWith('productos/')) {
    const id = path.split('/')[1];
    productos = productos.map((p) => (p.id === id ? { ...p, activo: false } : p));
    return noContent();
  }

  // ── Pedidos ────────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'pedidos') return ok(pedidos);
  if (method === 'GET' && path === 'pedidos/activos')
    return ok(
      pedidos.filter((p) => ![EstadoPedido.Finalizado, EstadoPedido.Rechazado].includes(p.estado)),
    );
  if (method === 'GET' && path.startsWith('pedidos/') && path.split('/').length === 2) {
    return ok(pedidos.find((p) => p.id === path.split('/')[1]) ?? null);
  }
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
  if (method === 'PATCH' && path.match(/^pedidos\/[^/]+\/estado$/)) {
    const id = path.split('/')[1];
    const estado = (req.body as { estado: EstadoPedido }).estado;
    pedidos = pedidos.map((p) =>
      p.id === id ? { ...p, estado, updatedAt: new Date().toISOString() } : p,
    );
    return ok(pedidos.find((p) => p.id === id));
  }
  if (method === 'POST' && path.match(/^pedidos\/[^/]+\/finalizar$/)) {
    const id = path.split('/')[1];
    const pedido = pedidos.find((p) => p.id === id);
    if (pedido) {
      descontarInventario(pedido);
      pedidos = pedidos.map((p) =>
        p.id === id
          ? { ...p, estado: EstadoPedido.Finalizado, updatedAt: new Date().toISOString() }
          : p,
      );
      movimientos = [
        {
          id: `mov-${Date.now()}`,
          cajaId: caja.id,
          tipo: 'ingreso' as any,
          monto: pedido.total,
          descripcion: `Pago pedido #${id.slice(-6).toUpperCase()}`,
          createdAt: new Date().toISOString(),
        },
        ...movimientos,
      ];
    }
    return ok({ success: true });
  }

  // ── Caja ───────────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'caja') return ok(caja);
  if (method === 'POST' && path === 'caja/abrir') {
    const { montoInicial } = req.body as { montoInicial: number };
    caja = {
      id: `caja-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      montoInicial,
      abierta: true,
      abiertaPor: 'u-2',
    };
    movimientos = [];
    return created(caja);
  }
  if (method === 'POST' && path === 'caja/cerrar') {
    const { montoFinal } = req.body as { montoFinal: number };
    caja = { ...caja, montoFinal, abierta: false, cerradaPor: 'u-2' };
    return ok(caja);
  }

  // ── Movimientos ────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'movimientos') return ok(movimientos);
  if (method === 'POST' && path === 'movimientos') {
    const body = req.body as { tipo: string; monto: number; descripcion: string };
    const nuevo = {
      id: `mov-${Date.now()}`,
      cajaId: caja.id,
      ...body,
      tipo: body.tipo as any,
      createdAt: new Date().toISOString(),
    };
    movimientos = [nuevo, ...movimientos];
    return created(nuevo);
  }

  // ── Usuarios ───────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'usuarios') return ok(usuarios);
  if (method === 'POST' && path === 'usuarios') {
    const body = req.body as any;
    const nuevo = { id: `u-${Date.now()}`, ...body, activo: true };
    usuarios = [nuevo, ...usuarios];
    return created(nuevo);
  }
  if (method === 'PATCH' && path.startsWith('usuarios/')) {
    const id = path.split('/')[1];
    usuarios = usuarios.map((u) => (u.id === id ? { ...u, ...(req.body as object) } : u));
    return ok(usuarios.find((u) => u.id === id));
  }

  // ── Inventario ─────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'inventario') return ok(inventario, 300);
  if (method === 'POST' && path === 'inventario') {
    const body = req.body as any;
    const nuevo = { id: `inv-${Date.now()}`, ...body, ultimoAjuste: null };
    inventario = [nuevo, ...inventario];
    return created(nuevo);
  }
  if (method === 'PATCH' && path.startsWith('inventario/') && path.split('/').length === 2) {
    const id = path.split('/')[1];
    inventario = inventario.map((i) => (i.id === id ? { ...i, ...(req.body as object) } : i));
    return ok(inventario.find((i) => i.id === id));
  }
  if (method === 'GET' && path === 'inventario/ajustes') return ok(ajustes, 300);
  if (method === 'POST' && path === 'inventario/ajustes') {
    const body = req.body as {
      itemId: string;
      tipo: 'entrada' | 'salida' | 'ajuste';
      cantidad: number;
      motivo: string;
    };
    const item = inventario.find((i) => i.id === body.itemId);
    if (!item) return of(new HttpResponse({ status: 404 }));
    const now = new Date().toISOString();
    let nuevoStock = item.stockActual;
    if (body.tipo === 'entrada') nuevoStock += body.cantidad;
    else if (body.tipo === 'salida') nuevoStock = Math.max(0, nuevoStock - body.cantidad);
    else nuevoStock = body.cantidad;
    inventario = inventario.map((i) =>
      i.id === body.itemId ? { ...i, stockActual: nuevoStock, ultimoAjuste: now } : i,
    );
    const nuevoAjuste = {
      id: `aj-${Date.now()}`,
      ...body,
      itemNombre: item.nombre,
      creadoPor: 'Ana Admin',
      createdAt: now,
    };
    ajustes = [nuevoAjuste, ...ajustes];
    return created(nuevoAjuste);
  }

  // ── Reportes ───────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'reportes/ventas') {
    const periodo = params.get('periodo') ?? '7d';
    let dias = MOCK_VENTAS_DIARIAS;
    if (periodo === 'today') {
      dias = MOCK_VENTAS_DIARIAS.slice(-1);
    } else if (periodo === '30d') {
      const extended = [];
      for (let i = 29; i >= 0; i--) {
        const base = MOCK_VENTAS_DIARIAS[i % 7];
        const d = new Date();
        d.setDate(d.getDate() - i);
        const jitter = 0.75 + Math.random() * 0.5;
        extended.push({
          fecha: d.toISOString().split('T')[0],
          ventas: Math.round(base.ventas * jitter),
          pedidos: Math.round(base.pedidos * jitter),
          domicilios: Math.round(base.domicilios * jitter),
        });
      }
      dias = extended;
    }
    return ok(dias, 400);
  }
  if (method === 'GET' && path === 'reportes/productos-top') {
    const factor = params.get('periodo') === '30d' ? 4.2 : 1;
    return ok(
      MOCK_PRODUCTOS_VENDIDOS.map((p) => ({
        ...p,
        cantidad: Math.round(p.cantidad * factor),
        ingresos: Math.round(p.ingresos * factor),
      })),
      400,
    );
  }
  if (method === 'GET' && path === 'reportes/caja-historial') return ok(MOCK_CAJA_HISTORIAL, 400);
  if (method === 'GET' && path === 'reportes/resumen') {
    const periodo = params.get('periodo') ?? '7d';
    const slice = periodo === 'today' ? MOCK_VENTAS_DIARIAS.slice(-1) : MOCK_VENTAS_DIARIAS;
    const factor = periodo === '30d' ? 4.2 : 1;
    return ok(
      {
        totalVentas: Math.round(slice.reduce((s, v) => s + v.ventas, 0) * factor),
        totalPedidos: Math.round(slice.reduce((s, v) => s + v.pedidos, 0) * factor),
        totalDomicilios: Math.round(slice.reduce((s, v) => s + v.domicilios, 0) * factor),
        ticketPromedio: Math.round(
          (slice.reduce((s, v) => s + v.ventas, 0) /
            Math.max(
              slice.reduce((s, v) => s + v.pedidos, 0),
              1,
            )) *
            factor,
        ),
      },
      400,
    );
  }

  return next(req);
};
