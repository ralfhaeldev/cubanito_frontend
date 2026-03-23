import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import { FormProducto } from '../form-producto/form-producto';
import { Producto, TipoProducto, ItemInventario } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [CopPipe, DecimalPipe, FormProducto],
  template: `
    <div class="flex flex-col h-full">

      <!-- Header -->
      <div class="px-6 pt-6 pb-4 bg-white border-b border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="font-display font-bold text-xl text-gray-900">Productos</h1>
            <p class="text-sm text-gray-400 mt-0.5">
              {{ productosFiltrados().length }} producto{{ productosFiltrados().length !== 1 ? 's' : '' }}
              · {{ activos() }} activo{{ activos() !== 1 ? 's' : '' }}
            </p>
          </div>
          <button class="btn-primary gap-2" (click)="abrirFormNuevo()">
            <span class="material-symbols-outlined text-base">add</span>
            Nuevo producto
          </button>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-40">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
            <input type="text" class="input pl-9 text-sm" placeholder="Buscar producto..."
              [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" />
          </div>

          <div class="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            <button (click)="filtroTipo.set('todos')"
              [class]="filtroTipo() === 'todos'
                ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-900 shadow-sm transition-all'
                : 'px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 transition-all'">
              Todos
            </button>
            <button (click)="filtroTipo.set(TipoProducto.Preparado)"
              [class]="filtroTipo() === TipoProducto.Preparado
                ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-900 shadow-sm transition-all'
                : 'px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 transition-all'">
              Preparados
            </button>
            <button (click)="filtroTipo.set(TipoProducto.Simple)"
              [class]="filtroTipo() === TipoProducto.Simple
                ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-900 shadow-sm transition-all'
                : 'px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 transition-all'">
              Directos
            </button>
          </div>

          <button (click)="verInactivos.set(!verInactivos())"
            [class]="verInactivos()
              ? 'btn-ghost btn-sm gap-1.5 text-brand'
              : 'btn-ghost btn-sm gap-1.5 text-gray-400'">
            <span class="material-symbols-outlined text-sm">
              {{ verInactivos() ? 'visibility' : 'visibility_off' }}
            </span>
            Inactivos
          </button>
        </div>
      </div>

      <!-- Lista -->
      <div class="flex-1 overflow-y-auto">
        @if (cargando()) {
          <div class="p-6 space-y-2">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
            }
          </div>

        } @else if (productosFiltrados().length === 0) {
          <div class="flex flex-col items-center justify-center py-24">
            <span class="material-symbols-outlined text-5xl mb-3 text-gray-200">lunch_dining</span>
            <p class="font-medium text-gray-500">Sin productos</p>
            <p class="text-sm text-gray-400 mt-1">
              {{ busqueda() ? 'Sin resultados para "' + busqueda() + '"' : 'Crea el primer producto' }}
            </p>
          </div>

        } @else {
          <div class="px-6 py-4 space-y-2">
            @for (p of productosFiltrados(); track p.id) {
              <div [class]="p.activo
                ? 'bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all px-4 py-3.5 flex items-center gap-4'
                : 'bg-gray-50 rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-4 opacity-55'">

                <!-- Ícono tipo -->
                <div [class]="p.tipo === TipoProducto.Preparado
                  ? 'w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0'
                  : 'w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0'">
                  <span [class]="p.tipo === TipoProducto.Preparado
                    ? 'material-symbols-outlined text-orange-500'
                    : 'material-symbols-outlined text-blue-500'">
                    {{ p.tipo === TipoProducto.Preparado ? 'cooking' : 'inventory_2' }}
                  </span>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <p class="font-semibold text-gray-900 text-sm">{{ p.nombre }}</p>

                    <span [class]="p.tipo === TipoProducto.Preparado
                      ? 'badge bg-orange-50 text-orange-600 ring-1 ring-orange-200 text-[10px]'
                      : 'badge bg-blue-50 text-blue-600 ring-1 ring-blue-200 text-[10px]'">
                      {{ p.tipo === TipoProducto.Preparado ? 'Preparado' : 'Directo' }}
                    </span>

                    @if (!p.activo) {
                      <span class="badge bg-gray-100 text-gray-400 ring-1 ring-gray-200 text-[10px]">inactivo</span>
                    }

                    <!-- Stock para directos -->
                    @if (p.tipo === TipoProducto.Simple && p.itemInventarioId) {
                      @let stock = stockItem(p.itemInventarioId);
                      <span [class]="stock <= 0
                        ? 'badge bg-red-50 text-red-600 ring-1 ring-red-200 text-[10px]'
                        : 'badge bg-gray-100 text-gray-500 text-[10px]'">
                        <span class="material-symbols-outlined text-[10px] mr-0.5">inventory</span>
                        {{ stock | number:'1.0-0' }} en stock
                      </span>
                    }

                    <!-- Ingredientes count para preparados -->
                    @if (p.tipo === TipoProducto.Preparado && p.ingredientes?.length) {
                      <span class="badge bg-gray-100 text-gray-400 text-[10px]">
                        {{ p.ingredientes!.length }} ingrediente{{ p.ingredientes!.length !== 1 ? 's' : '' }}
                      </span>
                    }
                  </div>

                  <div class="flex items-center gap-3">
                    <span class="text-xs text-gray-500">
                      Venta <span class="font-semibold text-gray-700">{{ p.precioVenta | cop }}</span>
                    </span>
                    <span class="text-gray-200">·</span>
                    <span class="text-xs text-gray-500">
                      Costo <span class="font-semibold text-gray-600">{{ p.precioCompra | cop }}</span>
                    </span>
                    <span class="text-gray-200">·</span>
                    <span [class]="'text-xs font-bold ' + margenClass(p)">
                      {{ calcMargen(p) | number:'1.0-1' }}% margen
                    </span>
                  </div>
                </div>

                <!-- Acciones -->
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
                           hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    (click)="editar(p)" title="Editar">
                    <span class="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    [class]="p.activo
                      ? 'text-gray-400 hover:bg-red-50 hover:text-red-500'
                      : 'text-gray-400 hover:bg-green-50 hover:text-green-600'"
                    (click)="toggleActivo(p)"
                    [title]="p.activo ? 'Desactivar' : 'Activar'">
                    <span class="material-symbols-outlined text-base">
                      {{ p.activo ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>

              </div>
            }
          </div>
          <div class="h-6"></div>
        }
      </div>
    </div>

    @if (mostrarForm()) {
      <app-form-producto
        [productoEditar]="productoEditando()"
        (cerrar)="cerrarForm()"
        (guardado)="onGuardado($event)"
      />
    }
  `,
})
export class ListaProductos implements OnInit {
  private http = inject(HttpClient);

