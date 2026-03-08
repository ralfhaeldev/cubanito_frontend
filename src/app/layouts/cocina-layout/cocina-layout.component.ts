import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { SocketService } from '../../core/websocket/socket.service';
import { BadgeEstadoComponent } from '../../shared/components/badge-estado/badge-estado.component';
import { EstadoPedido, Pedido } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cocina-layout',
  standalone: true,
  imports: [BadgeEstadoComponent, DatePipe],
  template: `
    <div class="min-h-screen bg-gray-950 text-white font-sans">

      <!-- Header -->
      <header class="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div class="flex items-center gap-3">
          <span class="text-2xl">👨‍🍳</span>
          <span class="font-display font-bold text-xl">Cocina</span>
          <span class="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 rounded-full px-2.5 py-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            En vivo
          </span>
        </div>
        <button class="btn-ghost text-gray-400 hover:text-white text-sm" (click)="logout()">
          Salir →
        </button>
      </header>

      <!-- Grid -->
      <div class="p-6">
        @if (pedidos().length === 0) {
          <div class="text-center py-24 text-gray-600">
            <p class="text-5xl mb-4">🍽️</p>
            <p class="text-lg font-medium">Sin pedidos en cola</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (pedido of pedidos(); track pedido.id) {
              <div class="bg-gray-900 rounded-xl border border-gray-800 p-4 flex flex-col gap-3">

                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500 font-mono">#{{ pedido.id.slice(-6).toUpperCase() }}</span>
                  <app-badge-estado [estado]="pedido.estado" />
                </div>

                <div class="flex items-center gap-1.5 text-sm">
                  <span>{{ pedido.tipo === 'domicilio' ? '🛵' : '🪑' }}</span>
                  <span class="capitalize text-gray-300">{{ pedido.tipo }}</span>
                </div>

                <ul class="space-y-1">
                  @for (item of pedido.items; track item.id) {
                    <li class="flex justify-between text-sm">
                      <span class="text-gray-300">{{ item.productoNombre }}</span>
                      <span class="text-gray-500 font-mono">× {{ item.cantidad }}</span>
                    </li>
                  }
                </ul>

                <p class="text-xs text-gray-600">{{ pedido.createdAt | date:'HH:mm' }}</p>

                @if (pedido.estado === 'pendiente') {
                  <button class="btn-primary w-full mt-auto" (click)="iniciarPreparacion(pedido)">
                    Iniciar preparación
                  </button>
                }

              </div>
            }
          </div>
        }
      </div>

    </div>
  `,
})
export class CocinaLayoutComponent implements OnInit, OnDestroy {
  private auth   = inject(AuthService);
  private socket = inject(SocketService);
  private http   = inject(HttpClient);

  pedidos = signal<Pedido[]>([]);
  private subs = new Subscription();

  ngOnInit(): void {
    this.http
      .get<Pedido[]>(`${environment.apiUrl}/pedidos/activos`)
      .subscribe((data) => this.pedidos.set(data));

    this.socket.connect();

    this.subs.add(
      this.socket.pedidoNuevo$.subscribe(({ pedido }) =>
        this.pedidos.update((list) => [pedido, ...list]),
      ),
    );

    this.subs.add(
      this.socket.pedidoEstado$.subscribe(({ pedidoId, estado }) =>
        this.pedidos.update((list) =>
          list
            .map((p) => (p.id === pedidoId ? { ...p, estado: estado as EstadoPedido } : p))
            .filter((p) => ![EstadoPedido.Finalizado, EstadoPedido.Rechazado].includes(p.estado)),
        ),
      ),
    );
  }

  iniciarPreparacion(pedido: Pedido): void {
    this.http
      .patch(`${environment.apiUrl}/pedidos/${pedido.id}/estado`, { estado: EstadoPedido.EnProceso })
      .subscribe();
  }

  logout(): void {
    this.socket.disconnect();
    this.auth.logout();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
