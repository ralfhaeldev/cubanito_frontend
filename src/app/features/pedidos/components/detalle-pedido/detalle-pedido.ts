import { Component, input, output, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { BadgeEstadoComponent } from '../../../../shared/components/badge-estado/badge-estado.component';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import { Pedido, EstadoPedido, TipoPedido, MetodoPago, Rol } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

interface PasoTimeline {
  estado: EstadoPedido;
  label: string;
  icon: string;
  soloModo: 'local' | 'domicilio' | 'ambos';
}

const TIMELINE: PasoTimeline[] = [
  { estado: EstadoPedido.Pendiente, label: 'Recibido', icon: 'pending', soloModo: 'ambos' },
  { estado: EstadoPedido.EnProceso, label: 'En cocina', icon: 'cooking', soloModo: 'ambos' },
  {
    estado: EstadoPedido.Enviado,
    label: 'En camino',
    icon: 'delivery_dining',
    soloModo: 'domicilio',
  },
  { estado: EstadoPedido.Entregado, label: 'Entregado', icon: 'check_circle', soloModo: 'ambos' },
  { estado: EstadoPedido.Finalizado, label: 'Finalizado', icon: 'payments', soloModo: 'ambos' },
];

const ORDEN_ESTADOS = [
  EstadoPedido.Pendiente,
  EstadoPedido.EnProceso,
  EstadoPedido.Enviado,
  EstadoPedido.Entregado,
  EstadoPedido.Finalizado,
  EstadoPedido.Rechazado,
];

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, BadgeEstadoComponent, CopPipe],
  template: `
    <!-- Overlay -->
    <div class="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" (click)="cerrar.emit()"></div>

    <!-- Panel -->
    <aside
      class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col
                  animate-[slideIn_0.22s_ease-out]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div
            [class]="
              pedido().tipo === 'domicilio'
                ? 'w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center'
                : 'w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center'
            "
          >
            <span
              [class]="
                pedido().tipo === 'domicilio'
                  ? 'material-symbols-outlined text-indigo-500'
                  : 'material-symbols-outlined text-orange-500'
              "
            >
              {{ pedido().tipo === 'domicilio' ? 'delivery_dining' : 'restaurant' }}
            </span>
          </div>
          <div>
            <p class="font-display font-bold text-gray-900 font-mono text-sm">
              #{{ pedido().id.slice(-6).toUpperCase() }}
            </p>
            <p class="text-xs text-gray-400">{{ pedido().createdAt | date: 'd MMM · HH:mm' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <app-badge-estado [estado]="pedido().estado" />
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            (click)="cerrar.emit()"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      <!-- Scroll body -->
      <div class="flex-1 overflow-y-auto">
        <!-- Timeline de estado -->
        @if (pedido().estado !== EstadoPedido.Rechazado) {
          <div class="px-5 py-4 border-b border-gray-100">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Estado del pedido
            </p>
            <div class="flex items-start gap-0">
              @for (paso of timelineVisible(); track paso.estado; let last = $last) {
                <div class="flex-1 flex flex-col items-center">
                  <!-- Icono -->
                  <div [class]="pasoClass(paso.estado)">
                    <span class="material-symbols-outlined text-sm">{{ paso.icon }}</span>
                  </div>
                  <!-- Línea conectora -->
                  @if (!last) {
                    <div class="hidden"></div>
                  }
                  <!-- Label -->
                  <p
                    [class]="
                      'text-[10px] mt-1.5 text-center font-medium ' +
                      (esActual(paso.estado)
                        ? 'text-brand'
                        : esPasado(paso.estado)
                          ? 'text-gray-500'
                          : 'text-gray-300')
                    "
                  >
                    {{ paso.label }}
                  </p>
                </div>
                @if (!last) {
                  <div
                    [class]="
                      'flex-1 h-px mt-4 ' + (esPasado(paso.estado) ? 'bg-brand' : 'bg-gray-200')
                    "
                  ></div>
                }
              }
            </div>
          </div>
        } @else {
          <div
            class="mx-5 my-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3"
          >
            <span class="material-symbols-outlined text-red-500">cancel</span>
            <p class="text-sm font-medium text-red-700">Pedido rechazado</p>
          </div>
        }

        <!-- Items del pedido -->
        <div class="px-5 py-4 border-b border-gray-100">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Productos
          </p>
          <div class="space-y-2">
            @for (item of pedido().items; track item.id) {
              <div class="flex items-center gap-3">
                <div
                  class="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"
                >
                  <span class="text-xs font-bold text-gray-500">{{ item.cantidad }}</span>
                </div>
                <span class="flex-1 text-sm text-gray-700">{{ item.productoNombre }}</span>
                <span class="text-sm font-semibold text-gray-900">{{ item.subtotal | cop }}</span>
              </div>
            }
          </div>
          <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span class="text-sm font-semibold text-gray-700">Total</span>
            <span class="font-display font-bold text-lg text-gray-900">{{
              pedido().total | cop
            }}</span>
          </div>
        </div>

        <!-- Info domicilio -->
        @if (pedido().tipo === TipoPedido.Domicilio && pedido().clienteDomicilio) {
          <div class="px-5 py-4 border-b border-gray-100">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Cliente
            </p>
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <span class="material-symbols-outlined text-gray-400 text-base">person</span>
                <span class="text-gray-700">{{ pedido().clienteDomicilio!.nombre }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <span class="material-symbols-outlined text-gray-400 text-base">call</span>
                <span class="text-gray-700">{{ pedido().clienteDomicilio!.telefono }}</span>
              </div>
              <div class="flex items-start gap-2 text-sm">
                <span class="material-symbols-outlined text-gray-400 text-base mt-0.5"
                  >location_on</span
                >
                <span class="text-gray-700">{{ pedido().clienteDomicilio!.direccion }}</span>
              </div>
            </div>
          </div>
        }

        <!-- Info mesero -->
        <div class="px-5 py-4 border-b border-gray-100">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Atendido por
          </p>
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-xs font-bold text-primary-700">{{ pedido().meseroNombre[0] }}</span>
            </div>
            <span class="text-sm text-gray-700">{{ pedido().meseroNombre }}</span>
          </div>
        </div>

        <!-- Formulario de pago (solo cuando Admin finaliza) -->
        @if (mostrarFormPago()) {
          <div class="px-5 py-4 bg-gray-50 border-b border-gray-100">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Registrar pago
            </p>
            <form [formGroup]="pagoForm" class="space-y-3">
              <!-- Método de pago -->
              <div>
                <label class="label">Método de pago</label>
                <div class="grid grid-cols-2 gap-2">
                  @for (m of metodosPago; track m.value) {
                    <button
                      type="button"
                      (click)="pagoForm.patchValue({ metodo: m.value })"
                      [class]="
                        pagoForm.get('metodo')?.value === m.value
                          ? 'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-brand bg-brand/5 text-brand text-sm font-medium transition-all'
                          : 'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-medium hover:border-gray-300 transition-all'
                      "
                    >
                      <span class="material-symbols-outlined text-base">{{ m.icon }}</span>
                      {{ m.label }}
                    </button>
                  }
                </div>
              </div>

              <!-- Monto recibido (solo efectivo) -->
              @if (pagoForm.get('metodo')?.value === 'efectivo') {
                <div>
                  <label class="label">Monto recibido</label>
                  <input
                    type="number"
                    formControlName="montoRecibido"
                    class="input"
                    placeholder="0"
                    min="0"
                  />
                </div>

                @if (vuelto() !== null) {
                  <div
                    [class]="
                      vuelto()! >= 0
                        ? 'rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex justify-between items-center'
                        : 'rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex justify-between items-center'
                    "
                  >
                    <span
                      [class]="
                        vuelto()! >= 0
                          ? 'text-sm font-medium text-green-700'
                          : 'text-sm font-medium text-red-700'
                      "
                    >
                      {{ vuelto()! >= 0 ? 'Vuelto' : 'Falta' }}
                    </span>
                    <span
                      [class]="
                        vuelto()! >= 0
                          ? 'font-display font-bold text-green-700'
                          : 'font-display font-bold text-red-700'
                      "
                    >
                      {{ (vuelto()! >= 0 ? vuelto()! : -vuelto()!) | cop }}
                    </span>
                  </div>
                }
              }
            </form>
          </div>
        }
      </div>

      <!-- Acciones por rol -->
      <div class="px-5 py-4 border-t border-gray-100 space-y-2">
        @if (cargando()) {
          <div class="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
        } @else {
          <!-- Cocina: Pendiente → En Proceso -->
          @if (puedeIniciar()) {
            <button
              class="btn-primary w-full gap-2"
              (click)="cambiarEstado(EstadoPedido.EnProceso)"
            >
              <span class="material-symbols-outlined text-base">cooking</span>
              Iniciar preparación
            </button>
          }

          <!-- Domiciliario: En Proceso → Enviado -->
          @if (puedeEnviar()) {
            <button class="btn-primary w-full gap-2" (click)="cambiarEstado(EstadoPedido.Enviado)">
              <span class="material-symbols-outlined text-base">delivery_dining</span>
              Marcar como enviado
            </button>
          }

          <!-- Admin: En Proceso / Enviado → Entregado -->
          @if (puedeEntregarAdmin()) {
            <button
              class="btn-secondary w-full gap-2"
              (click)="cambiarEstado(EstadoPedido.Entregado)"
            >
              <span class="material-symbols-outlined text-base">check_circle</span>
              Marcar como entregado
            </button>
          }

          <!-- Admin: Entregado → Finalizar con pago -->
          @if (puedeFinalizar()) {
            @if (!mostrarFormPago()) {
              <button class="btn-primary w-full gap-2" (click)="mostrarFormPago.set(true)">
                <span class="material-symbols-outlined text-base">payments</span>
                Cobrar y finalizar
              </button>
            } @else {
              <button
                class="btn-primary w-full gap-2"
                [disabled]="!pagoValido()"
                (click)="finalizarPedido()"
              >
                <span class="material-symbols-outlined text-base">check</span>
                Confirmar pago
              </button>
              <button class="btn-ghost w-full text-sm" (click)="mostrarFormPago.set(false)">
                Cancelar
              </button>
            }
          }

          <!-- Rechazar (admin, no finalizado/rechazado) -->
          @if (puedeRechazar()) {
            <button class="btn-danger w-full gap-2" (click)="rechazar()">
              <span class="material-symbols-outlined text-base">cancel</span>
              Rechazar pedido
            </button>
          }

          <!-- Estado final: sin acciones -->
          @if (esEstadoFinal()) {
            <p class="text-xs text-center text-gray-400 py-1">No hay acciones disponibles</p>
          }
        }
      </div>
    </aside>
  `,
  styles: [
    `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `,
  ],
})
export class DetallePedido {
  readonly pedido = input.required<Pedido>();
  readonly cerrar = output<void>();
  readonly updated = output<Pedido>();

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  // Exponer enums al template
  readonly EstadoPedido = EstadoPedido;
  readonly TipoPedido = TipoPedido;

