import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { FormAjusteInventario, ItemInventario, AjusteInventario } from '../form-ajuste-inventario/form-ajuste-inventario';
import { FormItemInventario } from '../form-item-inventario/form-item-inventario';
import { environment } from '../../../../../environments/environment';

type FiltroStock = 'todos' | 'critico' | 'bajo' | 'ok';

@Component({
  selector: 'app-lista-inventario',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormAjusteInventario, FormItemInventario],
  template: `
    <div class="flex flex-col h-full">

      <!-- ── Header ──────────────────────────────────────────────────── -->
      <div class="bg-gray-950 px-6 pt-7 pb-6 relative overflow-hidden">
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand/10 blur-3xl"></div>
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        <div class="relative">
          <div class="flex items-start justify-between mb-5">
            <div>
              <p class="text-brand text-xs font-semibold uppercase tracking-widest mb-1">Control de stock</p>
              <h1 class="font-display font-bold text-white text-2xl">Inventario</h1>
              <p class="text-white/40 text-sm mt-0.5">
                {{ items().length }} ítems
                @if (criticos().length > 0) {
                  <span class="text-red-400 font-semibold ml-2">
                    · {{ criticos().length }} crítico{{ criticos().length !== 1 ? 's' : '' }}
                  </span>
                }
              </p>
            </div>
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm
                     font-semibold hover:bg-brand/90 transition-all active:scale-95"
              (click)="mostrarFormItem.set(true)"
            >
              <span class="material-symbols-outlined text-base">add</span>
              Nuevo ítem
            </button>
          </div>

          <!-- KPIs -->
          <div class="grid grid-cols-4 gap-2">
            @for (kpi of kpis(); track kpi.label) {
              <button
                (click)="filtroStock.set(kpi.filtro)"
                [class]="filtroStock() === kpi.filtro
                  ? 'rounded-xl border-2 border-white/30 px-3 py-3 text-left transition-all bg-white/10'
                  : 'rounded-xl border border-white/10 px-3 py-3 text-left hover:bg-white/5 transition-all'"
              >
                <div class="flex items-center gap-1.5 mb-1.5">
                  <div [class]="'w-2 h-2 rounded-full ' + kpi.dot"></div>
                  <span class="text-[10px] text-white/40 uppercase tracking-wide">{{ kpi.label }}</span>
                </div>
                <p [class]="'font-display font-bold text-xl leading-none ' + kpi.color">{{ kpi.value }}</p>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- ── Controles ──────────────────────────────────────────────── -->
      <div class="px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
        <!-- Buscador -->
        <div class="relative flex-1 min-w-0">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
          <input
            type="text"
            class="input pl-9 text-sm"
            placeholder="Buscar ítem..."
            [value]="busqueda()"
            (input)="busqueda.set($any($event.target).value)"
          />
        </div>

        <!-- Filtro categoría -->
        <select
          class="select text-sm w-auto"
          [value]="filtroCategoria()"
          (change)="filtroCategoria.set($any($event.target).value)"
        >
          <option value="">Todas las categorías</option>
          @for (cat of categorias(); track cat) {
            <option [value]="cat">{{ cat }}</option>
          }
        </select>

        <!-- Toggle historial -->
        <button
          (click)="verHistorial.set(!verHistorial())"
          [class]="verHistorial()
            ? 'btn-secondary btn-sm gap-1.5 text-brand border-brand/30 bg-brand/5'
            : 'btn-ghost btn-sm gap-1.5'"
        >
          <span class="material-symbols-outlined text-sm">history</span>
          Historial
        </button>
      </div>

      <!-- ── Contenido dividido ─────────────────────────────────────── -->
      <div class="flex-1 overflow-hidden flex">

        <!-- Lista de ítems -->
        <div [class]="verHistorial() ? 'w-1/2 border-r border-gray-100 overflow-y-auto' : 'flex-1 overflow-y-auto'">

          @if (cargando()) {
            <div class="p-6 space-y-2">
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
              }
            </div>

          } @else if (itemsFiltrados().length === 0) {
            <div class="flex flex-col items-center justify-center py-20 text-gray-400">
              <span class="material-symbols-outlined text-5xl mb-3 text-gray-200">inventory_2</span>
              <p class="font-medium text-gray-500">Sin resultados</p>
            </div>

          } @else {
            <!-- Agrupado por categoría -->
            @for (grupo of gruposPorCategoria(); track grupo.categoria) {
              <div class="px-4 pt-4 pb-1">
                <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
                  {{ grupo.categoria }}
                  <span class="ml-1 text-gray-300">{{ grupo.items.length }}</span>
                </p>
                <div class="space-y-1.5">
                  @for (item of grupo.items; track item.id) {
                    <div
                      class="rounded-xl border transition-all cursor-pointer px-4 py-3 flex items-center gap-3"
                      [class]="itemSeleccionado()?.id === item.id
                        ? 'border-brand bg-orange-50/50 ring-1 ring-brand/20'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'"
                      (click)="seleccionar(item)"
                    >
                      <!-- Indicator barra lateral -->
                      <div [class]="'w-1 h-10 rounded-full shrink-0 ' + barraColor(item)"></div>

                      <!-- Info -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <p class="text-sm font-semibold text-gray-800 truncate">{{ item.nombre }}</p>
                          <span [class]="'badge text-[10px] ' + nivelClass(item)">
                            {{ nivelLabel(item) }}
                          </span>
                        </div>
                        <!-- Barra de progreso stock -->
                        <div class="flex items-center gap-2">
                          <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              class="h-full rounded-full transition-all duration-500"
                              [class]="barraColor(item)"
                              [style.width.%]="pctStock(item)"
                            ></div>
                          </div>
                          <span class="text-xs font-mono font-semibold text-gray-600 shrink-0">
                            {{ item.stockActual | number:'1.0-2' }}
                            <span class="text-gray-400 font-normal">/ {{ item.stockIdeal }} {{ item.unidad }}</span>
                          </span>
                        </div>
                      </div>

                      <!-- Botón ajuste -->
                      <button
                        class="w-8 h-8 rounded-xl bg-gray-100 hover:bg-brand hover:text-white
                               flex items-center justify-center text-gray-400 transition-all shrink-0"
                        (click)="abrirAjuste($event, item)"
                        title="Ajustar stock"
                      >
                        <span class="material-symbols-outlined text-base">tune</span>
                      </button>

                    </div>
                  }
                </div>
              </div>
            }
            <div class="h-6"></div>
          }
        </div>

        <!-- Panel historial -->
        @if (verHistorial()) {
          <div class="w-1/2 flex flex-col overflow-hidden">
            <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Últimos movimientos
              </p>
              <span class="badge bg-gray-100 text-gray-500">{{ ajustes().length }}</span>
            </div>
            <div class="flex-1 overflow-y-auto">
              @if (cargandoAjustes()) {
                <div class="p-5 space-y-2">
                  @for (i of [1,2,3,4]; track i) {
                    <div class="h-14 bg-gray-100 rounded-xl animate-pulse"></div>
                  }
                </div>
              } @else if (ajustesFiltrados().length === 0) {
                <div class="flex flex-col items-center justify-center py-16 text-gray-400">
                  <span class="material-symbols-outlined text-4xl mb-2 text-gray-200">history</span>
                  <p class="text-sm text-gray-500">Sin movimientos registrados</p>
                </div>
              } @else {
                <div class="px-4 py-3 space-y-2">
                  @for (aj of ajustesFiltrados(); track aj.id) {
                    <div class="flex items-start gap-3 bg-white rounded-xl border border-gray-100 px-3.5 py-3">
                      <!-- Ícono tipo -->
                      <div [class]="'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ' + ajusteBg(aj.tipo)">
                        <span [class]="'material-symbols-outlined text-sm ' + ajusteColor(aj.tipo)">
                          {{ aj.tipo === 'entrada' ? 'add_box' : aj.tipo === 'salida' ? 'indeterminate_check_box' : 'tune' }}
                        </span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                          <p class="text-xs font-semibold text-gray-800 truncate">{{ aj.itemNombre }}</p>
                          <span [class]="'text-xs font-bold shrink-0 ' + ajusteColor(aj.tipo)">
                            {{ aj.tipo === 'entrada' ? '+' : aj.tipo === 'salida' ? '-' : '=' }}{{ aj.cantidad | number:'1.0-2' }}
                          </span>
                        </div>
                        <p class="text-xs text-gray-400 truncate mt-0.5">{{ aj.motivo }}</p>
                        <p class="text-[10px] text-gray-300 mt-0.5">
                          {{ aj.createdAt | date:'d MMM · HH:mm' }} · {{ aj.creadoPor }}
                        </p>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

      </div>
    </div>

    <!-- Modal ajuste -->
    @if (itemAjustando()) {
      <app-form-ajuste-inventario
        [item]="itemAjustando()!"
        (cerrar)="itemAjustando.set(null)"
        (guardado)="onAjusteGuardado($event)"
      />
    }

    <!-- Modal nuevo ítem -->
    @if (mostrarFormItem()) {
      <app-form-item-inventario
        (cerrar)="mostrarFormItem.set(false)"
        (guardado)="onItemCreado($event)"
      />
    }
  `,
})
export class ListaInventario implements OnInit {
  private http = inject(HttpClient);

