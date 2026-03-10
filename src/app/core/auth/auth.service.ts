import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JwtPayload, LoginResponse, Rol } from '../../shared/models';

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'rm_token';

  // ─── Signals ─────────────────────────────────────────────────────────────
  private readonly _currentUser = signal<JwtPayload | null>(this.loadFromStorage());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => !!this._currentUser());
  readonly rol = computed(() => this._currentUser()?.rol ?? null);
  readonly sedeId = computed(() => this._currentUser()?.sedeId ?? null);
  readonly isSuperAdmin = computed(() => this._currentUser()?.rol === Rol.SuperAdmin);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // ─── Login / Logout ───────────────────────────────────────────────────────

  login(email: string, password: string, sedeId?: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password, sedeId })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.accessToken);
          this._currentUser.set({
            sub: res.user.id,
            nombre: res.user.nombre,
            email: res.user.email,
            rol: res.user.rol,
            sedeId: res.user.sedeId,
          });

          this.router.navigate([this.getRutaInicial(res.user.rol)]);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !isTokenExpired(token);
  }

  hasRole(...roles: Rol[]): boolean {
    const r = this.rol();
    return !!r && roles.includes(r);
  }

  getHomeRoute(): string {
    switch (this.rol()) {
      case Rol.SuperAdmin:
        return '/dashboard';
      case Rol.AdminSede:
        return '/dashboard';
      case Rol.Mesero:
        return '/pedidos';
      case Rol.Cocina:
        return '/cocina';
      case Rol.Domiciliario:
        return '/domicilios';
      default:
        return '/auth/login';
    }
  }

  private loadFromStorage(): JwtPayload | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token || isTokenExpired(token)) return null;
    return decodeJwt(token);
  }

  private getRutaInicial(rol: Rol): string {
    switch (rol) {
      case Rol.Cocina:
        return '/cocina';
      case Rol.Domiciliario:
        return '/domiciliario';
      default:
        return '/dashboard';
    }
  }
}