  cargando = signal(false);
  mostrarFormPago = signal(false);

  metodosPago = [
    { value: MetodoPago.Efectivo, label: 'Efectivo', icon: 'payments' },
    { value: MetodoPago.Transferencia, label: 'Transferencia', icon: 'account_balance' },
  ];

  pagoForm = this.fb.group({
    metodo: [MetodoPago.Efectivo, Validators.required],
    montoRecibido: [null as number | null],
  });

  private pagoValues = toSignal(this.pagoForm.valueChanges, { initialValue: this.pagoForm.value });

  // ─── Timeline ─────────────────────────────────────────────────────────────

  timelineVisible = computed(() =>
    TIMELINE.filter(
      (p) =>
        p.soloModo === 'ambos' ||
        (p.soloModo === 'domicilio' && this.pedido().tipo === TipoPedido.Domicilio),
    ),
  );

  pasoClass(estado: EstadoPedido): string {
    const base = 'w-8 h-8 rounded-full flex items-center justify-center transition-all ';
    if (this.esActual(estado)) return base + 'bg-brand text-white ring-4 ring-brand/20';
    if (this.esPasado(estado)) return base + 'bg-brand/20 text-brand';
    return base + 'bg-gray-100 text-gray-300';
  }

  esActual(estado: EstadoPedido): boolean {
    return this.pedido().estado === estado;
  }

