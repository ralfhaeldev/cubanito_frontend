import { Routes } from '@angular/router';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/lista-inventario/lista-inventario').then((m) => m.ListaInventario),
  },
];
