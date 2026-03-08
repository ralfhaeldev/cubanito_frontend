import { Routes } from '@angular/router';

export const MOVIMIENTOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/lista-movimientos/lista-movimientos').then((m) => m.ListaMovimientos),
  },
];
