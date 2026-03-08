import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TenantService } from '../../core/tenant/tenant.service';
import { SocketService } from '../../core/websocket/socket.service';
import { Rol, Sede } from '../../shared/models';

interface NavItem {
  label: string;
  route: string;
  icon:  string;
  roles: Rol[];
}

const NAV: NavItem[] = [
  { label: 'Dashboard',   route: '/dashboard',   icon: '◼',  roles: [Rol.SuperAdmin, Rol.AdminSede] },
  { label: 'Pedidos',     route: '/pedidos',      icon: '🧾', roles: [Rol.AdminSede, Rol.Mesero] },
  { label: 'Productos',   route: '/productos',    icon: '🍔', roles: [Rol.AdminSede] },
  { label: 'Inventario',  route: '/inventario',   icon: '📦', roles: [Rol.AdminSede] },
  { label: 'Caja',        route: '/caja',         icon: '💰', roles: [Rol.AdminSede] },
  { label: 'Movimientos', route: '/movimientos',  icon: '↕',  roles: [Rol.AdminSede] },
  { label: 'Reportes',    route: '/reportes',     icon: '📊', roles: [Rol.AdminSede, Rol.SuperAdmin] },
  { label: 'Usuarios',    route: '/usuarios',     icon: '👥', roles: [Rol.AdminSede] },
  { label: 'Sedes',       route: '/sedes',        icon: '🏢', roles: [Rol.SuperAdmin] },
];

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen overflow-hidden bg-surface-muted">

      <!-- Sidebar -->
      <aside class="w-60 shrink-0 flex flex-col bg-white border-r border-gray-100 overflow-y-auto">

        <!-- Logo -->
        <div class="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <span class="text-2xl">🍔</span>
          <span class="font-display font-bold text-gray-900 text-lg leading-tight">
            Restaurant<br><span class="text-brand text-sm font-semibold">Manager</span>
          </span>
        </div>

        <!-- Selector de sede (Super Admin) -->
        @if (auth.isSuperAdmin()) {
          <div class="px-3 py-3 border-b border-gray-100">
            <label class="label text-xs">Sede activa</label>
            <select class="select text-xs" (change)="onSedeChange($event)">
              <option value="">— Seleccionar sede —</option>
              @for (s of sedes(); track s.id) {
                <option [value]="s.id">{{ s.nombre }}</option>
              }
            </select>
          </div>
        } @else {
          <div class="px-4 py-3 border-b border-gray-100">
            <p class="text-xs text-gray-500 mb-0.5">Sede</p>
            <p class="text-sm font-semibold text-gray-800">{{ tenant.activeName() }}</p>
          </div>
        }

        <!-- Nav -->
        <nav class="flex-1 px-3 py-4 space-y-0.5">
          @for (item of visibleNav; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-item"
            >
              <span class="text-base">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }
        </nav>

        <!-- User -->
        <div class="px-4 py-4 border-t border-gray-100">
          <p class="text-sm font-medium text-gray-800 truncate">{{ auth.currentUser()?.email }}</p>
          <p class="text-xs text-gray-400 capitalize mb-3">{{ auth.rol()?.replace('_', ' ') }}</p>
          <button class="btn-ghost btn-sm w-full justify-start" (click)="logout()">
            <span>→</span> Cerrar sesión
          </button>
        </div>

      </aside>

      <!-- Main -->
      <main class="flex-1 overflow-y-auto">
        <router-outlet />
      </main>

    </div>
  `,
})
export class AdminLayoutComponent implements OnInit {
  readonly auth   = inject(AuthService);
  readonly tenant = inject(TenantService);
  private  socket = inject(SocketService);

  sedes      = signal<Sede[]>([]);
  visibleNav = NAV.filter((item) => {
    const rol = this.auth.rol();
    return rol ? item.roles.includes(rol) : false;
  });

  ngOnInit(): void {
    if (this.auth.isSuperAdmin()) {
      this.tenant.getSedes().subscribe((s) => this.sedes.set(s));
    }
    this.socket.connect();
  }

  onSedeChange(event: Event): void {
    const id   = (event.target as HTMLSelectElement).value;
    const sede = this.sedes().find((s) => s.id === id);
    if (sede) this.tenant.setActiveSede(sede);
  }

  logout(): void {
    this.socket.disconnect();
    this.auth.logout();
  }
}
