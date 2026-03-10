import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Pedido, EstadoPedido, TipoPedido } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

interface Columna {
  estado:       EstadoPedido;
  label:        string;
  accionLabel:  string;
  accionIcon:   string;
  accionEstado: EstadoPedido;
  headerBg:     string;
  headerText:   string;
  dot:          string;
  btnClass:     string;
}

const COLUMNAS: Columna[] = [
  {
    estado:       EstadoPedido.Pendiente,
    label:        'Pendientes',
    accionLabel:  'Tomar pedido',
    accionIcon:   'cooking',
    accionEstado: EstadoPedido.EnProceso,
    headerBg:     'bg-amber-950/60 border-amber-700/40',
    headerText:   'text-amber-300',
    dot:          'bg-amber-400',
    btnClass:     'bg-amber-400 hover:bg-amber-300 text-gray-900',
  },
  {
    estado:       EstadoPedido.EnProceso,
    label:        'En preparación',
    accionLabel:  'Marcar listo',
    accionIcon:   'check_circle',
    accionEstado: EstadoPedido.Enviado,
    headerBg:     'bg-blue-950/60 border-blue-700/40',
    headerText:   'text-blue-300',
    dot:          'bg-blue-400',
    btnClass:     'bg-green-500 hover:bg-green-400 text-white',
  },
];

