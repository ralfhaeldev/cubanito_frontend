import { Component, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CopPipe } from '../../../../shared/pipes/cop.pipe';
import { Caja } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-form-abrir-caja',
  standalone: true,
  imports: [ReactiveFormsModule, CopPipe],
  template: `
    <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" (click)="cerrar.emit()"></div>

    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-[scaleIn_0.18s_ease-out]">

        <!-- Header -->
        <div class="px-6 pt-6 pb-4">
          <div class="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-green-500 text-3xl">lock_open</span>
          </div>
          <h2 class="font-display font-bold text-gray-900 text-lg">Abrir caja</h2>
          <p class="text-sm text-gray-400 mt-1">Ingresa el monto con el que inicia la jornada</p>
        </div>

        <form [formGroup]="form" class="px-6 pb-2 space-y-4">
          <div>
            <label class="label">Monto inicial en caja</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
              <input
                type="number"
                formControlName="montoInicial"
                class="input pl-7 text-lg font-semibold"
                placeholder="0"
                min="0"
                autofocus
              />
            </div>
            @if (form.get('montoInicial')?.touched && form.get('montoInicial')?.invalid) {
              <p class="form-error">Ingresa un monto válido</p>
            }
          </div>

          <!-- Preview monto -->
          @if (form.get('montoInicial')?.value) {
            <div class="rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center justify-between">
              <span class="text-sm text-green-700 font-medium">Apertura con</span>
              <span class="font-display font-bold text-green-700 text-lg">
                {{ form.get('montoInicial')?.value | cop }}
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
            class="btn-primary flex-1 gap-2"
            [disabled]="form.invalid || guardando()"
            (click)="abrir()"
          >
            @if (guardando()) {
              <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            } @else {
              <span class="material-symbols-outlined text-base">lock_open</span>
            }
            Abrir caja
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
export class FormAbrirCaja {
  readonly cerrar  = output<void>();
  readonly abierta = output<Caja>();

  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  guardando = signal(false);
  errorMsg  = signal('');

  form = this.fb.group({
    montoInicial: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  abrir(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.http
      .post<Caja>(`${environment.apiUrl}/caja/abrir`, this.form.value)
      .subscribe({
        next:  (caja) => { this.abierta.emit(caja); this.guardando.set(false); },
        error: (err)  => {
          this.errorMsg.set(err?.error?.message ?? 'Error al abrir la caja');
          this.guardando.set(false);
        },
      });
  }
}
