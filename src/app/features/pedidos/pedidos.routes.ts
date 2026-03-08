import { Routes } from '@angular/router';

export const PEDIDOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/lista-pedidos/lista-pedidos').then((m) => m.ListaPedidos),
  },
];
