import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guard';
import { Rol } from './shared/models';

export const routes: Routes = [
  // ─── Auth (público) ──────────────────────────────────────────────────────
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ─── Admin / Mesero layout ───────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard([Rol.SuperAdmin, Rol.AdminSede])],
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'pedidos',
        canActivate: [roleGuard([Rol.AdminSede, Rol.Mesero])],
        loadChildren: () =>
          import('./features/pedidos/pedidos.routes').then((m) => m.PEDIDOS_ROUTES),
      },
      {
        path: 'productos',
        canActivate: [roleGuard([Rol.AdminSede])],
        loadChildren: () =>
          import('./features/productos/productos.routes').then((m) => m.PRODUCTOS_ROUTES),
      },
      {
        path: 'inventario',
        canActivate: [roleGuard([Rol.AdminSede])],
        loadChildren: () =>
          import('./features/inventario/inventario.routes').then((m) => m.INVENTARIO_ROUTES),
      },
      {
        path: 'caja',
        canActivate: [roleGuard([Rol.AdminSede])],
        loadChildren: () =>
          import('./features/caja/caja.routes').then((m) => m.CAJA_ROUTES),
      },
      {
        path: 'reportes',
        canActivate: [roleGuard([Rol.AdminSede, Rol.SuperAdmin])],
        loadChildren: () =>
          import('./features/reportes/reportes.routes').then((m) => m.REPORTES_ROUTES),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard([Rol.AdminSede])],
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
      },
      {
        path: 'sedes',
        canActivate: [roleGuard([Rol.SuperAdmin])],
        loadChildren: () =>
          import('./features/sedes/sedes.routes').then((m) => m.SEDES_ROUTES),
      },
    ],
  },

  // ─── Cocina ──────────────────────────────────────────────────────────────
  {
    path: 'cocina',
    canActivate: [authGuard, roleGuard([Rol.Cocina])],
    loadComponent: () =>
      import('./layouts/cocina-layout/cocina-layout.component').then(
        (m) => m.CocinaLayoutComponent,
      ),
  },

  // ─── Fallbacks ───────────────────────────────────────────────────────────
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