  esPasado(estado: EstadoPedido): boolean {
    const idxActual = ORDEN_ESTADOS.indexOf(this.pedido().estado);
    const idxPaso = ORDEN_ESTADOS.indexOf(estado);
    return idxPaso < idxActual;
  }

  // ─── Permisos por rol/estado ───────────────────────────────────────────────

  private get rol() {
    return this.auth.rol();
  }
  private get estado() {
    return this.pedido().estado;
  }

  puedeIniciar = computed(
    () => this.rol === Rol.Cocina && this.pedido().estado === EstadoPedido.Pendiente,
  );

  puedeEnviar = computed(
    () =>
      this.rol === Rol.Domiciliario &&
      this.pedido().tipo === TipoPedido.Domicilio &&
      this.pedido().estado === EstadoPedido.EnProceso,
  );

  puedeEntregarAdmin = computed(
    () =>
      this.rol === Rol.AdminSede &&
      [EstadoPedido.EnProceso, EstadoPedido.Enviado].includes(this.pedido().estado),
  );

  puedeFinalizar = computed(
    () => this.rol === Rol.AdminSede && this.pedido().estado === EstadoPedido.Entregado,
  );

  puedeRechazar = computed(
    () =>
      this.rol === Rol.AdminSede &&
      ![EstadoPedido.Finalizado, EstadoPedido.Rechazado].includes(this.pedido().estado),
  );

