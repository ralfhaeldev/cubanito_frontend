import {
  Component, output, inject, signal, computed,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import {
  Producto, Pedido, TipoPedido,
  EstadoPedido, PedidoItem,
} from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

interface ItemCarrito {
  producto:  Producto;
  cantidad:  number;
  subtotal:  number;
}

@Component({
  selector: 'app-form-pedido',
  standalone: true,
  imports: [ReactiveFormsModule, CopPipe],
  template: `
    <!-- Overlay -->
    <div
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
      (click)="cerrar.emit()"
    ></div>

    <!-- Modal -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col
                  animate-[scaleIn_0.18s_ease-out]">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="font-display font-bold text-gray-900 text-lg">Nuevo pedido</h2>
            <p class="text-xs text-gray-400 mt-0.5">Selecciona productos y tipo de pedido</p>
          </div>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            (click)="cerrar.emit()"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <!-- Body: dos columnas -->
        <div class="flex-1 overflow-hidden flex">

          <!-- Izquierda: catálogo de productos -->
          <div class="flex-1 flex flex-col border-r border-gray-100 overflow-hidden">
            <div class="px-4 pt-4 pb-2">
              <!-- Buscador -->
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                <input
                  type="text"
                  class="input pl-9 text-sm"
                  placeholder="Buscar producto..."
                  [value]="busqueda()"
                  (input)="busqueda.set($any($event.target).value)"
                />
              </div>
            </div>

            <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
              @for (producto of productosFiltrados(); track producto.id) {
                <button
                  type="button"
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left group"
                  (click)="agregarProducto(producto)"
                >
                  <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-orange-400 text-base">lunch_dining</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">{{ producto.nombre }}</p>
                    <p class="text-xs text-gray-400">{{ producto.precioVenta | cop }}</p>
                  </div>
                  <span class="material-symbols-outlined text-gray-300 group-hover:text-brand transition-colors">add_circle</span>
                </button>
              } @empty {
                <div class="text-center py-10 text-gray-400">
                  <span class="material-symbols-outlined text-3xl block mb-2">search_off</span>
                  <p class="text-sm">Sin resultados</p>
                </div>
              }
            </div>
          </div>

          <!-- Derecha: carrito + form -->
          <div class="w-64 flex flex-col overflow-hidden">

            <!-- Carrito -->
            <div class="flex-1 overflow-y-auto px-4 pt-4 space-y-2">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Pedido ({{ totalItems() }} ítem{{ totalItems() !== 1 ? 's' : '' }})
              </p>

              @if (carrito().length === 0) {
                <div class="text-center py-8 text-gray-300">
                  <span class="material-symbols-outlined text-4xl block mb-2">shopping_cart</span>
                  <p class="text-xs">Agrega productos</p>
                </div>
              }

              @for (item of carrito(); track item.producto.id) {
                <div class="flex items-center gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-gray-700 truncate">{{ item.producto.nombre }}</p>
                    <p class="text-xs text-gray-400">{{ item.subtotal | cop }}</p>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      class="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      (click)="decrementar(item)"
                    >
                      <span class="material-symbols-outlined text-sm text-gray-600">remove</span>
                    </button>
                    <span class="w-5 text-center text-sm font-semibold text-gray-800">{{ item.cantidad }}</span>
                    <button
                      type="button"
                      class="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      (click)="agregarProducto(item.producto)"
                    >
                      <span class="material-symbols-outlined text-sm text-gray-600">add</span>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Total + tipo de pedido -->
            <div class="px-4 pb-4 pt-3 border-t border-gray-100 space-y-3">

              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">Total</span>
                <span class="font-display font-bold text-gray-900">{{ totalPedido() | cop }}</span>
              </div>

              <!-- Tipo de pedido -->
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Tipo</p>
                <div class="grid grid-cols-2 gap-1.5">
                  @for (tipo of tiposPedido; track tipo.value) {
                    <button
                      type="button"
                      (click)="tipoSeleccionado.set(tipo.value)"
                      [class]="tipoSeleccionado() === tipo.value
                        ? 'flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 border-brand bg-brand/5 text-brand text-xs font-medium transition-all'
                        : 'flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 border-gray-200 text-gray-500 text-xs font-medium hover:border-gray-300 transition-all'"
                    >
                      <span class="material-symbols-outlined text-sm">{{ tipo.icon }}</span>
                      {{ tipo.label }}
                    </button>
                  }
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Form datos domicilio -->
        @if (tipoSeleccionado() === TipoPedido.Domicilio) {
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Datos del cliente</p>
            <form [formGroup]="clienteForm" class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="label">Nombre</label>
                <input type="text" formControlName="nombre" class="input text-sm" placeholder="Nombre completo" />
              </div>
              <div>
                <label class="label">Teléfono</label>
                <input type="tel" formControlName="telefono" class="input text-sm" placeholder="300 000 0000" />
              </div>
              <div>
                <label class="label">Dirección</label>
                <input type="text" formControlName="direccion" class="input text-sm" placeholder="Cra 45 #23-10" />
              </div>
            </form>
          </div>
        }

        <!-- Footer con acción -->
        <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button class="btn-ghost" (click)="cerrar.emit()">Cancelar</button>
          <button
            class="btn-primary gap-2"
            [disabled]="!formularioValido() || guardando()"
            (click)="guardar()"
          >
            @if (guardando()) {
              <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            } @else {
              <span class="material-symbols-outlined text-base">receipt_long</span>
            }
            Crear pedido
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to   { transform: scale(1);    opacity: 1; }
    }
  `],
})
export class FormPedido {
  readonly cerrar  = output<void>();
  readonly creado  = output<Pedido>();

  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  readonly TipoPedido = TipoPedido;

