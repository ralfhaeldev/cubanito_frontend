import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from '../../shared/models';

// ─── authGuard — verifica sesión activa ──────────────────────────────────────

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() || router.parseUrl('/auth/login');
};

// ─── guestGuard — redirige al home si ya está autenticado ────────────────────

export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return !auth.isAuthenticated() || router.parseUrl(auth.getHomeRoute());
};

// ─── roleGuard — factory que recibe los roles permitidos ─────────────────────

export const roleGuard = (allowedRoles: Rol[]): CanActivateFn =>
  () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated())          return router.parseUrl('/auth/login');
    if (auth.hasRole(...allowedRoles))    return true;
    return router.parseUrl(auth.getHomeRoute());
  };
