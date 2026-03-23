import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { SocketService } from '../../../../core/websocket/socket.service';
import { BadgeEstadoComponent } from '../../../../shared/components/badge-estado/badge-estado.component';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import { FormPedido } from '../form-pedido/form-pedido';
import { Pedido, EstadoPedido, TipoPedido, Rol } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';
import { DetallePedido } from '../detalle-pedido/detalle-pedido';

type TabId = 'activos' | 'todos' | 'domicilios' | 'finalizados';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'activos', label: 'Activos', icon: 'pending_actions' },
  { id: 'todos', label: 'Todos', icon: 'list' },
  { id: 'domicilios', label: 'Domicilios', icon: 'delivery_dining' },
  { id: 'finalizados', label: 'Finalizados', icon: 'check_circle' },
];

const ESTADOS_ACTIVOS = [
  EstadoPedido.Pendiente,
  EstadoPedido.EnProceso,
  EstadoPedido.Enviado,
  EstadoPedido.Entregado,
];

@Component({
  selector: 'app-lista-pedidos',
  standalone: true,
  imports: [DatePipe, BadgeEstadoComponent, CopPipe, DetallePedido, FormPedido],
  template: `
    <div class="flex flex-col h-full">
      <!-- Header de página -->
      <div class="px-6 pt-6 pb-0 bg-white border-b border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="font-display font-bold text-xl text-gray-900">Pedidos</h1>
            <p class="text-sm text-gray-400 mt-0.5">
              {{ pedidosFiltrados().length }} pedido{{ pedidosFiltrados().length !== 1 ? 's' : '' }}
              @if (hayNuevo()) {
                <span
                  class="ml-2 inline-flex items-center gap-1 text-xs text-green-600 font-medium"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  nuevo
                </span>
              }
            </p>
          </div>

          <!-- Botón nuevo pedido (mesero / admin) -->
          @if (puedeCrear()) {
            <button class="btn-primary gap-2" (click)="abrirFormNuevo()">
              <span class="material-symbols-outlined text-base">add</span>
              Nuevo pedido
            </button>
          }
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 -mb-px">
          @for (tab of tabsVisibles(); track tab.id) {
            <button
              (click)="tabActivo.set(tab.id)"
              [class]="
                tabActivo() === tab.id
                  ? 'flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-brand border-b-2 border-brand transition-all'
                  : 'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 transition-all'
              "
            >
              <span class="material-symbols-outlined text-base">{{ tab.icon }}</span>
              {{ tab.label }}
              @if (conteoTab(tab.id) > 0) {
                <span
                  [class]="
                    tabActivo() === tab.id
                      ? 'min-w-[18px] h-[18px] rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center px-1'
                      : 'min-w-[18px] h-[18px] rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center px-1'
                  "
                >
                  {{ conteoTab(tab.id) }}
                </span>
              }
            </button>
          }
        </div>
      </div>

      <!-- Filtros rápidos de estado (solo tab Todos) -->
      @if (tabActivo() === 'todos') {
        <div
          class="px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-2 overflow-x-auto"
        >
          <button
            (click)="filtroEstado.set(null)"
            [class]="
              !filtroEstado()
                ? 'badge bg-gray-900 text-white'
                : 'badge bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors'
            "
          >
            Todos
          </button>
          @for (estado of estadosDisponibles; track estado.value) {
            <button
              (click)="filtroEstado.set(filtroEstado() === estado.value ? null : estado.value)"
              [class]="
                filtroEstado() === estado.value
                  ? estado.activeClass
                  : 'badge bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors'
              "
            >
              {{ estado.label }}
            </button>
          }
        </div>
      }

      <!-- Lista -->
      <div class="flex-1 overflow-y-auto">
        @if (cargando()) {
          <div class="p-6 space-y-3">
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <div class="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
            }
          </div>
        } @else if (pedidosFiltrados().length === 0) {
          <div class="flex flex-col items-center justify-center py-24 text-gray-400">
            <span class="material-symbols-outlined text-5xl mb-3">receipt_long</span>
            <p class="font-medium text-gray-500">Sin pedidos</p>
            <p class="text-sm mt-1">{{ mensajeVacio() }}</p>
          </div>
        } @else {
          <div class="p-4 space-y-2">
            @for (pedido of pedidosFiltrados(); track pedido.id) {
              <div
                class="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-card-md
                       transition-all cursor-pointer group"
                [class.ring-2]="pedidoSeleccionado()?.id === pedido.id"
                [class.ring-brand]="pedidoSeleccionado()?.id === pedido.id"
                [class.border-brand]="pedidoSeleccionado()?.id === pedido.id"
                (click)="seleccionar(pedido)"
              >
                <div class="flex items-start gap-4 px-4 py-3.5">
                  <!-- Ícono tipo -->
                  <div
                    [class]="
                      pedido.tipo === 'domicilio'
                        ? 'w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5'
                        : 'w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 mt-0.5'
                    "
                  >
                    <span
                      [class]="
                        pedido.tipo === 'domicilio'
                          ? 'material-symbols-outlined text-indigo-500'
                          : 'material-symbols-outlined text-orange-500'
                      "
                    >
                      {{ pedido.tipo === 'domicilio' ? 'delivery_dining' : 'restaurant' }}
                    </span>
                  </div>

                  <!-- Info principal -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-mono text-sm font-bold text-gray-800">
                        #{{ pedido.id.slice(-6).toUpperCase() }}
                      </span>
                      <app-badge-estado [estado]="pedido.estado" />
                      @if (esNuevo(pedido)) {
                        <span class="badge bg-green-100 text-green-700">nuevo</span>
                      }
                    </div>

                    <!-- Items resumidos -->
                    <p class="text-xs text-gray-500 truncate">
                      {{ pedido.items.map(i => i.cantidad + '× ' + i.productoNombre).join(' · ') }}
                    </p>

                    <!-- Domicilio info -->
                    @if (pedido.tipo === TipoPedido.Domicilio && pedido.clienteDomicilio) {
                      <p class="text-xs text-indigo-600 mt-0.5 truncate">
                        <span class="material-symbols-outlined text-[11px] align-middle mr-0.5"
                          >location_on</span
                        >
                        {{ pedido.clienteDomicilio.nombre }} ·
                        {{ pedido.clienteDomicilio.direccion }}
                      </p>
                    }
                  </div>

                  <!-- Total + hora -->
                  <div class="text-right shrink-0 flex flex-col items-end gap-1">
                    <span class="font-display font-bold text-gray-900">{{
                      pedido.total | cop
                    }}</span>
                    <span class="text-xs text-gray-400">{{
                      pedido.createdAt | date: 'HH:mm'
                    }}</span>
                  </div>

                  <!-- Arrow indicator -->
                  <span
                    class="material-symbols-outlined text-gray-300 group-hover:text-gray-400 transition-colors self-center ml-1"
                  >
                    chevron_right
                  </span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Panel detalle (slide-in) -->
    @if (pedidoSeleccionado()) {
      <app-detalle-pedido
        [pedido]="pedidoSeleccionado()!"
        (cerrar)="pedidoSeleccionado.set(null)"
        (updated)="onPedidoUpdated($event)"
      />
    }

    <!-- Modal nuevo pedido -->
    @if (mostrarFormNuevo()) {
      <app-form-pedido (cerrar)="mostrarFormNuevo.set(false)" (creado)="onPedidoCreado($event)" />
    }
  `,
})
export class ListaPedidos implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private socket = inject(SocketService);

  readonly TipoPedido = TipoPedido;

  cargando = signal(true);
  pedidos = signal<Pedido[]>([]);
  tabActivo = signal<TabId>('activos');
  filtroEstado = signal<EstadoPedido | null>(null);
  pedidoSeleccionado = signal<Pedido | null>(null);
  mostrarFormNuevo = signal(false);
  hayNuevo = signal(false);
  private nuevosIds = new Set<string>();
  private subs = new Subscription();

  estadosDisponibles = [
    {
      value: EstadoPedido.Pendiente,
      label: 'Pendiente',
      activeClass: 'badge-pendiente cursor-pointer',
    },
    {
      value: EstadoPedido.EnProceso,
      label: 'En proceso',
      activeClass: 'badge-en-proceso cursor-pointer',
    },
    { value: EstadoPedido.Enviado, label: 'Enviado', activeClass: 'badge-enviado cursor-pointer' },
    {
      value: EstadoPedido.Entregado,
      label: 'Entregado',
      activeClass: 'badge-entregado cursor-pointer',
    },
    {
      value: EstadoPedido.Finalizado,
      label: 'Finalizado',
      activeClass: 'badge-finalizado cursor-pointer',
    },
    {
      value: EstadoPedido.Rechazado,
      label: 'Rechazado',
      activeClass: 'badge-rechazado cursor-pointer',
    },
  ];

  // ─── Computed ─────────────────────────────────────────────────────────────

  tabsVisibles = computed(() => {
    const rol = this.auth.rol();
    if (rol === Rol.Mesero) return TABS.filter((t) => t.id !== 'finalizados');
    return TABS;
  });

  pedidosFiltrados = computed(() => {
    const tab = this.tabActivo();
    const estado = this.filtroEstado();
    let lista = this.pedidos();

    switch (tab) {
      case 'activos':
        lista = lista.filter((p) => ESTADOS_ACTIVOS.includes(p.estado));
        break;
      case 'domicilios':
        lista = lista.filter((p) => p.tipo === TipoPedido.Domicilio);
        break;
      case 'finalizados':
        lista = lista.filter((p) =>
          [EstadoPedido.Finalizado, EstadoPedido.Rechazado].includes(p.estado),
        );
        break;
    }

    if (tab === 'todos' && estado) {
      lista = lista.filter((p) => p.estado === estado);
    }

    return lista.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  conteoTab(id: TabId): number {
    switch (id) {
      case 'activos':
        return this.pedidos().filter((p) => ESTADOS_ACTIVOS.includes(p.estado)).length;
      case 'domicilios':
        return this.pedidos().filter(
          (p) => p.tipo === TipoPedido.Domicilio && ESTADOS_ACTIVOS.includes(p.estado),
        ).length;
      default:
        return 0;
    }
  }

  mensajeVacio = computed(() => {
    switch (this.tabActivo()) {
      case 'activos':
        return 'No hay pedidos en curso';
      case 'domicilios':
        return 'No hay domicilios activos';
      case 'finalizados':
        return 'Sin pedidos finalizados';
      default:
        return 'No hay pedidos';
    }
  });

  puedeCrear = computed(() => this.auth.hasRole(Rol.Mesero, Rol.AdminSede));

  esNuevo(pedido: Pedido): boolean {
    return this.nuevosIds.has(pedido.id);
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.cargarPedidos();

    // WebSocket: nuevo pedido
    this.subs.add(
      this.socket.pedidoNuevo$.subscribe(({ pedido }) => {
        this.pedidos.update((list) => [pedido, ...list]);
        this.nuevosIds.add(pedido.id);
        this.hayNuevo.set(true);
        setTimeout(() => {
          this.nuevosIds.delete(pedido.id);
          this.hayNuevo.set(false);
        }, 8000);
      }),
    );

    // WebSocket: cambio de estado
    this.subs.add(
      this.socket.pedidoEstado$.subscribe(({ pedidoId, estado }) => {
        this.pedidos.update((list) =>
          list.map((p) =>
            p.id === pedidoId
              ? { ...p, estado: estado as EstadoPedido, updatedAt: new Date().toISOString() }
              : p,
          ),
        );
        // Actualizar detalle si está abierto
        const sel = this.pedidoSeleccionado();
        if (sel?.id === pedidoId) {
          this.pedidoSeleccionado.update((p) =>
            p ? { ...p, estado: estado as EstadoPedido } : null,
          );
        }
      }),
    );
  }

  private cargarPedidos(): void {
    this.cargando.set(true);
    this.http.get<Pedido[]>(`${environment.apiUrl}/orders`).subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  // ─── Interacciones ────────────────────────────────────────────────────────

  seleccionar(pedido: Pedido): void {
    this.pedidoSeleccionado.set(pedido);
  }

  abrirFormNuevo(): void {
    this.mostrarFormNuevo.set(true);
  }

  onPedidoCreado(pedido: Pedido): void {
    this.pedidos.update((list) => [pedido, ...list]);
    this.mostrarFormNuevo.set(false);
    this.tabActivo.set('activos');
    this.seleccionar(pedido);
  }

  onPedidoUpdated(pedido: Pedido): void {
    this.pedidos.update((list) => list.map((p) => (p.id === pedido.id ? pedido : p)));
    this.pedidoSeleccionado.set(pedido);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
