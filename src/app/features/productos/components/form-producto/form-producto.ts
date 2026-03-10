import { Component, input, output, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import { Producto, TipoProducto, ItemInventario, Ingrediente } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-form-producto',
  standalone: true,
  imports: [ReactiveFormsModule, CopPipe, DecimalPipe],
  template: `
    <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" (click)="cerrar.emit()"></div>

    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col
                  animate-[scaleIn_0.18s_ease-out]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 class="font-display font-bold text-gray-900">
              {{ modoEdicion() ? 'Editar producto' : 'Nuevo producto' }}
            </h2>
            <p class="text-xs text-gray-400 mt-0.5">
              {{
                modoEdicion() ? 'Actualiza los datos del producto' : 'Define nombre, tipo y precio'
              }}
            </p>
          </div>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
                   hover:bg-gray-100 transition-colors"
            (click)="cerrar.emit()"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <!-- Body scroll -->
        <div class="flex-1 overflow-y-auto">
          <form [formGroup]="form" class="px-6 py-5 space-y-5">
            <!-- Nombre -->
            <div>
              <label class="label">Nombre del producto</label>
              <input
                type="text"
                formControlName="nombre"
                class="input"
                placeholder="Ej: Cubanito BBQ"
                autocomplete="off"
              />
              @if (form.get('nombre')?.touched && form.get('nombre')?.invalid) {
                <p class="form-error">Nombre requerido</p>
              }
            </div>

            <!-- Selector de tipo -->
            <div>
              <label class="label mb-2">Tipo de producto</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  (click)="setTipo(TipoProducto.Simple)"
                  [disabled]="modoEdicion()"
                  [class]="
                    tipoActual() === TipoProducto.Simple
                      ? 'flex items-start gap-3 p-4 rounded-xl border-2 border-blue-400 bg-blue-50 text-left transition-all'
                      : 'flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed'
                  "
                >
                  <span
                    [class]="
                      'material-symbols-outlined text-2xl mt-0.5 ' +
                      (tipoActual() === TipoProducto.Simple ? 'text-blue-600' : 'text-gray-300')
                    "
                  >
                    inventory_2
                  </span>
                  <div>
                    <p
                      [class]="
                        'text-sm font-bold ' +
                        (tipoActual() === TipoProducto.Simple ? 'text-blue-700' : 'text-gray-600')
                      "
                    >
                      Directo
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5 leading-snug">
                      Se vende tal cual. Ej: gaseosa, agua.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  (click)="setTipo(TipoProducto.Preparado)"
                  [disabled]="modoEdicion()"
                  [class]="
                    tipoActual() === TipoProducto.Preparado
                      ? 'flex items-start gap-3 p-4 rounded-xl border-2 border-orange-400 bg-orange-50 text-left transition-all'
                      : 'flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed'
                  "
                >
                  <span
                    [class]="
                      'material-symbols-outlined text-2xl mt-0.5 ' +
                      (tipoActual() === TipoProducto.Preparado
                        ? 'text-orange-600'
                        : 'text-gray-300')
                    "
                  >
                    cooking
                  </span>
                  <div>
                    <p
                      [class]="
                        'text-sm font-bold ' +
                        (tipoActual() === TipoProducto.Preparado
                          ? 'text-orange-700'
                          : 'text-gray-600')
                      "
                    >
                      Preparado
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5 leading-snug">
                      Se elabora con insumos. Descuenta inventario al vender.
                    </p>
                  </div>
                </button>
              </div>
              @if (modoEdicion()) {
                <p class="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs">info</span>
                  El tipo no se puede cambiar una vez creado el producto.
                </p>
              }
            </div>

            <!-- ── DIRECTO: vínculo a inventario ────────────────────────── -->
            @if (tipoActual() === TipoProducto.Simple) {
              <div>
                <label class="label">Ítem de inventario vinculado</label>
                <p class="text-xs text-gray-400 mb-2">
                  Al vender este producto se descontará <strong>1 unidad</strong> del ítem
                  seleccionado.
                </p>
                <select formControlName="itemInventarioId" class="select">
                  <option value="">Selecciona un ítem de inventario...</option>
                  @for (item of inventario(); track item.id) {
                    <option [value]="item.id">
                      {{ item.nombre }} · stock: {{ item.stockActual | number: '1.0-2' }}
                      {{ item.unidad }}
                    </option>
                  }
                </select>
                @if (
                  form.get('itemInventarioId')?.touched && form.get('itemInventarioId')?.invalid
                ) {
                  <p class="form-error">Debes seleccionar un ítem de inventario</p>
                }
              </div>
            }

            <!-- ── PREPARADO: editor de ingredientes ────────────────────── -->
            @if (tipoActual() === TipoProducto.Preparado) {
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <label class="label mb-0">Ingredientes</label>
                    <p class="text-xs text-gray-400 mt-0.5">Cantidad usada por unidad producida.</p>
                  </div>
                  <button
                    type="button"
                    class="btn-ghost btn-sm gap-1"
                    (click)="agregarIngrediente()"
                  >
                    <span class="material-symbols-outlined text-sm">add</span>
                    Añadir
                  </button>
                </div>

                @if (ingredientesArray.length === 0) {
                  <div
                    class="rounded-xl border-2 border-dashed border-gray-200 py-7 flex flex-col items-center gap-1.5 text-gray-400"
                  >
                    <span class="material-symbols-outlined text-3xl text-gray-200">add_circle</span>
                    <p class="text-sm text-gray-400">Sin ingredientes</p>
                    <button
                      type="button"
                      class="text-xs text-brand font-semibold hover:underline"
                      (click)="agregarIngrediente()"
                    >
                      + Añadir primer ingrediente
                    </button>
                  </div>
                } @else {
                  <div class="space-y-2" formArrayName="ingredientes">
                    <!-- Cabecera -->
                    <div class="grid grid-cols-[1fr_5rem_3rem_2rem] gap-2 px-3">
                      <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                        Insumo
                      </p>
                      <p
                        class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center"
                      >
                        Cantidad
                      </p>
                      <p
                        class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center"
                      >
                        Unidad
                      </p>
                      <span></span>
                    </div>

                    @for (ctrl of ingredientesArray.controls; track $index) {
                      <div
                        [formGroupName]="$index"
                        class="grid grid-cols-[1fr_5rem_3rem_2rem] gap-2 items-center
                                  bg-gray-50 rounded-xl px-3 py-2 border border-gray-100"
                      >
                        <select
                          formControlName="itemInventarioId"
                          class="select text-sm bg-white min-w-0"
                          (change)="onIngredienteItemChange($index, $any($event.target).value)"
                        >
                          <option value="">Insumo...</option>
                          @for (item of inventario(); track item.id) {
                            <option [value]="item.id">{{ item.nombre }}</option>
                          }
                        </select>

                        <input
                          type="number"
                          formControlName="cantidad"
                          class="input text-sm text-center"
                          placeholder="0"
                          min="0.001"
                          step="0.001"
                        />

                        <span class="text-xs font-bold text-gray-400 text-center">
                          {{ getUnidad($index) }}
                        </span>

                        <button
                          type="button"
                          class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300
                                 hover:text-red-500 hover:bg-red-50 transition-colors"
                          (click)="quitarIngrediente($index)"
                        >
                          <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Precios -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Precio de venta</label>
                <div class="relative">
                  <span
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400"
                    >$</span
                  >
                  <input
                    type="number"
                    formControlName="precioVenta"
                    class="input pl-7"
                    placeholder="0"
                    min="0"
                  />
                </div>
                @if (form.get('precioVenta')?.touched && form.get('precioVenta')?.invalid) {
                  <p class="form-error">Precio requerido</p>
                }
              </div>

              <div>
                <label class="label">
                  {{
                    tipoActual() === TipoProducto.Preparado
                      ? 'Costo de producción'
                      : 'Precio de compra'
                  }}
                </label>
                <div class="relative">
                  <span
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400"
                    >$</span
                  >
                  <input
                    type="number"
                    formControlName="precioCompra"
                    class="input pl-7"
                    placeholder="0"
                    min="0"
                  />
                </div>
                @if (tipoActual() === TipoProducto.Preparado) {
                  <p class="text-[11px] text-gray-400 mt-1">
                    Ingresa el costo estimado de elaborar una unidad.
                  </p>
                }
              </div>
            </div>

            <!-- Panel margen -->
            @if (form.get('precioVenta')?.value && form.get('precioCompra')?.value) {
              <div
                [class]="
                  margen() >= 40
                    ? 'rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center justify-between'
                    : margen() >= 20
                      ? 'rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between'
                      : 'rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between'
                "
              >
                <div>
                  <p
                    [class]="
                      'text-xs font-semibold ' +
                      (margen() >= 40
                        ? 'text-green-700'
                        : margen() >= 20
                          ? 'text-amber-700'
                          : 'text-red-700')
                    "
                  >
                    Margen estimado
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ form.get('precioVenta')?.value | cop }} venta ·
                    {{ form.get('precioCompra')?.value | cop }} costo
                  </p>
                </div>
                <div class="text-right">
                  <p
                    [class]="
                      'font-display font-black text-2xl leading-none ' +
                      (margen() >= 40
                        ? 'text-green-700'
                        : margen() >= 20
                          ? 'text-amber-700'
                          : 'text-red-700')
                    "
                  >
                    {{ margen() | number: '1.0-1' }}%
                  </p>
                  <p
                    [class]="
                      'text-xs mt-0.5 ' +
                      (margen() >= 40
                        ? 'text-green-600'
                        : margen() >= 20
                          ? 'text-amber-600'
                          : 'text-red-500')
                    "
                  >
                    {{
                      ((form.get('precioVenta')?.value ?? 0) - (form.get('precioCompra')?.value ?? 0)) | cop
                    }}
                    ganancia
                  </p>
                </div>
              </div>
            }

            @if (errorMsg()) {
              <div
                class="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-base">error</span>
                {{ errorMsg() }}
              </div>
            }
          </form>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button class="btn-ghost flex-1" (click)="cerrar.emit()">Cancelar</button>
          <button
            class="btn-primary flex-1 gap-2"
            [disabled]="
              form.invalid ||
              guardando() ||
              (tipoActual() === TipoProducto.Preparado && ingredientesArray.length === 0)
            "
            (click)="guardar()"
          >
            @if (guardando()) {
              <span
                class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
              ></span>
            } @else {
              <span class="material-symbols-outlined text-base">{{
                modoEdicion() ? 'save' : 'add'
              }}</span>
            }
            {{ modoEdicion() ? 'Guardar cambios' : 'Crear producto' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes scaleIn {
        from {
          transform: scale(0.95);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
    `,
  ],
})
export class FormProducto implements OnInit {
  readonly productoEditar = input<Producto | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<Producto>();

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  readonly TipoProducto = TipoProducto;

