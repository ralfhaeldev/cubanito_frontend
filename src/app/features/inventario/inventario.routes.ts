import { Routes } from '@angular/router';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/inventario/inventario').then((m) => m.Inventario),
  },
];
