import { Routes } from '@angular/router';

export const COCINA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/vista-cocina/vista-cocina').then((m) => m.VistaCocina),
  },
];
