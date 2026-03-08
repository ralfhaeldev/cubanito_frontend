import {
  Component, OnInit, inject, signal, computed,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import { FormProducto } from '../form-producto/form-producto';
import { Producto } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

type Vista   = 'grid' | 'tabla';
type FiltroActivo = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [CopPipe, FormProducto, DecimalPipe],
  template: `
    <div class="flex flex-col h-full">

      <!-- Header -->
      <div class="px-6 pt-6 pb-4 bg-white border-b border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="font-display font-bold text-xl text-gray-900">Productos</h1>
            <p class="text-sm text-gray-400 mt-0.5">
              {{ productosFiltrados().length }} producto{{ productosFiltrados().length !== 1 ? 's' : '' }}
              · {{ productosActivos().length }} activos
            </p>
          </div>
          <button class="btn-primary gap-2" (click)="abrirFormNuevo()">
            <span class="material-symbols-outlined text-base">add</span>
            Nuevo producto
          </button>
        </div>

        <!-- Controles: búsqueda + filtros + vista -->
        <div class="flex items-center gap-3 flex-wrap">

          <!-- Buscador -->
          <div class="relative flex-1 min-w-48">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
            <input
              type="text"
              class="input pl-9 text-sm"
              placeholder="Buscar producto..."
              [value]="busqueda()"
              (input)="busqueda.set($any($event.target).value)"
            />
          </div>

          <!-- Filtro activo -->
          <div class="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            @for (f of filtros; track f.value) {
              <button
                (click)="filtroActivo.set(f.value)"
                [class]="filtroActivo() === f.value
                  ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-900 shadow-sm transition-all'
                  : 'px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 transition-all'"
              >
                {{ f.label }}
              </button>
            }
          </div>

          <!-- Toggle vista -->
          <div class="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            <button
              (click)="vista.set('grid')"
              [class]="vista() === 'grid'
                ? 'w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-700 transition-all'
                : 'w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all'"
            >
              <span class="material-symbols-outlined text-base">grid_view</span>
            </button>
            <button
              (click)="vista.set('tabla')"
              [class]="vista() === 'tabla'
                ? 'w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-700 transition-all'
                : 'w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all'"
            >
              <span class="material-symbols-outlined text-base">table_rows</span>
            </button>
          </div>

        </div>
      </div>

      <!-- Contenido -->
      <div class="flex-1 overflow-y-auto p-6">

        @if (cargando()) {
          @if (vista() === 'grid') {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              @for (i of [1,2,3,4,5,6,7,8]; track i) {
                <div class="h-44 bg-gray-100 rounded-2xl animate-pulse"></div>
              }
            </div>
          } @else {
            <div class="space-y-2">
              @for (i of [1,2,3,4,5]; track i) {
                <div class="h-14 bg-gray-100 rounded-xl animate-pulse"></div>
              }
            </div>
          }
        } @else if (productosFiltrados().length === 0) {
          <div class="flex flex-col items-center justify-center py-24 text-gray-400">
            <span class="material-symbols-outlined text-5xl mb-3">lunch_dining</span>
            <p class="font-medium text-gray-500">Sin productos</p>
            <p class="text-sm mt-1">
              {{ busqueda() ? 'No hay resultados para "' + busqueda() + '"' : 'Crea el primer producto de la sede' }}
            </p>
            @if (!busqueda()) {
              <button class="btn-primary mt-4 gap-2" (click)="abrirFormNuevo()">
                <span class="material-symbols-outlined text-base">add</span>
                Crear producto
              </button>
            }
          </div>

        <!-- ── Vista GRID ─────────────────────────────────────────────── -->
        } @else if (vista() === 'grid') {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (producto of productosFiltrados(); track producto.id) {
              <div
                class="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-card-md
                       transition-all group flex flex-col"
                [class.opacity-50]="!producto.activo"
              >
                <!-- Imagen placeholder -->
                <div class="h-28 bg-gradient-to-br from-orange-50 to-amber-50 rounded-t-2xl
                            flex items-center justify-center relative overflow-hidden">
                  <span class="material-symbols-outlined text-5xl text-orange-200">lunch_dining</span>
                  <!-- Badge activo/inactivo -->
                  <div class="absolute top-2.5 right-2.5">
                    @if (producto.activo) {
                      <span class="badge bg-green-100 text-green-700 ring-1 ring-green-200">activo</span>
                    } @else {
                      <span class="badge bg-gray-100 text-gray-500 ring-1 ring-gray-200">inactivo</span>
                    }
                  </div>
                </div>

                <!-- Info -->
                <div class="p-4 flex-1 flex flex-col">
                  <p class="font-display font-semibold text-gray-900 text-sm leading-tight mb-3">
                    {{ producto.nombre }}
                  </p>

                  <!-- Precios -->
                  <div class="flex items-end justify-between mb-3">
                    <div>
                      <p class="text-[10px] text-gray-400 uppercase tracking-wide">Venta</p>
                      <p class="font-display font-bold text-gray-900">{{ producto.precioVenta | cop }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-[10px] text-gray-400 uppercase tracking-wide">Compra</p>
                      <p class="text-sm text-gray-500">{{ producto.precioCompra | cop }}</p>
                    </div>
                  </div>

                  <!-- Margen -->
                  <div [class]="margenColor(producto) + ' rounded-xl px-3 py-1.5 flex items-center justify-between mb-3'">
                    <span class="text-xs font-medium">Margen</span>
                    <div class="flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-sm">
                        {{ margenPct(producto) >= 30 ? 'trending_up' : 'trending_flat' }}
                      </span>
                      <span class="text-xs font-bold">{{ margenPct(producto) | number:'1.0-0' }}%</span>
                    </div>
                  </div>

                  <!-- Acciones -->
                  <div class="flex gap-2 mt-auto">
                    <button
                      class="flex-1 btn-secondary btn-sm gap-1.5"
                      (click)="editar(producto)"
                    >
                      <span class="material-symbols-outlined text-sm">edit</span>
                      Editar
                    </button>
                    <button
                      [class]="producto.activo
                        ? 'btn-ghost btn-sm px-2.5 text-red-400 hover:bg-red-50 hover:text-red-600'
                        : 'btn-ghost btn-sm px-2.5 text-green-500 hover:bg-green-50 hover:text-green-700'"
                      (click)="toggleActivo(producto)"
                      [title]="producto.activo ? 'Desactivar' : 'Activar'"
                    >
                      <span class="material-symbols-outlined text-base">
                        {{ producto.activo ? 'visibility_off' : 'visibility' }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

        <!-- ── Vista TABLA ────────────────────────────────────────────── -->
        } @else {
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio venta</th>
                  <th>Precio compra</th>
                  <th>Utilidad</th>
                  <th>Margen</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (producto of productosFiltrados(); track producto.id) {
                  <tr [class.opacity-50]="!producto.activo">
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                          <span class="material-symbols-outlined text-orange-400 text-base">lunch_dining</span>
                        </div>
                        <span class="font-medium text-gray-800">{{ producto.nombre }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="font-semibold text-gray-900">{{ producto.precioVenta | cop }}</span>
                    </td>
                    <td>
                      <span class="text-gray-500">{{ producto.precioCompra | cop }}</span>
                    </td>
                    <td>
                      <span [class]="utilidad(producto) >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-500'">
                        {{ utilidad(producto) | cop }}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div class="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full"
                            [style.width.%]="margenPct(producto)"
                            [class]="margenPct(producto) >= 40 ? 'bg-green-400' :
                                     margenPct(producto) >= 20 ? 'bg-yellow-400' : 'bg-red-400'"
                          ></div>
                        </div>
                        <span class="text-sm font-medium text-gray-700">
                          {{ margenPct(producto) | number:'1.0-0' }}%
                        </span>
                      </div>
                    </td>
                    <td>
                      @if (producto.activo) {
                        <span class="badge bg-green-50 text-green-700 ring-1 ring-green-200">activo</span>
                      } @else {
                        <span class="badge bg-gray-50 text-gray-500 ring-1 ring-gray-200">inactivo</span>
                      }
                    </td>
                    <td>
                      <div class="flex items-center gap-1 justify-end">
                        <button
                          class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
                                 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          (click)="editar(producto)"
                          title="Editar"
                        >
                          <span class="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          [class]="producto.activo
                            ? 'text-gray-400 hover:bg-red-50 hover:text-red-500'
                            : 'text-gray-400 hover:bg-green-50 hover:text-green-600'"
                          (click)="toggleActivo(producto)"
                          [title]="producto.activo ? 'Desactivar' : 'Activar'"
                        >
                          <span class="material-symbols-outlined text-base">
                            {{ producto.activo ? 'visibility_off' : 'visibility' }}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Resumen de márgenes -->
          <div class="mt-4 grid grid-cols-3 gap-4">
            @for (stat of statsMargen(); track stat.label) {
              <div class="card flex items-center gap-3">
                <div [class]="'w-9 h-9 rounded-xl flex items-center justify-center ' + stat.bgColor">
                  <span [class]="'material-symbols-outlined text-base ' + stat.color">{{ stat.icon }}</span>
                </div>
                <div>
                  <p class="text-xs text-gray-400">{{ stat.label }}</p>
                  <p class="font-display font-bold text-gray-900">{{ stat.value }}</p>
                </div>
              </div>
            }
          </div>
        }

      </div>
    </div>

    <!-- Modal form -->
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

  cargando        = signal(true);
  productos       = signal<Producto[]>([]);
  busqueda        = signal('');
  filtroActivo    = signal<FiltroActivo>('todos');
  vista           = signal<Vista>('grid');
  mostrarForm     = signal(false);
  productoEditando = signal<Producto | null>(null);

  filtros = [
    { value: 'todos'    as FiltroActivo, label: 'Todos'    },
    { value: 'activos'  as FiltroActivo, label: 'Activos'  },
    { value: 'inactivos'as FiltroActivo, label: 'Inactivos'},
  ];

  // ─── Computed ─────────────────────────────────────────────────────────────

  productosActivos = computed(() => this.productos().filter((p) => p.activo));

  productosFiltrados = computed(() => {
    const q       = this.busqueda().toLowerCase().trim();
    const filtro  = this.filtroActivo();
    let lista = this.productos();

    if (filtro === 'activos')   lista = lista.filter((p) =>  p.activo);
    if (filtro === 'inactivos') lista = lista.filter((p) => !p.activo);
    if (q) lista = lista.filter((p) => p.nombre.toLowerCase().includes(q));

    return lista;
  });

  statsMargen = computed(() => {
    const activos = this.productosActivos();
    if (!activos.length) return [];

    const margenes    = activos.map((p) => this.margenPct(p));
    const promedioMgn = margenes.reduce((s, m) => s + m, 0) / margenes.length;
    const mejorProd   = activos.reduce((a, b) => this.margenPct(a) > this.margenPct(b) ? a : b);
    const totalUtilidad = activos.reduce((s, p) => s + this.utilidad(p), 0);

    return [
      {
        label:   'Margen promedio',
        value:   promedioMgn.toFixed(1) + '%',
        icon:    'bar_chart',
        color:   'text-blue-500',
        bgColor: 'bg-blue-50',
      },
      {
        label:   'Mejor margen',
        value:   mejorProd.nombre,
        icon:    'emoji_events',
        color:   'text-amber-500',
        bgColor: 'bg-amber-50',
      },
      {
        label:   'Utilidad estimada por venta',
        value:   new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalUtilidad),
        icon:    'trending_up',
        color:   'text-green-500',
        bgColor: 'bg-green-50',
      },
    ];
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.cargarProductos();
  }

  private cargarProductos(): void {
    this.cargando.set(true);
    this.http.get<Producto[]>(`${environment.apiUrl}/productos`).subscribe({
      next:  (data) => { this.productos.set(data); this.cargando.set(false); },
      error: ()     => this.cargando.set(false),
    });
  }

  // ─── Helpers de margen ────────────────────────────────────────────────────

  margenPct(p: Producto): number {
    if (!p.precioVenta) return 0;
    return ((p.precioVenta - p.precioCompra) / p.precioVenta) * 100;
  }

  utilidad(p: Producto): number {
    return p.precioVenta - p.precioCompra;
  }

  margenColor(p: Producto): string {
    const m = this.margenPct(p);
    if (m >= 40) return 'bg-green-50 text-green-700';
    if (m >= 20) return 'bg-yellow-50 text-yellow-700';
    return 'bg-red-50 text-red-600';
  }

  // ─── Acciones ─────────────────────────────────────────────────────────────

  abrirFormNuevo(): void {
    this.productoEditando.set(null);
    this.mostrarForm.set(true);
  }

  editar(producto: Producto): void {
    this.productoEditando.set(producto);
    this.mostrarForm.set(true);
  }

  cerrarForm(): void {
    this.mostrarForm.set(false);
    this.productoEditando.set(null);
  }

  toggleActivo(producto: Producto): void {
    this.http
      .patch<Producto>(`${environment.apiUrl}/productos/${producto.id}`, { activo: !producto.activo })
      .subscribe((actualizado) => {
        this.productos.update((list) =>
          list.map((p) => p.id === actualizado.id ? actualizado : p),
        );
      });
  }

  onGuardado(producto: Producto): void {
    const existe = this.productos().some((p) => p.id === producto.id);
    if (existe) {
      this.productos.update((list) => list.map((p) => p.id === producto.id ? producto : p));
    } else {
      this.productos.update((list) => [producto, ...list]);
    }
    this.cerrarForm();
  }
}
