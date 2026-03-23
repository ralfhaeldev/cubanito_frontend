import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';     
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { Pedido, Caja, Movimiento, TipoMovimiento, EstadoPedido, TipoPedido } from '../../../../shared/models';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import { BadgeEstadoComponent } from '../../../../shared/components/badge-estado/badge-estado.component';

interface StatCard {
  label:    string;
  value:    string;
  sub:      string;
  icon:     string;
  color:    string;
  bgColor:  string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, BadgeEstadoComponent, CopPipe],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="font-display font-bold text-2xl text-gray-900">
            {{ greeting() }}, {{ firstName() }} 👋
          </h1>
          <p class="text-sm text-gray-500 mt-0.5">
            {{ today | date:"EEEE d 'de' MMMM, yyyy" : '' : 'es' }}
          </p>
        </div>

        @if (caja()) {
          @if (caja()!.abierta) {
            <div class="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-xl px-4 py-2 text-sm font-medium">
              <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Caja abierta
            </div>
          } @else {
            <a routerLink="/caja" class="btn-secondary text-xs">
              <span class="material-symbols-outlined text-base">point_of_sale</span>
              Abrir caja
            </a>
          }
        }
      </div>

      <!-- Stat cards -->
      @if (loading()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="card h-28 animate-pulse bg-gray-100"></div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (card of statCards(); track card.label) {
            <div class="card flex flex-col gap-3 hover:shadow-card-md transition-shadow">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">{{ card.label }}</span>
                <div [class]="'w-8 h-8 rounded-lg flex items-center justify-center ' + card.bgColor">
                  <span [class]="'material-symbols-outlined text-base ' + card.color">{{ card.icon }}</span>
                </div>
              </div>
              <div>
                <p class="font-display font-bold text-2xl text-gray-900">{{ card.value }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ card.sub }}</p>
              </div>
            </div>
          }
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Pedidos recientes -->
        <div class="lg:col-span-2 card !p-0 overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 class="font-display font-semibold text-gray-900">Pedidos recientes</h2>
            <a routerLink="/pedidos" class="text-xs text-brand font-medium hover:underline">
              Ver todos →
            </a>
          </div>

          @if (loading()) {
            <div class="p-5 space-y-3">
              @for (i of [1,2,3]; track i) {
                <div class="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              }
            </div>
          } @else if (pedidosRecientes().length === 0) {
            <div class="py-16 text-center text-gray-400">
              <span class="material-symbols-outlined text-4xl block mb-2">receipt_long</span>
              <p class="text-sm">Sin pedidos hoy</p>
            </div>
          } @else {
            <div class="divide-y divide-gray-50">
              @for (pedido of pedidosRecientes(); track pedido.id) {
                <div class="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/70 transition-colors">

                  <!-- Icono tipo -->
                  <div [class]="pedido.tipo === 'domicilio'
                    ? 'w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0'
                    : 'w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0'">
                    <span [class]="pedido.tipo === 'domicilio'
                      ? 'material-symbols-outlined text-indigo-500 text-lg'
                      : 'material-symbols-outlined text-orange-500 text-lg'">
                      {{ pedido.tipo === 'domicilio' ? 'delivery_dining' : 'restaurant' }}
                    </span>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-semibold text-gray-800 font-mono">
                        #{{ pedido.id.slice(-6).toUpperCase() }}
                      </p>
                      <app-badge-estado [estado]="pedido.estado" />
                    </div>
                    <p class="text-xs text-gray-400 mt-0.5 truncate">
                      {{ pedido.items.length }} producto{{ pedido.items.length !== 1 ? 's' : '' }}
                      · {{ pedido.meseroNombre }}
                    </p>
                  </div>

                  <!-- Total + tiempo -->
                  <div class="text-right shrink-0">
                    <p class="text-sm font-semibold text-gray-900">{{ pedido.total | cop }}</p>
                    <p class="text-xs text-gray-400">{{ pedido.createdAt | date:'HH:mm' }}</p>
                  </div>

                </div>
              }
            </div>
          }
        </div>

        <!-- Panel derecho -->
        <div class="space-y-4">

          <!-- Resumen de caja -->
          <div class="card space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-display font-semibold text-gray-900">Caja del día</h2>
              <span class="material-symbols-outlined text-gray-300 text-xl">point_of_sale</span>
            </div>

            @if (caja()) {
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Monto inicial</span>
                  <span class="font-medium text-gray-800">{{ caja()!.montoInicial | cop }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Ingresos</span>
                  <span class="font-semibold text-green-600">+ {{ totalIngresos() | cop }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Egresos</span>
                  <span class="font-semibold text-red-500">- {{ totalEgresos() | cop }}</span>
                </div>
                <div class="h-px bg-gray-100 my-1"></div>
                <div class="flex justify-between">
                  <span class="text-sm font-semibold text-gray-700">Total estimado</span>
                  <span class="font-display font-bold text-gray-900">{{ totalCaja() | cop }}</span>
                </div>
              </div>
            } @else {
              <p class="text-sm text-gray-400 text-center py-4">Sin caja abierta hoy</p>
            }

            <a routerLink="/caja" class="btn-secondary btn-sm w-full justify-center gap-1.5">
              <span class="material-symbols-outlined text-base">open_in_new</span>
              Ver caja completa
            </a>
          </div>

          <!-- Distribución de estados -->
          <div class="card space-y-3">
            <h2 class="font-display font-semibold text-gray-900">Estado de pedidos</h2>
            <div class="space-y-2">
              @for (estado of estadoStats(); track estado.label) {
                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-gray-600">{{ estado.label }}</span>
                      <span class="font-semibold text-gray-700">{{ estado.count }}</span>
                    </div>
                    <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        [class]="'h-full rounded-full transition-all duration-500 ' + estado.color"
                        [style.width.%]="estado.pct"
                      ></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  readonly auth = inject(AuthService);

  today    = new Date();
  loading  = signal(true);
  pedidos  = signal<Pedido[]>([]);
  caja     = signal<Caja | null>(null);
  movimientos = signal<Movimiento[]>([]);

  // ─── Computed ─────────────────────────────────────────────────────────────

  greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  });

  firstName = computed(() => {
    const email = this.auth.currentUser()?.email ?? '';
    return email.split('@')[0];
  });

  pedidosRecientes = computed(() =>
    [...this.pedidos()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6),
  );

  totalIngresos = computed(() =>
    this.movimientos()
      .filter((m) => m.tipo === TipoMovimiento.Ingreso)
      .reduce((s, m) => s + m.monto, 0),
  );

  totalEgresos = computed(() =>
    this.movimientos()
      .filter((m) => m.tipo !== TipoMovimiento.Ingreso)
      .reduce((s, m) => s + m.monto, 0),
  );

  totalCaja = computed(() => {
    const c = this.caja();
    if (!c) return 0;
    return c.montoInicial + this.totalIngresos() - this.totalEgresos();
  });

  statCards = computed((): StatCard[] => {
    const p = this.pedidos();
    const activos    = p.filter((x) => ![EstadoPedido.Finalizado, EstadoPedido.Rechazado].includes(x.estado)).length;
    const finalizados = p.filter((x) => x.estado === EstadoPedido.Finalizado).length;
    const ventas     = p
      .filter((x) => x.estado === EstadoPedido.Finalizado)
      .reduce((s, x) => s + x.total, 0);
    const domicilios  = p.filter((x) => x.tipo === TipoPedido.Domicilio).length;

    return [
      { label: 'Pedidos activos', value: String(activos),        sub: 'en este momento',    icon: 'receipt_long',    color: 'text-orange-500', bgColor: 'bg-orange-50' },
      { label: 'Finalizados hoy', value: String(finalizados),    sub: 'pedidos cobrados',   icon: 'check_circle',    color: 'text-green-500',  bgColor: 'bg-green-50' },
      { label: 'Ventas del día',  value: this.formatCOP(ventas), sub: 'ingresos por ventas',icon: 'payments',        color: 'text-blue-500',   bgColor: 'bg-blue-50' },
      { label: 'Domicilios',      value: String(domicilios),     sub: 'pedidos a domicilio',icon: 'delivery_dining', color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
    ];
  });

  estadoStats = computed(() => {
    const p     = this.pedidos();
    const total = p.length || 1;
    const estados = [
      { label: 'Pendiente',  key: EstadoPedido.Pendiente,  color: 'bg-yellow-400' },
      { label: 'En proceso', key: EstadoPedido.EnProceso,  color: 'bg-blue-400' },
      { label: 'Entregado',  key: EstadoPedido.Entregado,  color: 'bg-teal-400' },
      { label: 'Finalizado', key: EstadoPedido.Finalizado, color: 'bg-green-400' },
      { label: 'Rechazado',  key: EstadoPedido.Rechazado,  color: 'bg-red-400' },
    ];
    return estados.map((e) => {
      const count = p.filter((x) => x.estado === e.key).length;
      return { ...e, count, pct: Math.round((count / total) * 100) };
    });
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    forkJoin({
      pedidos:     this.http.get<Pedido[]>(`${environment.apiUrl}/orders`),
      caja:        this.http.get<Caja>(`${environment.apiUrl}/caja`),
      movimientos: this.http.get<Movimiento[]>(`${environment.apiUrl}/movimientos`),
    }).subscribe({
      next: ({ pedidos, caja, movimientos }) => {
        this.pedidos.set(pedidos);
        this.caja.set(caja);
        this.movimientos.set(movimientos);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private formatCOP(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
  }
}