  cargando        = signal(true);
  cargandoAjustes = signal(true);
  items           = signal<ItemInventario[]>([]);
  ajustes         = signal<AjusteInventario[]>([]);
  busqueda        = signal('');
  filtroCategoria = signal('');
  filtroStock     = signal<FiltroStock>('todos');
  verHistorial    = signal(false);
  itemSeleccionado = signal<ItemInventario | null>(null);
  itemAjustando    = signal<ItemInventario | null>(null);
  mostrarFormItem  = signal(false);

  // ─── Computed ─────────────────────────────────────────────────────────────

  criticos = computed(() => this.items().filter((i) => i.stockActual <= 0 || i.stockActual < i.stockMinimo * 0.5));
  bajos    = computed(() => this.items().filter((i) => i.stockActual >= i.stockMinimo * 0.5 && i.stockActual < i.stockMinimo));
  enStock  = computed(() => this.items().filter((i) => i.stockActual >= i.stockMinimo));

  kpis = computed(() => [
    { label: 'Total',    value: this.items().length,     color: 'text-white',    dot: 'bg-white/40',    filtro: 'todos'    as FiltroStock },
    { label: 'OK',       value: this.enStock().length,   color: 'text-green-400',dot: 'bg-green-400',   filtro: 'ok'       as FiltroStock },
    { label: 'Bajo',     value: this.bajos().length,     color: 'text-amber-400',dot: 'bg-amber-400',   filtro: 'bajo'     as FiltroStock },
    { label: 'Crítico',  value: this.criticos().length,  color: 'text-red-400',  dot: 'bg-red-400',     filtro: 'critico'  as FiltroStock },
  ]);