  guardando = signal(false);
  errorMsg = signal('');
  inventario = signal<ItemInventario[]>([]);

  modoEdicion = computed(() => !!this.productoEditar());
  tipoActual = computed(
    () => (this.form?.getRawValue().tipo as TipoProducto) ?? TipoProducto.Preparado,
  );

  form = this.fb.group({
    nombre: ['', Validators.required],
    tipo: [TipoProducto.Preparado as TipoProducto, Validators.required],
    precioVenta: [null as number | null, [Validators.required, Validators.min(1)]],
    precioCompra: [null as number | null, [Validators.required, Validators.min(0)]],
    itemInventarioId: [''],
    ingredientes: this.fb.array([]),
  });

  get ingredientesArray(): FormArray {
    return this.form.get('ingredientes') as FormArray;
  }

  margen = computed(() => {
    const v = (this.form.get('precioVenta')?.value as number) ?? 0;
    const c = (this.form.get('precioCompra')?.value as number) ?? 0;
    if (!v) return 0;
    return ((v - c) / v) * 100;
  });

  ngOnInit(): void {
    this.http
      .get<ItemInventario[]>(`${environment.apiUrl}/inventario`)
      .subscribe((items) => this.inventario.set(items.filter((i) => i.activo)));

    const p = this.productoEditar();
    if (p) {
      this.form.patchValue({
        nombre: p.nombre,
        tipo: p.tipo,
        precioVenta: p.precioVenta,
        precioCompra: p.precioCompra,
        itemInventarioId: p.itemInventarioId ?? '',
      });
      this.form.get('tipo')?.disable();
      if (p.tipo === TipoProducto.Preparado && p.ingredientes?.length) {
        p.ingredientes.forEach((ing) => this.pushIngrediente(ing));
      }
    }

    this.form.get('tipo')?.valueChanges.subscribe(() => this.actualizarValidaciones());
    this.actualizarValidaciones();
  }

