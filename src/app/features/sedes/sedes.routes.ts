import { Routes } from '@angular/router';

export const SEDES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/lista-sedes/lista-sedes').then((m) => m.ListaSedes),
  },
];
