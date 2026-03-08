import { Routes } from '@angular/router';

export const PRODUCTOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/lista-productos/lista-productos').then((m) => m.ListaProductos),
  },
];
