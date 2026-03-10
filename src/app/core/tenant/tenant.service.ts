import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';
import { Sede } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly _activeSede = signal<Sede | null>(null);

  readonly activeSede  = this._activeSede.asReadonly();
  readonly activeName  = computed(() => this._activeSede()?.nombre ?? '—');

  constructor(private http: HttpClient, private auth: AuthService) {}

  getSedes(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${environment.apiUrl}/sedes`);
  }

  setActiveSede(sede: Sede): void {
    this._activeSede.set(sede);
  }

  /**
   * sedeId efectivo:
   * - Super Admin → sede seleccionada en el dashboard
   * - Otros roles → viene del JWT
   */
  getEffectiveSedeId(): string | null {
    return this.auth.isGlobalRole()
      ? this._activeSede()?.id ?? null
      : this.auth.sedeId();
  }
}
