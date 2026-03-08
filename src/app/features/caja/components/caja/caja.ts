import {
  Component, OnInit, inject, signal, computed,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import { FormAbrirCaja } from '../form-abrir-caja/form-abrir-caja';
import { FormCerrarCaja } from '../form-cerrar-caja/form-cerrar-caja';
import { FormMovimiento } from '../form-movimiento/form-movimiento';
import { Caja, Movimiento, TipoMovimiento } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

type FiltroMov = 'todos' | TipoMovimiento;

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [DatePipe, CopPipe, FormAbrirCaja, FormCerrarCaja, FormMovimiento],
  template: `
    <div class="flex flex-col h-full">

      <!-- ── Header ──────────────────────────────────────────────────── -->
      <div class="bg-gray-950 px-6 pt-7 pb-0 relative overflow-hidden">
        <!-- Decoración -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand/10 blur-3xl"></div>
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        <div class="relative">
          <div class="flex items-start justify-between mb-6">
            <div>
              <p class="text-brand text-xs font-semibold uppercase tracking-widest mb-1">Jornada del día</p>
              <h1 class="font-display font-bold text-white text-2xl">Caja</h1>
              <p class="text-white/40 text-sm mt-0.5">{{ hoy() }}</p>
            </div>

            <!-- Estado pill -->
            @if (!cargando()) {
              @if (caja()?.abierta) {
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                  <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span class="text-xs font-semibold text-green-300">Caja abierta</span>
                </div>
              } @else {
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                  <span class="w-2 h-2 rounded-full bg-gray-400"></span>
                  <span class="text-xs font-semibold text-gray-400">Caja cerrada</span>
                </div>
              }
            }
          </div>

          <!-- Balance principal -->
          @if (cargando()) {
            <div class="h-20 bg-white/5 rounded-2xl animate-pulse mb-6"></div>
          } @else if (caja()?.abierta) {
            <div class="mb-6">
              <p class="text-white/40 text-xs uppercase tracking-widest mb-1">Balance actual</p>
              <p class="font-display font-black text-white text-4xl tracking-tight">
                {{ balanceActual() | cop }}
              </p>
            </div>

            <!-- KPI strips -->
            <div class="grid grid-cols-3 gap-2 mb-0">
              @for (kpi of kpis(); track kpi.label) {
                <div class="rounded-t-xl bg-white/5 border-t border-x border-white/10 px-3 py-3">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span [class]="'material-symbols-outlined text-sm ' + kpi.color">{{ kpi.icon }}</span>
                    <span class="text-[10px] text-white/40 uppercase tracking-wide">{{ kpi.label }}</span>
                  </div>
                  <p [class]="'font-display font-bold text-base ' + kpi.color">{{ kpi.value }}</p>
                </div>
              }
            </div>
          } @else {
            <!-- Caja cerrada / no existe -->
            <div class="mb-6 rounded-2xl bg-white/5 border border-white/10 px-5 py-6 flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-white/50 text-2xl">lock</span>
              </div>
              <div>
                <p class="text-white/60 font-medium">La caja no está abierta</p>
                <p class="text-white/30 text-sm mt-0.5">Abre la caja para registrar movimientos</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ── Acciones principales ──────────────────────────────────── -->
      @if (!cargando()) {
        <div class="bg-white px-6 py-3 border-b border-gray-100 flex items-center gap-2">
          @if (caja()?.abierta) {
            <button class="btn-primary btn-sm gap-1.5" (click)="mostrarFormMovimiento.set(true)">
              <span class="material-symbols-outlined text-sm">add</span>
              Movimiento
            </button>
            <button
              class="btn-ghost btn-sm gap-1.5 text-gray-500 hover:text-gray-700 ml-auto"
              (click)="mostrarFormCerrar.set(true)"
            >
              <span class="material-symbols-outlined text-sm">lock</span>
              Cerrar caja
            </button>
          } @else {
            <button class="btn-primary gap-2" (click)="mostrarFormAbrir.set(true)">
              <span class="material-symbols-outlined text-base">lock_open</span>
              Abrir caja
            </button>
          }
        </div>
      }

      <!-- ── Lista de movimientos ──────────────────────────────────── -->
      <div class="flex-1 overflow-y-auto">

        <!-- Filtros -->
        @if (movimientos().length > 0) {
          <div class="px-6 pt-4 pb-2 flex items-center gap-2">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mr-2">Movimientos</p>
            @for (f of filtros; track f.value) {
              <button
                (click)="filtroActivo.set(f.value)"
                [class]="filtroActivo() === f.value
                  ? f.activeClass
                  : 'badge bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer transition-colors'"
              >
                {{ f.label }}
              </button>
            }
            <span class="ml-auto text-xs text-gray-400">
              {{ movimientosFiltrados().length }} registro{{ movimientosFiltrados().length !== 1 ? 's' : '' }}
            </span>
          </div>
        }

        @if (cargando()) {
          <div class="px-6 py-4 space-y-2">
            @for (i of [1,2,3,4]; track i) {
              <div class="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
            }
          </div>

        } @else if (!caja()?.abierta && movimientos().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-gray-400">
            <span class="material-symbols-outlined text-5xl mb-3 text-gray-200">receipt_long</span>
            <p class="text-gray-500 font-medium">Sin movimientos hoy</p>
            <p class="text-sm mt-1">Abre la caja para comenzar</p>
          </div>

        } @else if (movimientosFiltrados().length === 0) {
          <div class="flex flex-col items-center justify-center py-16 text-gray-400">
            <span class="material-symbols-outlined text-4xl mb-2 text-gray-200">filter_list_off</span>
            <p class="text-sm text-gray-500">Sin resultados para este filtro</p>
          </div>

        } @else {
          <div class="px-6 py-3 space-y-2 pb-8">
            @for (mov of movimientosFiltrados(); track mov.id) {
              <div class="bg-white rounded-xl border border-gray-100 hover:border-gray-200
                          hover:shadow-card transition-all flex items-center gap-4 px-4 py-3">

                <!-- Ícono tipo -->
                <div [class]="iconClass(mov.tipo)">
                  <span class="material-symbols-outlined text-base">{{ iconMov(mov.tipo) }}</span>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate">{{ mov.descripcion }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ mov.createdAt | date:'HH:mm' }}
                    <span class="mx-1">·</span>
                    <span [class]="tipoClass(mov.tipo)">{{ tipoLabel(mov.tipo) }}</span>
                  </p>
                </div>

                <!-- Monto -->
                <span [class]="'font-display font-bold text-base shrink-0 ' + montoClass(mov.tipo)">
                  {{ mov.tipo === TipoMovimiento.Ingreso ? '+' : '-' }} {{ mov.monto | cop }}
                </span>

              </div>
            }
          </div>
        }

      </div>
    </div>

    <!-- Modales -->
    @if (mostrarFormAbrir()) {
      <app-form-abrir-caja
        (cerrar)="mostrarFormAbrir.set(false)"
        (abierta)="onCajaAbierta($event)"
      />
    }

    @if (mostrarFormCerrar()) {
      <app-form-cerrar-caja
        [resumen]="resumenCierre()"
        (cerrar)="mostrarFormCerrar.set(false)"
        (cerrada)="onCajaCerrada($event)"
      />
    }

    @if (mostrarFormMovimiento()) {
      <app-form-movimiento
        (cerrar)="mostrarFormMovimiento.set(false)"
        (guardado)="onMovimientoGuardado($event)"
      />
    }
  `,
})
export class CajaView implements OnInit {
  private http = inject(HttpClient);

