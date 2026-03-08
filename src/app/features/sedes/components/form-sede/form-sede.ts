import { Component, input, output, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Sede } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-form-sede',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <!-- Overlay -->
    <div
      class="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
      (click)="cerrar.emit()"
    ></div>

    <!-- Modal -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col
                  animate-[scaleIn_0.18s_ease-out]">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div [class]="modoEdicion()
              ? 'w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center'
              : 'w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center'">
              <span [class]="modoEdicion()
                ? 'material-symbols-outlined text-blue-500'
                : 'material-symbols-outlined text-orange-500'">
                {{ modoEdicion() ? 'edit_location' : 'add_location' }}
              </span>
            </div>
            <div>
              <h2 class="font-display font-bold text-gray-900">
                {{ modoEdicion() ? 'Editar sede' : 'Nueva sede' }}
              </h2>
              <p class="text-xs text-gray-400">
                {{ modoEdicion() ? 'Modifica los datos de la sede' : 'Registra una nueva sede en el sistema' }}
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
            <label class="label">Nombre de la sede</label>
            <input
              type="text"
              formControlName="nombre"
              class="input"
              placeholder="Ej: Sede Centro, Sede Norte..."
              autocomplete="off"
            />
            @if (form.get('nombre')?.touched && form.get('nombre')?.hasError('required')) {
              <p class="form-error">El nombre es requerido</p>
            }
            @if (form.get('nombre')?.touched && form.get('nombre')?.hasError('minlength')) {
              <p class="form-error">Mínimo 3 caracteres</p>
            }
          </div>

          <!-- Estado activa (solo edición) -->
          @if (modoEdicion()) {
            <div class="flex items-center justify-between py-1">
              <div>
                <p class="text-sm font-medium text-gray-700">Sede activa</p>
                <p class="text-xs text-gray-400">Permite operaciones y acceso de usuarios</p>
              </div>
              <button
                type="button"
                (click)="toggleActiva()"
                [class]="form.get('activa')?.value
                  ? 'w-11 h-6 bg-brand rounded-full relative transition-colors duration-200'
                  : 'w-11 h-6 bg-gray-200 rounded-full relative transition-colors duration-200'"
              >
                <span [class]="form.get('activa')?.value
                  ? 'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 translate-x-5'
                  : 'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 translate-x-0'">
                </span>
              </button>
            </div>

            @if (!form.get('activa')?.value) {
              <div class="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
                <span class="material-symbols-outlined text-amber-500 text-base mt-0.5">warning</span>
                <p class="text-xs text-amber-700 leading-relaxed">
                  Al desactivar la sede, sus usuarios no podrán acceder al sistema hasta que se reactive.
                </p>
              </div>
            }
          }

          <!-- Error global -->
          @if (errorMsg()) {
            <div class="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex items-center gap-2">
              <span class="material-symbols-outlined text-base">error</span>
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
                {{ modoEdicion() ? 'save' : 'add_location' }}
              </span>
            }
            {{ modoEdicion() ? 'Guardar cambios' : 'Crear sede' }}
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
export class FormSede implements OnInit {
  readonly sedeEditar = input<Sede | null>(null);
  readonly cerrar     = output<void>();
  readonly guardado   = output<Sede>();

  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  guardando = signal(false);
  errorMsg  = signal('');

  modoEdicion = computed(() => !!this.sedeEditar());

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    activa: [true],
  });

  ngOnInit(): void {
    const s = this.sedeEditar();
    if (s) {
      this.form.patchValue({ nombre: s.nombre, activa: s.activa });
    }
  }

  toggleActiva(): void {
    this.form.patchValue({ activa: !this.form.get('activa')?.value });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.errorMsg.set('');

    const body = this.form.value;
    const s    = this.sedeEditar();

    const req$ = s
      ? this.http.patch<Sede>(`${environment.apiUrl}/sedes/${s.id}`, body)
      : this.http.post<Sede>(`${environment.apiUrl}/sedes`, body);

    req$.subscribe({
      next: (sede) => {
        this.guardado.emit(sede);
        this.guardando.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'Error al guardar');
        this.guardando.set(false);
      },
    });
  }
}
