import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import { Pedido, EstadoPedido, TipoPedido } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-vista-domiciliario',
  standalone: true,
  imports: [DatePipe, CopPipe],
  template: `
    <div class="flex flex-col h-full bg-gray-950">

      <!-- Header -->
      <div class="px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-indigo-400 text-xl">delivery_dining</span>
          </div>
          <div>
            <h1 class="font-display font-bold text-white text-lg leading-tight">Vista Domiciliario</h1>
            <p class="text-white/40 text-xs">
              {{ horaActual() }}
              @if (pendientes().length > 0) {
                · <span class="text-indigo-400 font-semibold">
                  {{ pendientes().length }} pendiente{{ pendientes().length !== 1 ? 's' : '' }}
                </span>
              } @else {
                · <span class="text-green-400 font-semibold">Sin pendientes ✓</span>
              }
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          @if (cargando()) {
            <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
          } @else {
            <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          }
          <span class="text-white/30 text-xs">En vivo</span>
        </div>
      </div>

      <!-- Dos paneles -->
      <div class="flex-1 overflow-hidden grid grid-cols-2 gap-4 p-4">

        <!-- Panel izq: Por entregar (Enviado) -->
        <div class="flex flex-col min-w-0">
          <div class="flex items-center justify-between px-4 py-2.5 rounded-xl border mb-3
                      bg-indigo-950/60 border-indigo-700/40">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span class="font-display font-bold text-sm text-indigo-300">Listos para entregar</span>
            </div>
            <span class="font-black text-xl leading-none text-indigo-300">{{ pendientes().length }}</span>
          </div>

          <div class="flex-1 overflow-y-auto space-y-3 pr-0.5">
            @if (cargando() && pendientes().length === 0) {
              @for (i of [1,2]; track i) {
                <div class="h-52 bg-white/5 rounded-2xl animate-pulse"></div>
              }
            }
            @if (!cargando() && pendientes().length === 0) {
              <div class="flex flex-col items-center justify-center py-20 text-white/20">
                <span class="material-symbols-outlined text-5xl mb-3">delivery_dining</span>
                <p class="text-sm font-medium">Sin domicilios pendientes</p>
                <p class="text-xs mt-1">Los pedidos listos aparecerán aquí</p>
              </div>
            }

            @for (pedido of pendientes(); track pedido.id) {
              <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all">

                <!-- Cabecera -->
                <div class="px-4 pt-4 pb-2">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-display font-black text-white text-xl leading-none">
                      #{{ pedido.id.slice(-6).toUpperCase() }}
                    </span>
                    <span class="text-white/30 text-xs">{{ pedido.updatedAt | date:'HH:mm' }}</span>
                  </div>
                  <p class="text-white/40 text-xs flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">schedule</span>
                    Esperando {{ tiempoTranscurrido(pedido.updatedAt) }}
                  </p>
                </div>

                <div class="mx-4 border-t border-white/10 my-2.5"></div>

                <!-- Cliente -->
                @if (pedido.clienteDomicilio) {
                  <div class="px-4 mb-3 space-y-2">
                    <div class="flex items-start gap-2.5">
                      <div class="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span class="text-xs font-bold text-indigo-300">
                          {{ pedido.clienteDomicilio.nombre[0].toUpperCase() }}
                        </span>
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-white">{{ pedido.clienteDomicilio.nombre }}</p>
                        <a [href]="'tel:' + pedido.clienteDomicilio.telefono"
                           class="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5">
                          <span class="material-symbols-outlined text-[11px]">call</span>
                          {{ pedido.clienteDomicilio.telefono }}
                        </a>
                      </div>
                    </div>

                    <div class="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3 py-2.5 flex items-start gap-2">
                      <span class="material-symbols-outlined text-indigo-400 text-sm mt-0.5 shrink-0">location_on</span>
                      <p class="text-sm text-indigo-200">{{ pedido.clienteDomicilio.direccion }}</p>
                    </div>
                  </div>
                }

                <!-- Items compactos -->
                <div class="px-4 pb-3">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-white/30 mb-1.5">Pedido</p>
                  <div class="space-y-1">
                    @for (item of pedido.items; track item.id) {
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/70 shrink-0">
                            {{ item.cantidad }}
                          </span>
                          <span class="text-xs text-white/60 truncate">{{ item.productoNombre }}</span>
                        </div>
                        <span class="text-xs text-white/40 shrink-0">{{ item.subtotal | cop }}</span>
                      </div>
                    }
                  </div>
                  <div class="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span class="text-xs text-white/40">Total</span>
                    <span class="text-sm font-bold text-white">{{ pedido.total | cop }}</span>
                  </div>
                </div>

                <!-- Acción -->
                <div class="px-4 pb-4">
                  <button
                    class="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                           bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm
                           transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    [disabled]="actualizando()[pedido.id]"
                    (click)="marcarEntregado(pedido)"
                  >
                    @if (actualizando()[pedido.id]) {
                      <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    } @else {
                      <span class="material-symbols-outlined text-[18px]">check_circle</span>
                    }
                    Marcar como entregado
                  </button>
                </div>

              </div>
            }
          </div>
        </div>

        <!-- Panel der: Entregados hoy -->
        <div class="flex flex-col min-w-0">
          <div class="flex items-center justify-between px-4 py-2.5 rounded-xl border mb-3
                      bg-green-950/40 border-green-800/30">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-green-400"></span>
              <span class="font-display font-bold text-sm text-green-300">Entregados hoy</span>
            </div>
            <div class="text-right">
              <span class="font-black text-xl leading-none text-green-300">{{ entregados().length }}</span>
              @if (totalEntregado() > 0) {
                <p class="text-[10px] text-green-400/60">{{ totalEntregado() | cop }}</p>
              }
            </div>
          </div>

          <div class="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
            @if (entregados().length === 0) {
              <div class="flex flex-col items-center justify-center py-20 text-white/20">
                <span class="material-symbols-outlined text-5xl mb-3">history</span>
                <p class="text-sm">Sin entregas aún hoy</p>
              </div>
            }

            @for (pedido of entregados(); track pedido.id) {
              <div class="bg-green-950/20 border border-green-800/20 rounded-2xl px-4 py-3">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-green-400 text-sm">check</span>
                    </span>
                    <span class="font-display font-bold text-green-300">#{{ pedido.id.slice(-6).toUpperCase() }}</span>
                  </div>
                  <span class="text-xs text-green-400/50">{{ pedido.updatedAt | date:'HH:mm' }}</span>
                </div>

                @if (pedido.clienteDomicilio) {
                  <p class="text-xs text-green-300/60 mb-1.5 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[11px]">person</span>
                    {{ pedido.clienteDomicilio.nombre }}
                    <span class="mx-1 text-green-400/30">·</span>
                    <span class="material-symbols-outlined text-[11px]">location_on</span>
                    {{ pedido.clienteDomicilio.direccion }}
                  </p>
                }

                <div class="flex items-center justify-between">
                  <p class="text-xs text-green-300/40">
                    {{ pedido.items.length }} ítem{{ pedido.items.length !== 1 ? 's' : '' }}
                  </p>
                  <p class="text-sm font-bold text-green-300/70">{{ pedido.total | cop }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Resumen total -->
          @if (entregados().length > 0) {
            <div class="mt-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <p class="text-xs text-white/40">Total entregado</p>
                <p class="font-display font-black text-white text-lg">{{ totalEntregado() | cop }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-white/40">Entregas</p>
                <p class="font-display font-black text-white text-lg">{{ entregados().length }}</p>
              </div>
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class VistaDomiciliario implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  readonly TipoPedido = TipoPedido;

  cargando     = signal(true);
  pedidos      = signal<Pedido[]>([]);
  actualizando = signal<Record<string, boolean>>({});
  hora         = signal(new Date());

  private subs = new Subscription();

  // Domicilios listos para entregar
  pendientes = computed(() =>
    this.pedidos()
      .filter((p) => p.tipo === TipoPedido.Domicilio && p.estado === EstadoPedido.Enviado)
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()),
  );

  // Domicilios ya entregados hoy
  entregados = computed(() => {
    const hoy = new Date().toDateString();
    return this.pedidos()
      .filter((p) => p.tipo === TipoPedido.Domicilio
        && p.estado === EstadoPedido.Entregado
        && new Date(p.updatedAt).toDateString() === hoy)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  });

  totalEntregado = computed(() => this.entregados().reduce((s, p) => s + p.total, 0));

  horaActual = computed(() =>
    this.hora().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );

  ngOnInit(): void {
    this.cargar();
    this.subs.add(
      interval(12000)
        .pipe(switchMap(() => this.http.get<Pedido[]>(`${environment.apiUrl}/pedidos`)))
        .subscribe((p) => this.pedidos.set(p)),
    );
    this.subs.add(interval(1000).subscribe(() => this.hora.set(new Date())));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  private cargar(): void {
    this.cargando.set(true);
    this.http.get<Pedido[]>(`${environment.apiUrl}/pedidos`).subscribe({
      next:  (p) => { this.pedidos.set(p); this.cargando.set(false); },
      error: ()  => this.cargando.set(false),
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
      .patch<Pedido>(`${environment.apiUrl}/pedidos/${pedido.id}/estado`, { estado: EstadoPedido.Entregado })
      .subscribe({
        next:  (u) => { this.pedidos.update((l) => l.map((p) => p.id === u.id ? u : p)); this.actualizando.update((m) => ({ ...m, [pedido.id]: false })); },
        error: ()  => this.actualizando.update((m) => ({ ...m, [pedido.id]: false })),
      });
  }
}