  // Estado
  productos       = signal<Producto[]>([]);
  carrito         = signal<ItemCarrito[]>([]);
  busqueda        = signal('');
  tipoSeleccionado = signal<TipoPedido>(TipoPedido.Local);
  guardando       = signal(false);

  tiposPedido = [
    { value: TipoPedido.Local,     label: 'Local',     icon: 'restaurant'      },
    { value: TipoPedido.Domicilio, label: 'Domicilio', icon: 'delivery_dining' },
  ];

  clienteForm = this.fb.group({
    nombre:   ['', Validators.required],
    telefono: ['', Validators.required],
    direccion: ['', Validators.required],
  });

  constructor() {
    this.http
      .get<Producto[]>(`${environment.apiUrl}/productos`)
      .subscribe((p) => this.productos.set(p.filter((x) => x.activo)));
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  productosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    return q
      ? this.productos().filter((p) => p.nombre.toLowerCase().includes(q))
      : this.productos();
  });

  totalItems  = computed(() => this.carrito().reduce((s, i) => s + i.cantidad, 0));
  totalPedido = computed(() => this.carrito().reduce((s, i) => s + i.subtotal, 0));

  formularioValido = computed(() => {
    if (this.carrito().length === 0) return false;
    if (this.tipoSeleccionado() === TipoPedido.Domicilio) {
      return this.clienteForm.valid;
    }
    return true;
  });

  // ─── Carrito ──────────────────────────────────────────────────────────────

  agregarProducto(producto: Producto): void {
    this.carrito.update((items) => {
      const idx = items.findIndex((i) => i.producto.id === producto.id);
      if (idx >= 0) {
        return items.map((i, index) => index === idx
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * producto.precioVenta }
          : i,
        );
      }
      return [...items, { producto, cantidad: 1, subtotal: producto.precioVenta }];
    });
  }

  decrementar(item: ItemCarrito): void {
    this.carrito.update((items) => {
      if (item.cantidad === 1) return items.filter((i) => i.producto.id !== item.producto.id);
      return items.map((i) => i.producto.id === item.producto.id
        ? { ...i, cantidad: i.cantidad - 1, subtotal: (i.cantidad - 1) * i.producto.precioVenta }
        : i,
      );
    });
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  guardar(): void {
    if (!this.formularioValido()) return;
    this.guardando.set(true);

    const items: PedidoItem[] = this.carrito().map((i, idx) => ({
      id:             `item-${idx}`,
      productoId:     i.producto.id,
      productoNombre: i.producto.nombre,
      cantidad:       i.cantidad,
      precioUnitario: i.producto.precioVenta,
      subtotal:       i.subtotal,
    }));

    const body: Partial<Pedido> = {
      tipo:  this.tipoSeleccionado(),
      items,
      clienteDomicilio: this.tipoSeleccionado() === TipoPedido.Domicilio
        ? {
            nombre:    this.clienteForm.value.nombre!,
            telefono:  this.clienteForm.value.telefono!,
            direccion: this.clienteForm.value.direccion!,
          }
        : undefined,
    };

    this.http.post<Pedido>(`${environment.apiUrl}/pedidos`, body).subscribe({
      next:  (p) => { this.creado.emit(p); this.guardando.set(false); },
      error: ()  => this.guardando.set(false),
    });
  }
}
