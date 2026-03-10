import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';
import { Rol } from './shared/models';

export const routes: Routes = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ── Layout Admin (sidebar) ────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        canActivate: [() => roleGuard([Rol.Owner, Rol.SuperAdmin, Rol.AdminSede])],
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'pedidos',
        canActivate: [() => roleGuard([Rol.SuperAdmin, Rol.AdminSede, Rol.Mesero])],
        loadChildren: () => import('./features/pedidos/pedidos.routes').then((m) => m.PEDIDOS_ROUTES),
      },
      {
        path: 'productos',
        canActivate: [() => roleGuard([Rol.AdminSede])],
        loadChildren: () => import('./features/productos/productos.routes').then((m) => m.PRODUCTOS_ROUTES),
      },
      {
        path: 'inventario',
        canActivate: [() => roleGuard([Rol.AdminSede])],
        loadChildren: () => import('./features/inventario/inventario.routes').then((m) => m.INVENTARIO_ROUTES),
      },
      {
        path: 'caja',
        canActivate: [() => roleGuard([Rol.AdminSede])],
        loadChildren: () => import('./features/caja/caja.routes').then((m) => m.CAJA_ROUTES),
      },
      {
        path: 'reportes',
        canActivate: [() => roleGuard([Rol.Owner, Rol.SuperAdmin, Rol.AdminSede])],
        loadChildren: () => import('./features/reportes/reportes.routes').then((m) => m.REPORTES_ROUTES),
      },
      {
        path: 'usuarios',
        canActivate: [() => roleGuard([Rol.AdminSede])],
        loadChildren: () => import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
      },
      {
        path: 'sedes',
        canActivate: [() => roleGuard([Rol.Owner])],
        loadChildren: () => import('./features/sedes/sedes.routes').then((m) => m.SEDES_ROUTES),
      },
    ],
  },

  // ── Vista Cocina (pantalla completa oscura, sin sidebar) ──────────────────
  {
    path: 'cocina',
    canActivate: [authGuard, () => roleGuard([Rol.Cocina, Rol.AdminSede])],
    loadComponent: () =>
      import('./layouts/cocina-layout/cocina-layout.component').then((m) => m.CocinaLayoutComponent),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/cocina/cocina.routes').then((m) => m.COCINA_ROUTES),
      },
    ],
  },

  // ── Vista Domiciliario (pantalla completa oscura, sin sidebar) ────────────
  {
    path: 'domiciliario',
    canActivate: [authGuard, () => roleGuard([Rol.Domiciliario, Rol.AdminSede])],
    loadComponent: () =>
      import('./layouts/domiciliario-layout/domiciliario-layout').then((m) => m.DomiciliarioLayout),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/domiciliario/domiciliario.routes').then((m) => m.DOMICILIARIO_ROUTES),
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