  readonly TipoMovimiento = TipoMovimiento;

  cargando              = signal(true);
  caja                  = signal<Caja | null>(null);
  movimientos           = signal<Movimiento[]>([]);
  filtroActivo          = signal<FiltroMov>('todos');
  mostrarFormAbrir      = signal(false);
  mostrarFormCerrar     = signal(false);
  mostrarFormMovimiento = signal(false);

  filtros = [
    { value: 'todos' as FiltroMov,           label: 'Todos',    activeClass: 'badge bg-gray-800 text-white cursor-pointer' },
    { value: TipoMovimiento.Ingreso,          label: 'Ingresos', activeClass: 'badge bg-green-100 text-green-700 ring-1 ring-green-300 cursor-pointer' },
    { value: TipoMovimiento.Egreso,           label: 'Egresos',  activeClass: 'badge bg-red-100 text-red-600 ring-1 ring-red-300 cursor-pointer' },
    { value: TipoMovimiento.Gasto,            label: 'Gastos',   activeClass: 'badge bg-amber-100 text-amber-700 ring-1 ring-amber-300 cursor-pointer' },
  ];

  // ─── Computed ─────────────────────────────────────────────────────────────

  hoy = computed(() =>
    new Date().toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long' }),
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

  balanceActual = computed(() => {
    const c = this.caja();
    if (!c) return 0;
    return (c.montoInicial ?? 0) + this.totalIngresos() - this.totalEgresos();
  });

  kpis = computed(() => [
    {
      label: 'Apertura',
      value: this.formatShort(this.caja()?.montoInicial ?? 0),
      icon:  'lock_open',
      color: 'text-white/60',
    },
    {
      label: 'Ingresos',
      value: this.formatShort(this.totalIngresos()),
      icon:  'arrow_downward',
      color: 'text-green-400',
    },
    {
      label: 'Egresos',
      value: this.formatShort(this.totalEgresos()),
      icon:  'arrow_upward',
      color: 'text-red-400',
    },
  ]);

  movimientosFiltrados = computed(() => {
    const f = this.filtroActivo();
    const list = [...this.movimientos()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return f === 'todos' ? list : list.filter((m) => m.tipo === f);
  });

  resumenCierre = computed(() => ({
    montoInicial: this.caja()?.montoInicial ?? 0,
    ingresos:     this.totalIngresos(),
    egresos:      this.totalEgresos(),
    esperado:     this.balanceActual(),
  }));

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    forkJoin({
      caja: this.http.get<Caja>(`${environment.apiUrl}/caja`),
      movimientos: this.http.get<Movimiento[]>(`${environment.apiUrl}/movimientos`),
    }).subscribe({
      next: ({ caja, movimientos }) => {
        this.caja.set(caja);
        this.movimientos.set(movimientos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  // ─── Helpers visuales ────────────────────────────────────────────────────

  iconMov(tipo: TipoMovimiento): string {
    switch (tipo) {
      case TipoMovimiento.Ingreso: return 'arrow_downward';
      case TipoMovimiento.Egreso:  return 'arrow_upward';
      case TipoMovimiento.Gasto:   return 'receipt';
    }
  }

  iconClass(tipo: TipoMovimiento): string {
    const base = 'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ';
    switch (tipo) {
      case TipoMovimiento.Ingreso: return base + 'bg-green-50 text-green-600';
      case TipoMovimiento.Egreso:  return base + 'bg-red-50 text-red-500';
      case TipoMovimiento.Gasto:   return base + 'bg-amber-50 text-amber-600';
    }
  }

  montoClass(tipo: TipoMovimiento): string {
    switch (tipo) {
      case TipoMovimiento.Ingreso: return 'text-green-600';
      case TipoMovimiento.Egreso:  return 'text-red-500';
      case TipoMovimiento.Gasto:   return 'text-amber-600';
    }
  }

  tipoLabel(tipo: TipoMovimiento): string {
    switch (tipo) {
      case TipoMovimiento.Ingreso: return 'Ingreso';
      case TipoMovimiento.Egreso:  return 'Egreso';
      case TipoMovimiento.Gasto:   return 'Gasto';
    }
  }

  tipoClass(tipo: TipoMovimiento): string {
    switch (tipo) {
      case TipoMovimiento.Ingreso: return 'text-green-500 font-medium';
      case TipoMovimiento.Egreso:  return 'text-red-400 font-medium';
      case TipoMovimiento.Gasto:   return 'text-amber-500 font-medium';
    }
  }

  private formatShort(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  }

  // ─── Eventos de modales ──────────────────────────────────────────────────

  onCajaAbierta(caja: Caja): void {
    this.caja.set(caja);
    this.movimientos.set([]);
    this.mostrarFormAbrir.set(false);
  }

  onCajaCerrada(caja: Caja): void {
    this.caja.set(caja);
    this.mostrarFormCerrar.set(false);
  }

  onMovimientoGuardado(mov: Movimiento): void {
    this.movimientos.update((list) => [mov, ...list]);
    this.mostrarFormMovimiento.set(false);
  }
}
