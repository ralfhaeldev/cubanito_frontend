import { Routes } from '@angular/router';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/reportes/reportes').then((m) => m.Reportes),
  },
];