  categorias = computed(() =>
    [...new Set(this.items().map((i) => i.categoria))].sort(),
  );

  itemsFiltrados = computed(() => {
    const q    = this.busqueda().toLowerCase().trim();
    const cat  = this.filtroCategoria();
    const nivel = this.filtroStock();
    let lista  = this.items();

    if (cat)   lista = lista.filter((i) => i.categoria === cat);
    if (q)     lista = lista.filter((i) => i.nombre.toLowerCase().includes(q));

    switch (nivel) {
      case 'critico': lista = lista.filter((i) => this.nivelInterno(i) === 'critico'); break;
      case 'bajo':    lista = lista.filter((i) => this.nivelInterno(i) === 'bajo');    break;
      case 'ok':      lista = lista.filter((i) => this.nivelInterno(i) === 'ok');      break;
    }

    // Ordenar: críticos primero
    return lista.sort((a, b) => {
      const orden = { critico: 0, bajo: 1, ok: 2 };
      return orden[this.nivelInterno(a)] - orden[this.nivelInterno(b)];
    });
  });

  gruposPorCategoria = computed(() => {
    const mapa = new Map<string, { categoria: string; items: ItemInventario[] }>();
    for (const item of this.itemsFiltrados()) {
      if (!mapa.has(item.categoria)) {
        mapa.set(item.categoria, { categoria: item.categoria, items: [] });
      }
      mapa.get(item.categoria)!.items.push(item);
    }
    return Array.from(mapa.values());
  });