  esEstadoFinal = computed(
    () =>
      [EstadoPedido.Finalizado, EstadoPedido.Rechazado].includes(this.pedido().estado) &&
      this.rol !== Rol.AdminSede,
  );

  // ─── Vuelto ───────────────────────────────────────────────────────────────

  vuelto = computed(() => {
    const monto = this.pagoValues().montoRecibido;
    if (!monto) return null;
    return monto - this.pedido().total;
  });

  pagoValido = computed(() => {
    const { metodo, montoRecibido } = this.pagoValues();
    if (metodo === MetodoPago.Transferencia) return true;
    return montoRecibido !== null && montoRecibido !== undefined && montoRecibido >= this.pedido().total;
  });

  // ─── Acciones ─────────────────────────────────────────────────────────────

  cambiarEstado(nuevoEstado: EstadoPedido): void {
    this.cargando.set(true);
    this.http
      .patch<Pedido>(`${environment.apiUrl}/orders/${this.pedido().id}/status`, {
        estado: nuevoEstado,
      })
      .subscribe({
        next: (p) => {
          this.updated.emit(p);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  finalizarPedido(): void {
    if (!this.pagoValido()) return;
    this.cargando.set(true);
    const { metodo, montoRecibido } = this.pagoForm.value;
    this.http
      .post(`${environment.apiUrl}/orders/${this.pedido().id}/finalizar`, {
        metodo,
        monto: this.pedido().total,
        vuelto: metodo === MetodoPago.Efectivo ? montoRecibido! - this.pedido().total : 0,
      })
      .subscribe({
        next: () => {
          const pedidoFinalizado = { ...this.pedido(), estado: EstadoPedido.Finalizado };
          this.updated.emit(pedidoFinalizado);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  rechazar(): void {
    this.cambiarEstado(EstadoPedido.Rechazado);
  }
}
