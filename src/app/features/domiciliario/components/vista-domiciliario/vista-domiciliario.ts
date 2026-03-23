import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Pedido, EstadoPedido, TipoPedido } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-vista-domiciliario',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="flex flex-col h-full bg-gray-950">

      <!-- Barra de estado superior -->
      <div class="px-5 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          @if (pendientes().length > 0) {
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
              <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span class="text-indigo-300 text-sm font-semibold">
                {{ pendientes().length }} pendiente{{ pendientes().length !== 1 ? 's' : '' }}
              </span>
            </div>
          } @else {
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
              <span class="w-2 h-2 rounded-full bg-green-400"></span>
              <span class="text-green-300 text-sm font-semibold">Sin pendientes</span>
            </div>
          }
          <span class="text-white/30 text-xs">{{ horaActual() }}</span>
        </div>

        <!-- Resumen del día -->
        <div class="flex items-center gap-1.5 text-white/40 text-xs">
          <span class="material-symbols-outlined text-sm">check_circle</span>
          <span>{{ entregados().length }} entregado{{ entregados().length !== 1 ? 's' : '' }} hoy</span>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        @if (cargando() && pendientes().length === 0) {
          <!-- Skeleton -->
          @for (i of [1, 2]; track i) {
            <div class="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3 animate-pulse">
              <div class="h-4 bg-white/10 rounded-full w-1/3"></div>
              <div class="h-3 bg-white/10 rounded-full w-2/3"></div>
              <div class="h-3 bg-white/10 rounded-full w-1/2"></div>
              <div class="h-11 bg-white/10 rounded-xl mt-2"></div>
            </div>
          }
        }

        @if (!cargando() && pendientes().length === 0) {
          <!-- Estado vacío -->
          <div class="flex flex-col items-center justify-center py-24 text-white/20">
            <div class="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
              <span class="material-symbols-outlined text-4xl">delivery_dining</span>
            </div>
            <p class="text-base font-semibold text-white/30">Todo entregado</p>
            <p class="text-sm mt-1">No hay domicilios pendientes</p>
          </div>
        }

        <!-- Tarjetas de entrega pendiente -->
        @for (pedido of pendientes(); track pedido.id) {
          <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">

            <!-- Cabecera de la tarjeta -->
            <div class="px-5 pt-4 pb-3 flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-display font-black text-white text-xl leading-none">
                    #{{ pedido.id.slice(-6).toUpperCase() }}
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                               bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold
                               ring-1 ring-indigo-500/30">
                    <span class="material-symbols-outlined text-[10px]">delivery_dining</span>
                    Domicilio
                  </span>
                </div>
                <p class="text-white/35 text-xs">
                  Listo hace {{ tiempoTranscurrido(pedido.updatedAt) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-[10px] text-white/30 uppercase tracking-wide">Ítems</p>
                <p class="text-lg font-black text-white/60 leading-none">
                  {{ pedido.items.reduce(totalItems, 0) }}
                </p>
              </div>
            </div>

            <!-- Divisor -->
            <div class="mx-5 border-t border-white/8"></div>

            <!-- Datos del cliente -->
            @if (pedido.clienteDomicilio) {
              <div class="px-5 py-4 space-y-3">

                <!-- Nombre -->
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <span class="text-sm font-black text-indigo-300">
                      {{ pedido.clienteDomicilio.nombre[0].toUpperCase() }}
                    </span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-white truncate">
                      {{ pedido.clienteDomicilio.nombre }}
                    </p>
                    <!-- Teléfono: toca para llamar -->
                    <a
                      [href]="'tel:' + pedido.clienteDomicilio.telefono"
                      class="inline-flex items-center gap-1 text-indigo-400 text-xs font-medium
                             hover:text-indigo-300 active:text-indigo-200 transition-colors"
                    >
                      <span class="material-symbols-outlined text-[13px]">call</span>
                      {{ pedido.clienteDomicilio.telefono }}
                    </a>
                  </div>
                </div>

                <!-- Dirección -->
                <div class="flex items-start gap-3 rounded-xl bg-indigo-500/10
                            border border-indigo-500/20 px-4 py-3">
                  <span class="material-symbols-outlined text-indigo-400 text-base mt-0.5 shrink-0">
                    location_on
                  </span>
                  <p class="text-sm text-indigo-200 leading-snug">
                    {{ pedido.clienteDomicilio.direccion }}
                  </p>
                </div>

              </div>
            }

            <!-- Divisor -->
            <div class="mx-5 border-t border-white/8"></div>

            <!-- Productos -->
            <div class="px-5 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2">
                Pedido
              </p>
              <div class="space-y-1.5">
                @for (item of pedido.items; track item.id) {
                  <div class="flex items-center gap-2.5">
                    <span class="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center
                                 text-[11px] font-black text-white/60 shrink-0">
                      {{ item.cantidad }}
                    </span>
                    <span class="text-sm text-white/60 truncate">{{ item.productoNombre }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Botón de acción -->
            <div class="px-5 pb-5 pt-2">
              <button
                class="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl
                       bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600
                       text-white font-bold text-sm transition-all active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="actualizando()[pedido.id]"
                (click)="marcarEntregado(pedido)"
              >
                @if (actualizando()[pedido.id]) {
                  <span class="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Registrando...
                } @else {
                  <span class="material-symbols-outlined text-xl">check_circle</span>
                  Marcar como entregado
                }
              </button>
            </div>

          </div>
        }

        <!-- Historial del día (compacto) -->
        @if (entregados().length > 0) {
          <div class="mt-2">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-white/25 px-1 mb-3">
              Entregados hoy
            </p>
            <div class="space-y-2">
              @for (pedido of entregados(); track pedido.id) {
                <div class="flex items-center gap-3 px-4 py-3 rounded-xl
                            bg-green-950/30 border border-green-800/25">
                  <span class="w-7 h-7 rounded-full bg-green-500/20 flex items-center
                               justify-center shrink-0">
                    <span class="material-symbols-outlined text-green-400 text-sm">check</span>
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-green-300">
                      #{{ pedido.id.slice(-6).toUpperCase() }}
                    </p>
                    @if (pedido.clienteDomicilio) {
                      <p class="text-xs text-green-400/50 truncate">
                        {{ pedido.clienteDomicilio.nombre }} · {{ pedido.clienteDomicilio.direccion }}
                      </p>
                    }
                  </div>
                  <span class="text-xs text-green-400/40 shrink-0">
                    {{ pedido.updatedAt | date:'HH:mm' }}
                  </span>
                </div>
              }
            </div>
          </div>
        }

        <div class="h-4"></div>
      </div>

    </div>
  `,
})
export class VistaDomiciliario implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  cargando     = signal(true);
  pedidos      = signal<Pedido[]>([]);
  actualizando = signal<Record<string, boolean>>({});
  hora         = signal(new Date());

  private subs = new Subscription();

  pendientes = computed(() =>
    this.pedidos()
      .filter((p) => p.tipo === TipoPedido.Domicilio && p.estado === EstadoPedido.Enviado)
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()),
  );

  entregados = computed(() => {
    const hoy = new Date().toDateString();
    return this.pedidos()
      .filter(
        (p) =>
          p.tipo === TipoPedido.Domicilio &&
          p.estado === EstadoPedido.Entregado &&
          new Date(p.updatedAt).toDateString() === hoy,
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  });

  horaActual = computed(() =>
    this.hora().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );

  readonly totalItems = (acc: number, item: { cantidad: number }) => acc + item.cantidad;

  ngOnInit(): void {
    this.cargar();
    this.subs.add(
      interval(12000)
        .pipe(switchMap(() => this.http.get<Pedido[]>(`${environment.apiUrl}/orders`)))
        .subscribe((p) => this.pedidos.set(p)),
    );
    this.subs.add(interval(1000).subscribe(() => this.hora.set(new Date())));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.http.get<Pedido[]>(`${environment.apiUrl}/orders`).subscribe({
      next: (p) => {
        this.pedidos.set(p);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  tiempoTranscurrido(fecha: string): string {
    const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (mins < 1) return 'menos de 1 min';
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  marcarEntregado(pedido: Pedido): void {
    this.actualizando.update((m) => ({ ...m, [pedido.id]: true }));
    this.http
      .patch<Pedido>(`${environment.apiUrl}/orders/${pedido.id}/status`, {
        estado: EstadoPedido.Entregado,
      })
      .subscribe({
        next: (u) => {
          this.pedidos.update((l) => l.map((p) => (p.id === u.id ? u : p)));
          this.actualizando.update((m) => ({ ...m, [pedido.id]: false }));
        },
        error: () => this.actualizando.update((m) => ({ ...m, [pedido.id]: false })),
      });
  }
}
