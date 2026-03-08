import { Component, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Movimiento, TipoMovimiento } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

interface TipoOpcion {
  value:   TipoMovimiento;
  label:   string;
  icon:    string;
  color:   string;
  bg:      string;
  border:  string;
}

const TIPOS: TipoOpcion[] = [
  {
    value:  TipoMovimiento.Ingreso,
    label:  'Ingreso',
    icon:   'arrow_downward',
    color:  'text-green-700',
    bg:     'bg-green-50',
    border: 'border-green-400',
  },
  {
    value:  TipoMovimiento.Egreso,
    label:  'Egreso',
    icon:   'arrow_upward',
    color:  'text-red-600',
    bg:     'bg-red-50',
    border: 'border-red-400',
  },
  {
    value:  TipoMovimiento.Gasto,
    label:  'Gasto',
    icon:   'receipt',
    color:  'text-amber-700',
    bg:     'bg-amber-50',
    border: 'border-amber-400',
  },
];

@Component({
  selector: 'app-form-movimiento',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" (click)="cerrar.emit()"></div>

    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-[scaleIn_0.18s_ease-out]">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 class="font-display font-bold text-gray-900">Registrar movimiento</h2>
            <p class="text-xs text-gray-400 mt-0.5">Agrega un ingreso, egreso o gasto</p>
          </div>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            (click)="cerrar.emit()"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form [formGroup]="form" class="px-6 py-5 space-y-4">

          <!-- Selector de tipo -->
          <div>
            <label class="label">Tipo de movimiento</label>
            <div class="grid grid-cols-3 gap-2">
              @for (tipo of tipos; track tipo.value) {
                <button
                  type="button"
                  (click)="form.patchValue({ tipo: tipo.value })"
                  [class]="form.get('tipo')?.value === tipo.value
                    ? 'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 ' + tipo.border + ' ' + tipo.bg + ' transition-all'
                    : 'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all'"
                >
                  <span [class]="'material-symbols-outlined text-xl ' + (form.get('tipo')?.value === tipo.value ? tipo.color : 'text-gray-400')">
                    {{ tipo.icon }}
                  </span>
                  <span [class]="'text-xs font-semibold ' + (form.get('tipo')?.value === tipo.value ? tipo.color : 'text-gray-500')">
                    {{ tipo.label }}
                  </span>
                </button>
              }
            </div>
          </div>

          <!-- Monto -->
          <div>
            <label class="label">Monto</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
              <input
                type="number"
                formControlName="monto"
                class="input pl-7 text-lg font-semibold"
                placeholder="0"
                min="1"
              />
            </div>
            @if (form.get('monto')?.touched && form.get('monto')?.invalid) {
              <p class="form-error">Ingresa un monto válido</p>
            }
          </div>

          <!-- Descripción -->
          <div>
            <label class="label">Descripción</label>
            <input
              type="text"
              formControlName="descripcion"
              class="input"
              placeholder="Ej: Compra de insumos, pago servicios..."
              autocomplete="off"
            />
            @if (form.get('descripcion')?.touched && form.get('descripcion')?.invalid) {
              <p class="form-error">La descripción es requerida</p>
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
              <span class="material-symbols-outlined text-base">add</span>
            }
            Registrar
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
export class FormMovimiento {
  readonly cerrar   = output<void>();
  readonly guardado = output<Movimiento>();

  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  guardando = signal(false);
  errorMsg  = signal('');
  tipos     = TIPOS;

  form = this.fb.group({
    tipo:        [TipoMovimiento.Ingreso, Validators.required],
    monto:       [null as number | null, [Validators.required, Validators.min(1)]],
    descripcion: ['', Validators.required],
  });

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.http
      .post<Movimiento>(`${environment.apiUrl}/movimientos`, this.form.value)
      .subscribe({
        next:  (mov) => { this.guardado.emit(mov); this.guardando.set(false); },
        error: (err) => {
          this.errorMsg.set(err?.error?.message ?? 'Error al registrar');
          this.guardando.set(false);
        },
      });
  }
}