@Component({
  selector: 'app-vista-cocina',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="flex flex-col h-full bg-gray-950">

      <!-- Header -->
      <div class="px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-400 text-xl">cooking</span>
          </div>
          <div>
            <h1 class="font-display font-bold text-white text-lg leading-tight">Vista Cocina</h1>
            <p class="text-white/40 text-xs">
              {{ horaActual() }}
              @if (totalActivos() > 0) {
                · <span class="text-orange-400 font-semibold">
                  {{ totalActivos() }} pedido{{ totalActivos() !== 1 ? 's' : '' }} activo{{ totalActivos() !== 1 ? 's' : '' }}
                </span>
              } @else {
                · <span class="text-green-400 font-semibold">Todo al día ✓</span>
              }
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            (click)="sonido.set(!sonido())"
            [title]="sonido() ? 'Silenciar' : 'Activar sonido'"
          >
            <span class="material-symbols-outlined text-lg">{{ sonido() ? 'volume_up' : 'volume_off' }}</span>
          </button>
          <div class="flex items-center gap-2">
            @if (cargando()) {
              <span class="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
            } @else {
              <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            }
            <span class="text-white/30 text-xs">En vivo</span>
          </div>
        </div>
      </div>

      <!-- Kanban 3 columnas -->
      <div class="flex-1 overflow-hidden grid grid-cols-3 gap-4 p-4">

        @for (col of columnas; track col.estado) {
          <div class="flex flex-col min-w-0">
            <div [class]="'flex items-center justify-between px-4 py-2.5 rounded-xl border mb-3 ' + col.headerBg">
              <div class="flex items-center gap-2">
                <span [class]="'w-2 h-2 rounded-full ' + col.dot"></span>
                <span [class]="'font-display font-bold text-sm ' + col.headerText">{{ col.label }}</span>
              </div>
              <span [class]="'font-black text-xl leading-none ' + col.headerText">{{ pedidosPor(col.estado).length }}</span>
            </div>

            <div class="flex-1 overflow-y-auto space-y-3 pr-0.5">
              @if (cargando() && pedidosPor(col.estado).length === 0) {
                @for (i of [1,2]; track i) {
                  <div class="h-44 bg-white/5 rounded-2xl animate-pulse"></div>
                }
              }
              @if (!cargando() && pedidosPor(col.estado).length === 0) {
                <div class="flex flex-col items-center justify-center py-16 text-white/20">
                  <span class="material-symbols-outlined text-4xl mb-2">done_all</span>
                  <p class="text-sm">Sin pedidos</p>
                </div>
              }

              @for (pedido of pedidosPor(col.estado); track pedido.id) {
                <div class="rounded-2xl overflow-hidden border transition-all"
                     [class]="esUrgente(pedido) ? 'bg-amber-950/70 border-amber-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'">

                  <div class="px-4 pt-4 pb-2.5">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                      <span class="font-display font-black text-white text-lg leading-none">#{{ pedido.id.slice(-6).toUpperCase() }}</span>
                      @if (pedido.tipo === TipoPedido.Domicilio) {
                        <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold ring-1 ring-indigo-500/30">
                          <span class="material-symbols-outlined text-[10px]">delivery_dining</span>
                          Domicilio
                        </span>
                      }
                      @if (esUrgente(pedido)) {
                        <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 text-[10px] font-bold ring-1 ring-red-500/40 animate-pulse">⚡ Urgente</span>
                      }
                    </div>
                    <p class="text-white/40 text-xs">
                      {{ pedido.meseroNombre }}
                      <span class="mx-1 text-white/20">·</span>
                      {{ pedido.createdAt | date:'HH:mm' }}
                      <span class="mx-1 text-white/20">·</span>
                      <span [class]="esUrgente(pedido) ? 'text-amber-400 font-semibold' : ''">{{ tiempoTranscurrido(pedido.createdAt) }}</span>
                    </p>
                  </div>

                  <div class="mx-4 border-t border-white/10 mb-2.5"></div>

                  <div class="px-4 pb-3 space-y-1.5">
                    @for (item of pedido.items; track item.id) {
                      <div class="flex items-center gap-2.5">
                        <span class="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-black text-white/80 shrink-0">{{ item.cantidad }}</span>
                        <span class="text-sm text-white/75 truncate">{{ item.productoNombre }}</span>
                      </div>
                    }
                  </div>

                  @if (pedido.clienteDomicilio) {
                    <div class="mx-4 mb-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3 py-2">
                      <p class="text-xs font-semibold text-indigo-300">{{ pedido.clienteDomicilio.nombre }}</p>
                      <p class="text-xs text-indigo-300/50 truncate mt-0.5">{{ pedido.clienteDomicilio.direccion }}</p>
                    </div>
                  }

                  <div class="px-4 pb-4">
                    <button
                      [class]="'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ' + col.btnClass"
                      [disabled]="actualizando()[pedido.id]"
                      (click)="avanzarEstado(pedido, col.accionEstado)"
                    >
                      @if (actualizando()[pedido.id]) {
                        <span class="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin"></span>
                      } @else {
                        <span class="material-symbols-outlined text-[18px]">{{ col.accionIcon }}</span>
                      }
                      {{ col.accionLabel }}
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Listos (solo lectura) -->
        <div class="flex flex-col min-w-0">
          <div class="flex items-center justify-between px-4 py-2.5 rounded-xl border mb-3 bg-green-950/50 border-green-800/40">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span class="font-display font-bold text-sm text-green-300">Listos para entregar</span>
            </div>
            <span class="font-black text-xl leading-none text-green-300">{{ pedidosPor(EstadoPedido.Enviado).length }}</span>
          </div>

          <div class="flex-1 overflow-y-auto space-y-3 pr-0.5">
            @if (pedidosPor(EstadoPedido.Enviado).length === 0) {
              <div class="flex flex-col items-center justify-center py-16 text-white/20">
                <span class="material-symbols-outlined text-4xl mb-2">hourglass_empty</span>
                <p class="text-sm">Ninguno listo aún</p>
              </div>
            }
            @for (pedido of pedidosPor(EstadoPedido.Enviado); track pedido.id) {
              <div class="bg-green-950/30 border border-green-800/30 rounded-2xl px-4 py-3.5">
                <div class="flex items-center justify-between mb-2.5">
                  <div class="flex items-center gap-2">
                    <span class="font-display font-black text-green-300 text-lg leading-none">#{{ pedido.id.slice(-6).toUpperCase() }}</span>
                    @if (pedido.tipo === TipoPedido.Domicilio) {
                      <span class="material-symbols-outlined text-indigo-400 text-sm">delivery_dining</span>
                    }
                  </div>
                  <span class="text-xs text-green-400/50">{{ pedido.updatedAt | date:'HH:mm' }}</span>
                </div>
                <div class="space-y-1">
                  @for (item of pedido.items; track item.id) {
                    <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded-lg bg-green-500/20 flex items-center justify-center text-[10px] font-bold text-green-400 shrink-0">{{ item.cantidad }}</span>
                      <span class="text-sm text-green-300/60 line-through truncate">{{ item.productoNombre }}</span>
                    </div>
                  }
                </div>
                <p class="mt-2.5 text-xs text-green-400/40 flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs">check_circle</span>
                  Esperando retiro
                </p>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
})
export class VistaCocina implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  readonly EstadoPedido = EstadoPedido;
  readonly TipoPedido   = TipoPedido;
  readonly columnas     = COLUMNAS;

  cargando     = signal(true);
  pedidos      = signal<Pedido[]>([]);
  actualizando = signal<Record<string, boolean>>({});
  hora         = signal(new Date());
  sonido       = signal(true);

  private subs = new Subscription();

  totalActivos = computed(() =>
    this.pedidos().filter((p) => [EstadoPedido.Pendiente, EstadoPedido.EnProceso].includes(p.estado)).length,
  );

  horaActual = computed(() =>
    this.hora().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );

  ngOnInit(): void {
    this.cargar();
    this.subs.add(
      interval(12000).pipe(switchMap(() => this.http.get<Pedido[]>(`${environment.apiUrl}/pedidos/activos`)))
        .subscribe((p) => this.pedidos.set(p)),
    );
    this.subs.add(interval(1000).subscribe(() => this.hora.set(new Date())));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  private cargar(): void {
    this.cargando.set(true);
    this.http.get<Pedido[]>(`${environment.apiUrl}/pedidos/activos`).subscribe({
      next:  (p) => { this.pedidos.set(p); this.cargando.set(false); },
      error: ()  => this.cargando.set(false),
    });
  }

  pedidosPor(estado: EstadoPedido): Pedido[] {
    return this.pedidos()
      .filter((p) => p.estado === estado)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  esUrgente(pedido: Pedido): boolean {
    const mins = (Date.now() - new Date(pedido.createdAt).getTime()) / 60000;
    return pedido.estado === EstadoPedido.Pendiente && mins > 15;
  }

  tiempoTranscurrido(fecha: string): string {
    const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  avanzarEstado(pedido: Pedido, nuevoEstado: EstadoPedido): void {
    this.actualizando.update((m) => ({ ...m, [pedido.id]: true }));
    this.http.patch<Pedido>(`${environment.apiUrl}/pedidos/${pedido.id}/estado`, { estado: nuevoEstado }).subscribe({
      next:  (u) => { this.pedidos.update((l) => l.map((p) => p.id === u.id ? u : p)); this.actualizando.update((m) => ({ ...m, [pedido.id]: false })); },
      error: ()  => this.actualizando.update((m) => ({ ...m, [pedido.id]: false })),
    });
  }
}