  readonly TipoProducto = TipoProducto;

  cargando         = signal(true);
  productos        = signal<Producto[]>([]);
  inventario       = signal<ItemInventario[]>([]);
  busqueda         = signal('');
  filtroTipo       = signal<'todos' | TipoProducto>('todos');
  verInactivos     = signal(false);
  mostrarForm      = signal(false);
  productoEditando = signal<Producto | null>(null);

  activos = computed(() => this.productos().filter((p) => p.activo).length);

  productosFiltrados = computed(() => {
    const q    = this.busqueda().toLowerCase().trim();
    const tipo = this.filtroTipo();
    let lista  = this.productos();
    if (!this.verInactivos()) lista = lista.filter((p) => p.activo);
    if (tipo !== 'todos')     lista = lista.filter((p) => p.tipo === tipo);
    if (q)                    lista = lista.filter((p) => p.nombre.toLowerCase().includes(q));
    return lista;
  });

  ngOnInit(): void {
    Promise.all([
      this.http.get<Producto[]>(`${environment.apiUrl}/product`).toPromise(),
      this.http.get<ItemInventario[]>(`${environment.apiUrl}/inventory`).toPromise(),
    ]).then(([productos, inventario]) => {
      this.productos.set(productos ?? []);
      this.inventario.set(inventario ?? []);
      this.cargando.set(false);
    }).catch(() => this.cargando.set(false));
  }

  stockItem(itemId: string): number {
    return this.inventario().find((i) => i.id === itemId)?.stockActual ?? 0;
  }

  calcMargen(p: Producto): number {
    if (!p.precioVenta) return 0;
    return ((p.precioVenta - p.precioCompra) / p.precioVenta) * 100;
  }

  margenClass(p: Producto): string {
    const m = this.calcMargen(p);
    if (m >= 40) return 'text-green-600';
    if (m >= 20) return 'text-amber-500';
    return 'text-red-500';
  }

  abrirFormNuevo(): void { this.productoEditando.set(null); this.mostrarForm.set(true); }
  editar(p: Producto): void { this.productoEditando.set(p); this.mostrarForm.set(true); }
  cerrarForm(): void { this.mostrarForm.set(false); this.productoEditando.set(null); }

  toggleActivo(p: Producto): void {
    this.http.patch<Producto>(`${environment.apiUrl}/product/${p.id}`, { activo: !p.activo })
      .subscribe((u) => this.productos.update((list) => list.map((x) => x.id === u.id ? u : x)));
  }

  onGuardado(p: Producto): void {
    const existe = this.productos().some((x) => x.id === p.id);
    if (existe) {
      this.productos.update((list) => list.map((x) => x.id === p.id ? p : x));
    } else {
      this.productos.update((list) => [p, ...list]);
    }
    this.cerrarForm();
  }
}
