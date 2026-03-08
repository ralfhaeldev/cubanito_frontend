import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
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
  { label: 'Dashboard',   route: '/dashboard',   icon: 'dashboard',    roles: [Rol.SuperAdmin, Rol.AdminSede] },
  { label: 'Pedidos',     route: '/pedidos',     icon: 'receipt_long', roles: [Rol.AdminSede, Rol.Mesero] },
  { label: 'Productos',   route: '/productos',   icon: 'lunch_dining', roles: [Rol.AdminSede] },
  { label: 'Inventario',  route: '/inventario',  icon: 'inventory_2',  roles: [Rol.AdminSede] },
  { label: 'Caja',        route: '/caja',        icon: 'point_of_sale',roles: [Rol.AdminSede] },
  { label: 'Reportes',    route: '/reportes',    icon: 'bar_chart',    roles: [Rol.AdminSede, Rol.SuperAdmin] },
  { label: 'Usuarios',    route: '/usuarios',    icon: 'group',        roles: [Rol.AdminSede] },
  { label: 'Sedes',       route: '/sedes',       icon: 'store',        roles: [Rol.SuperAdmin] },
];

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-50">

      <!-- Overlay móvil -->
      @if (sidebarOpen() && isMobile()) {
        <div
          class="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm"
          (click)="closeSidebar()"
        ></div>
      }

      <!-- Sidebar -->
      <aside
        [class]="sidebarClasses()"
        class="fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ease-in-out overflow-hidden"
      >
        <!-- Logo + toggle -->
        <div class="flex items-center justify-between px-4 py-4 border-b border-gray-100 min-h-[64px]">
          @if (sidebarExpanded()) {
            <div class="flex items-center gap-2.5 overflow-hidden">
              <span class="text-xl shrink-0">🍔</span>
              <div class="leading-tight overflow-hidden">
                <p class="font-display font-bold text-gray-900 text-base whitespace-nowrap">Restaurant</p>
                <p class="text-brand text-xs font-semibold whitespace-nowrap">Manager</p>
              </div>
            </div>
          } @else {
            <span class="text-xl mx-auto">🍔</span>
          }

          <button
            class="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-1"
            (click)="toggleSidebar()"
            [class.mx-auto]="!sidebarExpanded()"
          >
            <span class="material-symbols-outlined text-xl leading-none">
              {{ sidebarExpanded() ? 'menu_open' : 'menu' }}
            </span>
          </button>
        </div>

        <!-- Sede selector -->
        @if (sidebarExpanded()) {
          @if (auth.isSuperAdmin()) {
            <div class="px-3 py-3 border-b border-gray-100">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Sede activa</p>
              <select
                class="select text-xs"
                (change)="onSedeChange($event)"
              >
                <option value="">— Seleccionar sede —</option>
                @for (s of sedes(); track s.id) {
                  <option [value]="s.id">{{ s.nombre }}</option>
                }
              </select>
            </div>
          } @else {
            <div class="px-4 py-3 border-b border-gray-100">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Sede</p>
              <p class="text-sm font-semibold text-gray-800 truncate">{{ tenant.activeName() }}</p>
            </div>
          }
        } @else {
          <div class="py-3 border-b border-gray-100 flex justify-center">
            <span class="material-symbols-outlined text-gray-400 text-lg">store</span>
          </div>
        }

        <!-- Nav -->
        <nav class="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          @for (item of visibleNav; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              (click)="onNavClick()"
              [title]="!sidebarExpanded() ? item.label : ''"
              class="nav-item group"
              [class.justify-center]="!sidebarExpanded()"
              [class.px-2]="!sidebarExpanded()"
            >
              <span class="material-symbols-outlined text-[20px] shrink-0">{{ item.icon }}</span>
              @if (sidebarExpanded()) {
                <span class="truncate">{{ item.label }}</span>
              }
            </a>
          }
        </nav>

        <!-- User -->
        <div class="border-t border-gray-100 p-3">
          @if (sidebarExpanded()) {
            <div class="flex items-center gap-2.5 px-1 mb-2">
              <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span class="text-xs font-bold text-primary-700">
                  {{ auth.currentUser()?.email?.[0]?.toUpperCase() }}
                </span>
              </div>
              <div class="overflow-hidden">
                <p class="text-xs font-semibold text-gray-800 truncate">{{ auth.currentUser()?.email }}</p>
                <p class="text-[10px] text-gray-400 capitalize">{{ rolLabel() }}</p>
              </div>
            </div>
            <button class="btn-ghost btn-sm w-full justify-start gap-2 text-gray-500" (click)="logout()">
              <span class="material-symbols-outlined text-base">logout</span>
              Cerrar sesión
            </button>
          } @else {
            <button
              class="w-full flex justify-center p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              (click)="logout()"
              title="Cerrar sesión"
            >
              <span class="material-symbols-outlined text-xl">logout</span>
            </button>
          }
        </div>
      </aside>

      <!-- Contenido principal -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">

        <!-- Topbar móvil -->
        <header class="lg:hidden flex items-center gap-3 px-4 h-16 bg-white border-b border-gray-100 shrink-0">
          <button
            class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            (click)="openSidebar()"
          >
            <span class="material-symbols-outlined">menu</span>
          </button>
          <span class="text-lg">🍔</span>
          <span class="font-display font-bold text-gray-900">Restaurant Manager</span>
        </header>

        <main class="flex-1 overflow-y-auto">
          <router-outlet />
        </main>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  readonly auth   = inject(AuthService);
  readonly tenant = inject(TenantService);
  private  socket = inject(SocketService);

  sedes       = signal<Sede[]>([]);
  sidebarOpen = signal(true);

  isMobile = signal(window.innerWidth < 1024);

  sidebarExpanded = computed(() => {
    if (this.isMobile()) return this.sidebarOpen();
    return this.sidebarOpen();
  });

  sidebarClasses = computed(() => {
    const expanded = this.sidebarExpanded();
    const mobile   = this.isMobile();

    if (mobile) {
      return expanded ? 'w-60' : '-translate-x-full w-60';
    }
    return expanded ? 'w-60' : 'w-[60px]';
  });

  visibleNav = NAV.filter((item) => {
    const rol = this.auth.rol();
    return rol ? item.roles.includes(rol) : false;
  });

  rolLabel = computed(() => {
    const r = this.auth.rol();
    if (!r) return '';
    const map: Record<string, string> = {
      super_admin: 'Super Admin', admin_sede: 'Admin Sede',
      mesero: 'Mesero', cocina: 'Cocina', domiciliario: 'Domiciliario',
    };
    return map[r] ?? r;
  });

  @HostListener('window:resize')
  onResize() {
    const mobile = window.innerWidth < 1024;
    this.isMobile.set(mobile);
    if (!mobile) this.sidebarOpen.set(true);
  }

  ngOnInit(): void {
    if (this.isMobile()) this.sidebarOpen.set(false);
    if (this.auth.isSuperAdmin()) {
      this.tenant.getSedes().subscribe((s) => this.sedes.set(s));
    }
    this.socket.connect();
  }

  toggleSidebar()  { this.sidebarOpen.update((v) => !v); }
  openSidebar()    { this.sidebarOpen.set(true); }
  closeSidebar()   { this.sidebarOpen.set(false); }

  onNavClick() {
    if (this.isMobile()) this.closeSidebar();
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

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}