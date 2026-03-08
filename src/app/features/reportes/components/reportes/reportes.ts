import {
  Component, OnInit, OnDestroy, AfterViewInit,
  inject, signal, computed, effect,
  ViewChild, ElementRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { environment } from '../../../../../environments/environment';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';

Chart.register(...registerables);

type Periodo = 'today' | '7d' | '30d';

interface Resumen {
  totalVentas:     number;
  totalPedidos:    number;
  totalDomicilios: number;
  ticketPromedio:  number;
}

interface VentaDiaria {
  fecha: string; ventas: number; pedidos: number; domicilios: number;
}

interface ProductoVendido {
  nombre: string; cantidad: number; ingresos: number;
}

interface CajaHistorial {
  id: string; fecha: string; montoInicial: number; montoFinal: number | null;
  ingresos: number; egresos: number; abierta: boolean; abiertaPor: string;
}

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: '7d',    label: '7 días' },
  { key: '30d',   label: '30 días' },
];

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [DatePipe, CopPipe],
  template: `
    <div class="min-h-screen bg-gray-50">

      <!-- ── Hero header ──────────────────────────────────────────────── -->
      <div class="bg-gray-950 px-6 pt-8 pb-10 relative overflow-hidden">

        <!-- Decoración de fondo -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand/10 blur-3xl"></div>
          <div class="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-brand/5 blur-2xl"></div>
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent"></div>
        </div>

        <div class="relative max-w-7xl mx-auto">

          <!-- Título + selector de período -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p class="text-brand text-xs font-semibold uppercase tracking-widest mb-1">Análisis de negocio</p>
              <h1 class="font-display font-bold text-white text-2xl">Reportes</h1>
            </div>

            <!-- Tabs de período -->
            <div class="flex items-center bg-white/10 rounded-xl p-1 gap-0.5">
              @for (p of periodos; track p.key) {
                <button
                  (click)="setPeriodo(p.key)"
                  [class]="periodo() === p.key
                    ? 'px-4 py-1.5 rounded-lg text-sm font-semibold bg-brand text-white transition-all duration-200'
                    : 'px-4 py-1.5 rounded-lg text-sm font-medium text-white/60 hover:text-white/90 transition-all duration-200'"
                >
                  {{ p.label }}
                </button>
              }
            </div>
          </div>

          <!-- KPI Cards -->
          @if (loadingResumen()) {
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              @for (i of [1,2,3,4]; track i) {
                <div class="rounded-2xl bg-white/5 h-24 animate-pulse"></div>
              }
            </div>
          } @else {
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              @for (kpi of kpiCards(); track kpi.label) {
                <div class="rounded-2xl bg-white/5 border border-white/10 px-5 py-4 hover:bg-white/[0.08] transition-colors">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-xs text-white/40 font-medium uppercase tracking-wide">{{ kpi.label }}</span>
                    <span [class]="'material-symbols-outlined text-lg ' + kpi.color">{{ kpi.icon }}</span>
                  </div>
                  <p class="font-display font-bold text-white text-xl leading-none">{{ kpi.value }}</p>
                  <p class="text-xs text-white/30 mt-1.5">{{ kpi.sub }}</p>
                </div>
              }
            </div>
          }

        </div>
      </div>

      <!-- ── Contenido principal ──────────────────────────────────────── -->
      <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <!-- Fila 1: Ventas diarias + Top productos -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

          <!-- Gráfica de ventas por día -->
          <div class="lg:col-span-3 card !p-0 overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 class="font-display font-semibold text-gray-900">Ventas por día</h2>
                <p class="text-xs text-gray-400 mt-0.5">Ingresos totales por jornada</p>
              </div>
              @if (!loadingCharts()) {
                <p class="text-xs text-gray-400 font-mono">
                  Σ {{ totalVentasPeriodo() | cop }}
                </p>
              }
            </div>
            <div class="p-5 h-64 relative">
              @if (loadingCharts()) {
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="flex gap-1">
                    @for (i of [1,2,3,4]; track i) {
                      <div [style.animation-delay]="(i * 0.15) + 's'"
                           class="w-2 h-8 bg-gray-200 rounded animate-pulse"></div>
                    }
                  </div>
                </div>
              } @else {
                <canvas #ventasChart></canvas>
              }
            </div>
          </div>

          <!-- Top productos -->
          <div class="lg:col-span-2 card !p-0 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100">
              <h2 class="font-display font-semibold text-gray-900">Productos top</h2>
              <p class="text-xs text-gray-400 mt-0.5">Por unidades vendidas</p>
            </div>

            @if (loadingCharts()) {
              <div class="p-5 space-y-3">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="h-8 bg-gray-100 rounded-lg animate-pulse"></div>
                }
              </div>
            } @else {
              <div class="p-5 space-y-3">
                @for (p of productosTop(); track p.nombre; let idx = $index) {
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="text-[10px] font-bold text-gray-300 w-4 shrink-0">{{ idx + 1 }}</span>
                        <span class="text-sm text-gray-700 truncate font-medium">{{ p.nombre }}</span>
                      </div>
                      <div class="flex items-center gap-2 shrink-0 ml-2">
                        <span class="text-xs font-semibold text-gray-900">{{ p.cantidad }}</span>
                        <span class="text-xs text-gray-400">uds</span>
                      </div>
                    </div>
                    <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-700"
                        [style.width.%]="(p.cantidad / productosTop()[0].cantidad) * 100"
                        [style.background]="barColor(idx)"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Fila 2: Pedidos vs Domicilios + Distribución de ingresos -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Pedidos vs Domicilios — área chart -->
          <div class="card !p-0 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100">
              <h2 class="font-display font-semibold text-gray-900">Pedidos totales vs Domicilios</h2>
              <p class="text-xs text-gray-400 mt-0.5">Evolución diaria por tipo</p>
            </div>
            <div class="p-5 h-52 relative">
              @if (loadingCharts()) {
                <div class="h-full bg-gray-50 rounded-xl animate-pulse"></div>
              } @else {
                <canvas #pedidosChart></canvas>
              }
            </div>
          </div>

          <!-- Ingresos por producto — donut -->
          <div class="card !p-0 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100">
              <h2 class="font-display font-semibold text-gray-900">Distribución de ingresos</h2>
              <p class="text-xs text-gray-400 mt-0.5">Por producto vendido</p>
            </div>
            <div class="p-5 flex items-center gap-6">
              <div class="w-40 h-40 shrink-0 relative">
                @if (loadingCharts()) {
                  <div class="w-full h-full rounded-full bg-gray-100 animate-pulse"></div>
                } @else {
                  <canvas #donutChart></canvas>
                }
              </div>
              @if (!loadingCharts()) {
                <div class="space-y-2 flex-1 min-w-0">
                  @for (p of productosTop().slice(0,5); track p.nombre; let idx = $index) {
                    <div class="flex items-center gap-2">
                      <div class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="donutColors[idx]"></div>
                      <span class="text-xs text-gray-600 truncate flex-1">{{ p.nombre }}</span>
                      <span class="text-xs font-semibold text-gray-800 shrink-0">{{ p.ingresos | cop }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Fila 3: Historial de caja -->
        <div class="card !p-0 overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 class="font-display font-semibold text-gray-900">Historial de caja</h2>
              <p class="text-xs text-gray-400 mt-0.5">Aperturas y cierres recientes</p>
            </div>
          </div>

          @if (loadingCaja()) {
            <div class="p-6 space-y-3">
              @for (i of [1,2,3,4]; track i) {
                <div class="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
              }
            </div>
          } @else {
            <div class="table-wrapper rounded-none border-0">
              <table class="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Apertura</th>
                    <th>Ingresos</th>
                    <th>Egresos</th>
                    <th>Cierre</th>
                    <th>Balance</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of cajaHistorial(); track c.id) {
                    <tr>
                      <td>
                        <span class="font-medium text-gray-800">
                          {{ c.fecha | date:'EEE d MMM' }}
                        </span>
                      </td>
                      <td class="font-mono text-gray-600">{{ c.montoInicial | cop }}</td>
                      <td>
                        <span class="font-semibold text-green-600">+ {{ c.ingresos | cop }}</span>
                      </td>
                      <td>
                        <span class="font-semibold text-red-500">- {{ c.egresos | cop }}</span>
                      </td>
                      <td class="font-mono text-gray-600">
                        {{ c.montoFinal !== null ? (c.montoFinal | cop) : '—' }}
                      </td>
                      <td>
                        @if (c.montoFinal !== null) {
                          <span [class]="balance(c) >= 0
                            ? 'font-bold text-green-600'
                            : 'font-bold text-red-500'">
                            {{ balance(c) >= 0 ? '+' : '' }}{{ balance(c) | cop }}
                          </span>
                        } @else {
                          <span class="text-gray-400 text-xs">En curso</span>
                        }
                      </td>
                      <td>
                        @if (c.abierta) {
                          <span class="badge bg-green-50 text-green-700 ring-1 ring-green-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Abierta
                          </span>
                        } @else {
                          <span class="badge bg-gray-50 text-gray-500 ring-1 ring-gray-200">
                            Cerrada
                          </span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class Reportes implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  // ─── State ────────────────────────────────────────────────────────────────
  periodo       = signal<Periodo>('7d');
  periodos      = PERIODOS;
  loadingResumen = signal(true);
  loadingCharts  = signal(true);
  loadingCaja    = signal(true);

  resumen       = signal<Resumen | null>(null);
  ventasDiarias = signal<VentaDiaria[]>([]);
  productosTop  = signal<ProductoVendido[]>([]);
  cajaHistorial = signal<CajaHistorial[]>([]);

  // Chart.js instances
  private chartVentas:  Chart | null = null;
  private chartPedidos: Chart | null = null;
  private chartDonut:   Chart | null = null;

  @ViewChild('ventasChart')  ventasRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('pedidosChart') pedidosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChart')   donutRef!:   ElementRef<HTMLCanvasElement>;

  donutColors = ['#f77a1a', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

  // ─── Computed ─────────────────────────────────────────────────────────────

  kpiCards = computed(() => {
    const r = this.resumen();
    if (!r) return [];
    return [
      { label: 'Ventas totales',  value: this.fmt(r.totalVentas),     sub: 'ingresos por ventas',     icon: 'payments',        color: 'text-green-400' },
      { label: 'Pedidos',         value: String(r.totalPedidos),       sub: 'pedidos procesados',      icon: 'receipt_long',    color: 'text-blue-400' },
      { label: 'Ticket promedio', value: this.fmt(r.ticketPromedio),   sub: 'por pedido finalizado',   icon: 'show_chart',      color: 'text-brand' },
      { label: 'Domicilios',      value: String(r.totalDomicilios),    sub: 'pedidos a domicilio',     icon: 'delivery_dining', color: 'text-indigo-400' },
    ];
  });

  totalVentasPeriodo = computed(() =>
    this.ventasDiarias().reduce((s, v) => s + v.ventas, 0),
  );

  constructor() { 
     // Recargar cuando cambia el período
    effect(() => {
      const p = this.periodo();
      this.cargarDatos(p);
    }, { allowSignalWrites: true });
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
   

    this.cargarCaja();
  }

  private cargarDatos(periodo: Periodo): void {
    this.loadingResumen.set(true);
    this.loadingCharts.set(true);

    const base = environment.apiUrl;
    forkJoin({
      resumen:   this.http.get<Resumen>(`${base}/reportes/resumen?periodo=${periodo}`),
      ventas:    this.http.get<VentaDiaria[]>(`${base}/reportes/ventas?periodo=${periodo}`),
      productos: this.http.get<ProductoVendido[]>(`${base}/reportes/productos-top?periodo=${periodo}`),
    }).subscribe(({ resumen, ventas, productos }) => {
      this.resumen.set(resumen);
      this.loadingResumen.set(false);

      this.ventasDiarias.set(ventas);
      this.productosTop.set(productos);
      this.loadingCharts.set(false);

      // Espera a que Angular renderice los canvas
      setTimeout(() => this.buildCharts(), 50);
    });
  }

  private cargarCaja(): void {
    this.http
      .get<CajaHistorial[]>(`${environment.apiUrl}/reportes/caja-historial`)
      .subscribe((data) => {
        this.cajaHistorial.set(data);
        this.loadingCaja.set(false);
      });
  }

  // ─── Charts ───────────────────────────────────────────────────────────────

  private buildCharts(): void {
    this.destroyCharts();
    const ventas = this.ventasDiarias();
    if (!ventas.length) return;

    const labels = ventas.map((v) =>
      new Date(v.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
    );

    // ── Bar chart: ventas por día ──────────────────────────────────────────
    if (this.ventasRef?.nativeElement) {
      this.chartVentas = new Chart(this.ventasRef.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Ventas',
            data: ventas.map((v) => v.ventas),
            backgroundColor: ventas.map((_, i) =>
              i === ventas.length - 1 ? '#f77a1a' : '#f77a1a22',
            ),
            borderColor: ventas.map((_, i) =>
              i === ventas.length - 1 ? '#e85f0d' : '#f77a1a55',
            ),
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ' ' + this.fmt(ctx.parsed.y as number),
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
            y: {
              grid: { color: '#f3f4f6' },
              ticks: {
                font: { size: 11 }, color: '#9ca3af',
                callback: (v) => this.fmtShort(v as number),
              },
              border: { display: false },
            },
          },
        },
      });
    }

    // ── Line chart: pedidos vs domicilios ──────────────────────────────────
    if (this.pedidosRef?.nativeElement) {
      this.chartPedidos = new Chart(this.pedidosRef.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Pedidos totales',
              data: ventas.map((v) => v.pedidos),
              borderColor: '#3b82f6',
              backgroundColor: '#3b82f615',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointBackgroundColor: '#3b82f6',
              borderWidth: 2,
            },
            {
              label: 'Domicilios',
              data: ventas.map((v) => v.domicilios),
              borderColor: '#f77a1a',
              backgroundColor: '#f77a1a10',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointBackgroundColor: '#f77a1a',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 11 }, color: '#6b7280', usePointStyle: true, pointStyleWidth: 8 },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
            y: {
              grid: { color: '#f3f4f6' },
              ticks: { font: { size: 11 }, color: '#9ca3af', stepSize: 5 },
              border: { display: false },
            },
          },
        },
      });
    }

    // ── Donut: distribución de ingresos por producto ───────────────────────
    if (this.donutRef?.nativeElement) {
      const top5 = this.productosTop().slice(0, 5);
      this.chartDonut = new Chart(this.donutRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: top5.map((p) => p.nombre),
          datasets: [{
            data: top5.map((p) => p.ingresos),
            backgroundColor: this.donutColors,
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '72%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ' ' + this.fmt(ctx.parsed as number),
              },
            },
          },
        },
      });
    }
  }

  private destroyCharts(): void {
    this.chartVentas?.destroy();
    this.chartPedidos?.destroy();
    this.chartDonut?.destroy();
    this.chartVentas = this.chartPedidos = this.chartDonut = null;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  setPeriodo(p: Periodo): void { this.periodo.set(p); }

  barColor(idx: number): string {
    const colors = ['#f77a1a', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
    return colors[idx % colors.length];
  }

  balance(c: CajaHistorial): number {
    if (c.montoFinal === null) return 0;
    return c.montoFinal - c.montoInicial;
  }

  private fmt(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v);
  }

  private fmtShort(v: number): string {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000)    return `$${(v / 1000).toFixed(0)}K`;
    return `$${v}`;
  }

  ngOnDestroy(): void { this.destroyCharts(); }
}