  ajustesFiltrados = computed(() => {
    const sel = this.itemSeleccionado();
    if (!sel) return this.ajustes();
    return this.ajustes().filter((a) => a.itemId === sel.id);
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    forkJoin({
      items:   this.http.get<ItemInventario[]>(`${environment.apiUrl}/inventario`),
      ajustes: this.http.get<AjusteInventario[]>(`${environment.apiUrl}/inventario/ajustes`),
    }).subscribe({
      next: ({ items, ajustes }) => {
        this.items.set(items);
        this.ajustes.set(ajustes);
        this.cargando.set(false);
        this.cargandoAjustes.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.cargandoAjustes.set(false);
      },
    });
  }

  // ─── Helpers de nivel ─────────────────────────────────────────────────────

  private nivelInterno(i: ItemInventario): 'critico' | 'bajo' | 'ok' {
    if (i.stockActual <= 0 || i.stockActual < i.stockMinimo * 0.5) return 'critico';
    if (i.stockActual < i.stockMinimo) return 'bajo';
    return 'ok';
  }

  nivelLabel(i: ItemInventario): string {
    const n = this.nivelInterno(i);
    return n === 'critico' ? 'Crítico' : n === 'bajo' ? 'Bajo' : 'OK';
  }

  nivelClass(i: ItemInventario): string {
    const n = this.nivelInterno(i);
    if (n === 'critico') return 'bg-red-50 text-red-600 ring-1 ring-red-200';
    if (n === 'bajo')    return 'bg-amber-50 text-amber-600 ring-1 ring-amber-200';
    return 'bg-green-50 text-green-600 ring-1 ring-green-200';
  }

  barraColor(i: ItemInventario): string {
    const n = this.nivelInterno(i);
    if (n === 'critico') return 'bg-red-400';
    if (n === 'bajo')    return 'bg-amber-400';
    return 'bg-green-400';
  }

  pctStock(i: ItemInventario): number {
    if (!i.stockIdeal) return 0;
    return Math.min(100, (i.stockActual / i.stockIdeal) * 100);
  }

  ajusteBg(tipo: string): string {
    if (tipo === 'entrada') return 'bg-green-50';
    if (tipo === 'salida')  return 'bg-red-50';
    return 'bg-blue-50';
  }

  ajusteColor(tipo: string): string {
    if (tipo === 'entrada') return 'text-green-600';
    if (tipo === 'salida')  return 'text-red-500';
    return 'text-blue-600';
  }

  // ─── Acciones ─────────────────────────────────────────────────────────────

  seleccionar(item: ItemInventario): void {
    this.itemSeleccionado.set(
      this.itemSeleccionado()?.id === item.id ? null : item,
    );
  }

  abrirAjuste(event: Event, item: ItemInventario): void {
    event.stopPropagation();
    this.itemAjustando.set(item);
  }

  onItemCreado(item: ItemInventario): void {
    this.items.update((list) => [item, ...list]);
    this.mostrarFormItem.set(false);
  }

  onAjusteGuardado(aj: AjusteInventario): void {
    // Recalcular stock del ítem afectado
    this.items.update((list) =>
      list.map((i) => {
        if (i.id !== aj.itemId) return i;
        let nuevoStock = i.stockActual;
        if (aj.tipo === 'entrada') nuevoStock += aj.cantidad;
        else if (aj.tipo === 'salida') nuevoStock = Math.max(0, nuevoStock - aj.cantidad);
        else nuevoStock = aj.cantidad;
        return { ...i, stockActual: nuevoStock, ultimoAjuste: aj.createdAt };
      }),
    );
    this.ajustes.update((list) => [aj, ...list]);
    this.itemAjustando.set(null);
  }
}
