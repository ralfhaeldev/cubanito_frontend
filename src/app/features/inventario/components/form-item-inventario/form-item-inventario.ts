import { Component, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ItemInventario } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

const UNIDADES = ['kg', 'g', 'lt', 'ml', 'und'];
const CATEGORIAS = ['Carnes', 'Lácteos', 'Panadería', 'Verduras', 'Bebidas', 'Condimentos', 'Otros'];

@Component({
  selector: 'app-form-item-inventario',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" (click)="cerrar.emit()"></div>

    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col
                  animate-[scaleIn_0.18s_ease-out]">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 class="font-display font-bold text-gray-900">Nuevo ítem de inventario</h2>
            <p class="text-xs text-gray-400 mt-0.5">Define nombre, unidad y niveles de stock</p>
          </div>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
                   hover:bg-gray-100 transition-colors shrink-0"
            (click)="cerrar.emit()"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form [formGroup]="form" class="px-6 py-5 space-y-4">

          <!-- Nombre -->
          <div>
            <label class="label">Nombre del ítem</label>
            <input
              type="text"
              formControlName="nombre"
              class="input"
              placeholder="Ej: Harina de trigo"
              autocomplete="off"
            />
            @if (form.get('nombre')?.touched && form.get('nombre')?.invalid) {
              <p class="form-error">El nombre es requerido</p>
            }
          </div>

          <!-- Categoría + Unidad -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Categoría</label>
              <select formControlName="categoria" class="select">
                <option value="" disabled>Seleccionar…</option>
                @for (cat of categorias; track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
              @if (form.get('categoria')?.touched && form.get('categoria')?.invalid) {
                <p class="form-error">Requerido</p>
              }
            </div>
            <div>
              <label class="label">Unidad</label>
              <select formControlName="unidad" class="select">
                <option value="" disabled>Seleccionar…</option>
                @for (u of unidades; track u) {
                  <option [value]="u">{{ u }}</option>
                }
              </select>
              @if (form.get('unidad')?.touched && form.get('unidad')?.invalid) {
                <p class="form-error">Requerido</p>
              }
            </div>
          </div>

          <!-- Stocks -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="label">Stock inicial</label>
              <input
                type="number"
                formControlName="stockActual"
                class="input"
                placeholder="0"
                min="0"
                step="0.1"
              />
              @if (form.get('stockActual')?.touched && form.get('stockActual')?.invalid) {
                <p class="form-error">Requerido</p>
              }
            </div>
            <div>
              <label class="label">Stock mínimo</label>
              <input
                type="number"
                formControlName="stockMinimo"
                class="input"
                placeholder="0"
                min="0"
                step="0.1"
              />
              @if (form.get('stockMinimo')?.touched && form.get('stockMinimo')?.invalid) {
                <p class="form-error">Requerido</p>
              }
            </div>
            <div>
              <label class="label">Stock ideal</label>
              <input
                type="number"
                formControlName="stockIdeal"
                class="input"
                placeholder="0"
                min="0"
                step="0.1"
              />
              @if (form.get('stockIdeal')?.touched && form.get('stockIdeal')?.invalid) {
                <p class="form-error">Requerido</p>
              }
            </div>
          </div>

          @if (errorMsg()) {
            <div class="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {{ errorMsg() }}
            </div>
          }

        </form>

        <div class="px-6 pb-5 flex gap-3">
          <button class="btn-ghost flex-1" (click)="cerrar.emit()">Cancelar</button>
          <button
            class="btn-primary flex-1 gap-2"
            [disabled]="form.invalid || guardando()"
            (click)="guardar()"
          >
            @if (guardando()) {
              <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            } @else {
              <span class="material-symbols-outlined text-base">add</span>
            }
            Crear ítem
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
export class FormItemInventario {
  readonly cerrar  = output<void>();
  readonly guardado = output<ItemInventario>();

  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  guardando = signal(false);
  errorMsg  = signal('');
  unidades  = UNIDADES;
  categorias = CATEGORIAS;

  form = this.fb.group({
    nombre:      ['', Validators.required],
    categoria:   ['', Validators.required],
    unidad:      ['', Validators.required],
    stockActual: [null as number | null, [Validators.required, Validators.min(0)]],
    stockMinimo: [null as number | null, [Validators.required, Validators.min(0)]],
    stockIdeal:  [null as number | null, [Validators.required, Validators.min(0)]],
  });

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.errorMsg.set('');
    this.http
      .post<ItemInventario>(`${environment.apiUrl}/inventario`, {
        ...this.form.value,
        activo: true,
      })
      .subscribe({
        next: (item) => {
          this.guardado.emit(item);
          this.guardando.set(false);
        },
        error: (err) => {
          this.errorMsg.set(err?.error?.message ?? 'Error al crear el ítem');
          this.guardando.set(false);
        },
      });
  }
}
