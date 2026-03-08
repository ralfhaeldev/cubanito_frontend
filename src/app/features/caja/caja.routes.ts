import { Routes } from '@angular/router';

export const CAJA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/caja/caja').then((m) => m.Caja),
  },
];
