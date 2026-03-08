import { Component, input, output, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import { Producto } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-form-producto',
  standalone: true,
  imports: [ReactiveFormsModule, CopPipe, DecimalPipe],
  template: `
    <!-- Overlay -->
    <div
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
      (click)="cerrar.emit()"
    ></div>

    <!-- Modal -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col
                  animate-[scaleIn_0.18s_ease-out]">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <span class="material-symbols-outlined text-orange-400">lunch_dining</span>
            </div>
            <div>
              <h2 class="font-display font-bold text-gray-900">
                {{ modoEdicion() ? 'Editar producto' : 'Nuevo producto' }}
              </h2>
              <p class="text-xs text-gray-400">
                {{ modoEdicion() ? 'Actualiza la información' : 'Agrega al catálogo de la sede' }}
              </p>
            </div>
          </div>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            (click)="cerrar.emit()"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="guardar()" class="px-6 py-5 space-y-4">

          <!-- Nombre -->
          <div>
            <label class="label">Nombre del producto</label>
            <input
              type="text"
              formControlName="nombre"
              class="input"
              placeholder="Ej: Cubanito Clásico"
              autocomplete="off"
            />
            @if (form.get('nombre')?.touched && form.get('nombre')?.invalid) {
              <p class="form-error">El nombre es requerido</p>
            }
          </div>

          <!-- Precios -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Precio de venta</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">$</span>
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
              <label class="label">Precio de compra</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">$</span>
                <input
                  type="number"
                  formControlName="precioCompra"
                  class="input pl-7"
                  placeholder="0"
                  min="0"
                />
              </div>
              @if (form.get('precioCompra')?.touched && form.get('precioCompra')?.invalid) {
                <p class="form-error">Precio requerido</p>
              }
            </div>
          </div>

          <!-- Margen calculado -->
          @if (margen() !== null) {
            <div [class]="margen()! >= 0
              ? 'rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center justify-between'
              : 'rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between'">
              <div class="flex items-center gap-2">
                <span [class]="margen()! >= 0
                  ? 'material-symbols-outlined text-green-500 text-base'
                  : 'material-symbols-outlined text-red-500 text-base'">
                  {{ margen()! >= 0 ? 'trending_up' : 'trending_down' }}
                </span>
                <span [class]="margen()! >= 0 ? 'text-sm text-green-700' : 'text-sm text-red-700'">
                  Margen de ganancia
                </span>
              </div>
              <div class="text-right">
                <p [class]="margen()! >= 0
                  ? 'font-display font-bold text-green-700'
                  : 'font-display font-bold text-red-700'">
                  {{ utilidad() | cop }}
                </p>
                <p [class]="margen()! >= 0 ? 'text-xs text-green-600' : 'text-xs text-red-600'">
                  {{ margen()! | number:'1.1-1' }}%
                </p>
              </div>
            </div>
          }

          <!-- Activo toggle (solo edición) -->
          @if (modoEdicion()) {
            <div class="flex items-center justify-between py-1">
              <div>
                <p class="text-sm font-medium text-gray-700">Producto activo</p>
                <p class="text-xs text-gray-400">Visible para tomar pedidos</p>
              </div>
              <button
                type="button"
                (click)="toggleActivo()"
                [class]="form.get('activo')?.value
                  ? 'w-11 h-6 bg-brand rounded-full relative transition-colors duration-200'
                  : 'w-11 h-6 bg-gray-200 rounded-full relative transition-colors duration-200'"
              >
                <span [class]="form.get('activo')?.value
                  ? 'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 translate-x-5'
                  : 'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 translate-x-0'">
                </span>
              </button>
            </div>
          }

          <!-- Error global -->
          @if (errorMsg()) {
            <div class="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {{ errorMsg() }}
            </div>
          }

        </form>

        <!-- Footer -->
        <div class="px-6 pb-5 flex items-center justify-between gap-3">
          <button type="button" class="btn-ghost" (click)="cerrar.emit()">Cancelar</button>
          <button
            type="button"
            class="btn-primary gap-2"
            [disabled]="form.invalid || guardando()"
            (click)="guardar()"
          >
            @if (guardando()) {
              <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            } @else {
              <span class="material-symbols-outlined text-base">
                {{ modoEdicion() ? 'save' : 'add' }}
              </span>
            }
            {{ modoEdicion() ? 'Guardar cambios' : 'Crear producto' }}
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
export class FormProducto implements OnInit {
  readonly productoEditar = input<Producto | null>(null);
  readonly cerrar         = output<void>();
  readonly guardado       = output<Producto>();

  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  guardando = signal(false);
  errorMsg  = signal('');

  form = this.fb.group({
    nombre:       ['', Validators.required],
    precioVenta:  [null as number | null, [Validators.required, Validators.min(0)]],
    precioCompra: [null as number | null, [Validators.required, Validators.min(0)]],
    activo:       [true],
  });

  modoEdicion = computed(() => !!this.productoEditar());

  margen = computed(() => {
    const venta  = this.form.get('precioVenta')?.value  as number | null;
    const compra = this.form.get('precioCompra')?.value as number | null;
    if (!venta || !compra || venta === 0) return null;
    return ((venta - compra) / venta) * 100;
  });

  utilidad = computed(() => {
    const venta  = this.form.get('precioVenta')?.value  as number | null;
    const compra = this.form.get('precioCompra')?.value as number | null;
    if (!venta || !compra) return 0;
    return venta - compra;
  });

  ngOnInit(): void {
    const p = this.productoEditar();
    if (p) {
      this.form.patchValue({
        nombre:       p.nombre,
        precioVenta:  p.precioVenta,
        precioCompra: p.precioCompra,
        activo:       p.activo,
      });
    }
  }

  toggleActivo(): void {
    const actual = this.form.get('activo')?.value;
    this.form.patchValue({ activo: !actual });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.errorMsg.set('');

    const body = this.form.value;
    const p    = this.productoEditar();

    const request$ = p
      ? this.http.patch<Producto>(`${environment.apiUrl}/productos/${p.id}`, body)
      : this.http.post<Producto>(`${environment.apiUrl}/productos`, body);

    request$.subscribe({
      next: (producto) => {
        this.guardado.emit(producto);
        this.guardando.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'Ocurrió un error al guardar');
        this.guardando.set(false);
      },
    });
  }
}
