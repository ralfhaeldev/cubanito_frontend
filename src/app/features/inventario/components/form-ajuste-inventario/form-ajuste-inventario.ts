import { Component, input, output, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { environment } from '../../../../../environments/environment';

export interface ItemInventario {
  id: string; nombre: string; unidad: string;
  stockActual: number; stockMinimo: number; stockIdeal: number;
  categoria: string; activo: boolean; ultimoAjuste: string | null;
}

export interface AjusteInventario {
  id: string; itemId: string; itemNombre: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number; motivo: string; creadoPor: string; createdAt: string;
}

type TipoAjuste = 'entrada' | 'salida' | 'ajuste';

interface TipoOpcion {
  value:       TipoAjuste;
  label:       string;
  descripcion: string;
  icon:        string;
  color:       string;
  bg:          string;
  border:      string;
}

const TIPOS: TipoOpcion[] = [
  {
    value: 'entrada', label: 'Entrada', descripcion: 'Se suma al stock actual',
    icon: 'add_box', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-400',
  },
  {
    value: 'salida', label: 'Salida', descripcion: 'Se resta del stock actual',
    icon: 'indeterminate_check_box', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-400',
  },
  {
    value: 'ajuste', label: 'Ajuste', descripcion: 'Establece el stock exacto',
    icon: 'tune', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400',
  },
];

@Component({
  selector: 'app-form-ajuste-inventario',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" (click)="cerrar.emit()"></div>

    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col
                  animate-[scaleIn_0.18s_ease-out]">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 class="font-display font-bold text-gray-900">Ajustar stock</h2>
            <p class="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">
              {{ item().nombre }}
              <span class="text-gray-300 mx-1">·</span>
              Stock actual:
              <span class="font-semibold text-gray-600">{{ item().stockActual }} {{ item().unidad }}</span>
            </p>
          </div>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
                   hover:bg-gray-100 transition-colors shrink-0"
            (click)="cerrar.emit()"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form [formGroup]="form" class="px-6 py-5 space-y-5">

          <!-- Selector tipo -->
          <div>
            <label class="label">Tipo de movimiento</label>
            <div class="grid grid-cols-3 gap-2">
              @for (tipo of tipos; track tipo.value) {
                <button
                  type="button"
                  (click)="form.patchValue({ tipo: tipo.value })"
                  [class]="form.get('tipo')?.value === tipo.value
                    ? 'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 ' + tipo.border + ' ' + tipo.bg + ' transition-all'
                    : 'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all'"
                >
                  <span [class]="'material-symbols-outlined text-2xl ' + (form.get('tipo')?.value === tipo.value ? tipo.color : 'text-gray-300')">
                    {{ tipo.icon }}
                  </span>
                  <span [class]="'text-xs font-semibold ' + (form.get('tipo')?.value === tipo.value ? tipo.color : 'text-gray-400')">
                    {{ tipo.label }}
                  </span>
                  <span class="text-[10px] text-gray-400 text-center leading-tight hidden sm:block">
                    {{ tipo.descripcion }}
                  </span>
                </button>
              }
            </div>
          </div>

          <!-- Cantidad -->
          <div>
            <label class="label">
              {{ tipoSeleccionado()?.value === 'ajuste' ? 'Nuevo stock total' : 'Cantidad' }}
            </label>
            <div class="relative">
              <input
                type="number"
                formControlName="cantidad"
                class="input pr-16 text-lg font-semibold"
                placeholder="0"
                min="0"
                step="0.1"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                {{ item().unidad }}
              </span>
            </div>
            @if (form.get('cantidad')?.touched && form.get('cantidad')?.invalid) {
              <p class="form-error">Ingresa una cantidad válida</p>
            }
          </div>

          <!-- Preview resultado -->
          @if (stockResultante() !== null) {
            <div [class]="stockResultante()! < item().stockMinimo
              ? 'rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between'
              : 'rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between'">
              <span class="text-sm text-gray-600">Stock resultante</span>
              <div class="flex items-center gap-2">
                <span [class]="stockResultante()! < item().stockMinimo
                  ? 'font-display font-bold text-red-600'
                  : 'font-display font-bold text-gray-900'">
                  {{ stockResultante() | number:'1.0-2' }} {{ item().unidad }}
                </span>
                @if (stockResultante()! < item().stockMinimo) {
                  <span class="material-symbols-outlined text-red-500 text-sm">warning</span>
                }
              </div>
            </div>
          }

          <!-- Motivo -->
          <div>
            <label class="label">Motivo</label>
            <input
              type="text"
              formControlName="motivo"
              class="input"
              placeholder="Ej: Compra proveedor, merma, conteo físico..."
              autocomplete="off"
            />
            @if (form.get('motivo')?.touched && form.get('motivo')?.invalid) {
              <p class="form-error">El motivo es requerido</p>
            }
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
              <span class="material-symbols-outlined text-base">check</span>
            }
            Confirmar ajuste
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
export class FormAjusteInventario {
  readonly item     = input.required<ItemInventario>();
  readonly cerrar   = output<void>();
  readonly guardado = output<AjusteInventario>();

  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  guardando = signal(false);
  errorMsg  = signal('');
  tipos     = TIPOS;

  form = this.fb.group({
    tipo:     ['entrada' as TipoAjuste, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
    motivo:   ['', Validators.required],
  });

  tipoSeleccionado = computed(() =>
    TIPOS.find((t) => t.value === this.form.get('tipo')?.value) ?? null,
  );

  stockResultante = computed(() => {
    const cantidad = this.form.get('cantidad')?.value as number | null;
    const tipo     = this.form.get('tipo')?.value as TipoAjuste;
    if (!cantidad) return null;
    const actual = this.item().stockActual;
    switch (tipo) {
      case 'entrada': return actual + cantidad;
      case 'salida':  return Math.max(0, actual - cantidad);
      case 'ajuste':  return cantidad;
    }
  });

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.http
      .post<AjusteInventario>(`${environment.apiUrl}/inventario/ajustes`, {
        itemId: this.item().id,
        ...this.form.value,
      })
      .subscribe({
        next:  (aj) => { this.guardado.emit(aj); this.guardando.set(false); },
        error: (err) => {
          this.errorMsg.set(err?.error?.message ?? 'Error al registrar el ajuste');
          this.guardando.set(false);
        },
      });
  }
}