  setTipo(tipo: TipoProducto): void {
    if (this.modoEdicion()) return;
    this.form.patchValue({ tipo });
    this.ingredientesArray.clear();
    this.actualizarValidaciones();
  }

  private actualizarValidaciones(): void {
    const tipo = this.form.getRawValue().tipo;
    const itemCtrl = this.form.get('itemInventarioId')!;
    if (tipo === TipoProducto.Simple) {
      itemCtrl.setValidators(Validators.required);
    } else {
      itemCtrl.clearValidators();
      itemCtrl.setValue('');
    }
    itemCtrl.updateValueAndValidity();
  }

  private pushIngrediente(ing?: Partial<Ingrediente>): void {
    this.ingredientesArray.push(
      this.fb.group({
        itemInventarioId: [ing?.itemInventarioId ?? '', Validators.required],
        itemNombre: [ing?.itemNombre ?? ''],
        cantidad: [ing?.cantidad ?? null, [Validators.required, Validators.min(0.001)]],
        unidad: [ing?.unidad ?? ''],
      }),
    );
  }

  agregarIngrediente(): void {
    this.pushIngrediente();
  }

  quitarIngrediente(idx: number): void {
    this.ingredientesArray.removeAt(idx);
  }

  onIngredienteItemChange(idx: number, itemId: string): void {
    const item = this.inventario().find((i) => i.id === itemId);
    if (item) {
      this.ingredientesArray.at(idx).patchValue({ itemNombre: item.nombre, unidad: item.unidad });
    }
  }

  getUnidad(idx: number): string {
    return this.ingredientesArray.at(idx)?.get('unidad')?.value ?? '—';
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.errorMsg.set('');

    const raw = this.form.getRawValue();
    const tipo = raw.tipo as TipoProducto;

    const body: Partial<Producto> = {
      nombre: raw.nombre!,
      tipo,
      precioVenta: raw.precioVenta!,
      precioCompra: raw.precioCompra!,
    };

    if (tipo === TipoProducto.Simple) {
      body.itemInventarioId = raw.itemInventarioId ?? undefined;
    } else {
      body.ingredientes = (raw.ingredientes as any[]).map((i) => ({
        itemInventarioId: i.itemInventarioId,
        itemNombre: i.itemNombre,
        cantidad: i.cantidad,
        unidad: i.unidad,
      }));
    }

    const p = this.productoEditar();
    const req$ = p
      ? this.http.patch<Producto>(`${environment.apiUrl}/productos/${p.id}`, body)
      : this.http.post<Producto>(`${environment.apiUrl}/productos`, body);

    req$.subscribe({
      next: (prod) => {
        this.guardado.emit(prod);
        this.guardando.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'Error al guardar');
        this.guardando.set(false);
      },
    });
  }
}
