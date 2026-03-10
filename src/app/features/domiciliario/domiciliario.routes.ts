import { Routes } from '@angular/router';

export const DOMICILIARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/vista-domiciliario/vista-domiciliario').then((m) => m.VistaDomiciliario),
  },
];
