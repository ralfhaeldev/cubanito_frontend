import { Component, input, output, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import { Caja } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-form-cerrar-caja',
  standalone: true,
  imports: [ReactiveFormsModule, CopPipe],
  template: `
    <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" (click)="cerrar.emit()"></div>

    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-[scaleIn_0.18s_ease-out]">

        <!-- Header con advertencia -->
        <div class="px-6 pt-6 pb-4">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-amber-500 text-3xl">lock</span>
          </div>
          <h2 class="font-display font-bold text-gray-900 text-lg">Cerrar caja</h2>
          <p class="text-sm text-gray-400 mt-1">Registra el monto físico contado al cierre</p>
        </div>

        <!-- Resumen del día -->
        <div class="mx-6 mb-4 rounded-xl border border-gray-100 divide-y divide-gray-100">
          <div class="flex items-center justify-between px-4 py-2.5">
            <span class="text-xs text-gray-500">Apertura</span>
            <span class="text-sm font-semibold text-gray-700">{{ resumen().montoInicial | cop }}</span>
          </div>
          <div class="flex items-center justify-between px-4 py-2.5">
            <span class="text-xs text-gray-500">Ingresos del día</span>
            <span class="text-sm font-semibold text-green-600">+ {{ resumen().ingresos | cop }}</span>
          </div>
          <div class="flex items-center justify-between px-4 py-2.5">
            <span class="text-xs text-gray-500">Egresos / Gastos</span>
            <span class="text-sm font-semibold text-red-500">- {{ resumen().egresos | cop }}</span>
          </div>
          <div class="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-b-xl">
            <span class="text-xs font-semibold text-gray-700">Esperado en caja</span>
            <span class="font-display font-bold text-gray-900">{{ resumen().esperado | cop }}</span>
          </div>
        </div>

        <form [formGroup]="form" class="px-6 pb-2 space-y-4">
          <div>
            <label class="label">Monto físico contado</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
              <input
                type="number"
                formControlName="montoFinal"
                class="input pl-7 text-lg font-semibold"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <!-- Diferencia -->
          @if (diferencia() !== null) {
            <div [class]="diferencia() === 0
              ? 'rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center justify-between'
              : diferencia()! > 0
                ? 'rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center justify-between'
                : 'rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between'">
              <div class="flex items-center gap-2">
                <span [class]="diferencia() === 0
                  ? 'material-symbols-outlined text-green-500 text-base'
                  : diferencia()! > 0
                    ? 'material-symbols-outlined text-blue-500 text-base'
                    : 'material-symbols-outlined text-red-500 text-base'">
                  {{ diferencia() === 0 ? 'check_circle' : diferencia()! > 0 ? 'arrow_upward' : 'arrow_downward' }}
                </span>
                <span [class]="diferencia() === 0 ? 'text-sm text-green-700' : diferencia()! > 0 ? 'text-sm text-blue-700' : 'text-sm text-red-700'">
                  {{ diferencia() === 0 ? 'Cuadre exacto' : diferencia()! > 0 ? 'Sobrante' : 'Faltante' }}
                </span>
              </div>
              <span [class]="diferencia() === 0 ? 'font-bold text-green-700' : diferencia()! > 0 ? 'font-bold text-blue-700' : 'font-bold text-red-700'">
                {{ (diferencia()! >= 0 ? diferencia()! : -diferencia()!) | cop }}
              </span>
            </div>
          }

          @if (errorMsg()) {
            <div class="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {{ errorMsg() }}
            </div>
          }
        </form>

        <div class="px-6 py-4 flex gap-3">
          <button class="btn-ghost flex-1" (click)="cerrar.emit()">Cancelar</button>
          <button
            class="flex-1 gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold
                   flex items-center justify-center transition-colors disabled:opacity-50"
            [disabled]="form.invalid || guardando()"
            (click)="cerrarCaja()"
          >
            @if (guardando()) {
              <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            } @else {
              <span class="material-symbols-outlined text-base">lock</span>
            }
            Cerrar caja
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
export class FormCerrarCaja {
  readonly resumen = input.required<{ montoInicial: number; ingresos: number; egresos: number; esperado: number }>();
  readonly cerrar  = output<void>();
  readonly cerrada = output<Caja>();

  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  guardando = signal(false);
  errorMsg  = signal('');

  form = this.fb.group({
    montoFinal: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  diferencia = computed(() => {
    const monto = this.form.get('montoFinal')?.value as number | null;
    if (monto === null || monto === undefined) return null;
    return monto - this.resumen().esperado;
  });

  cerrarCaja(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.http
      .post<Caja>(`${environment.apiUrl}/caja/cerrar`, this.form.value)
      .subscribe({
        next:  (caja) => { this.cerrada.emit(caja); this.guardando.set(false); },
        error: (err)  => {
          this.errorMsg.set(err?.error?.message ?? 'Error al cerrar la caja');
          this.guardando.set(false);
        },
      });
  }
}
