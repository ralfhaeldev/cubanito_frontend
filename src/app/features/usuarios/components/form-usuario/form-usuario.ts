import { Component, input, output, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Usuario, Sede, Rol } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

interface RolOpcion {
  value:       Rol;
  label:       string;
  descripcion: string;
  icon:        string;
  color:       string;
  bg:          string;
  border:      string;
  needsSede:   boolean;
}

const ROLES: RolOpcion[] = [
  {
    value: Rol.AdminSede, label: 'Admin Sede',
    descripcion: 'Gestiona caja, usuarios y reportes de la sede',
    icon: 'manage_accounts', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400',
    needsSede: true,
  },
  {
    value: Rol.Mesero, label: 'Mesero',
    descripcion: 'Crea y gestiona pedidos en sala',
    icon: 'restaurant', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-400',
    needsSede: true,
  },
  {
    value: Rol.Cocina, label: 'Cocina',
    descripcion: 'Ve y actualiza el estado de pedidos en cocina',
    icon: 'cooking', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-400',
    needsSede: true,
  },
  {
    value: Rol.Domiciliario, label: 'Domiciliario',
    descripcion: 'Gestiona entregas a domicilio',
    icon: 'delivery_dining', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-400',
    needsSede: true,
  },
];

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" (click)="cerrar.emit()"></div>

    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col
                  animate-[scaleIn_0.18s_ease-out]">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div class="flex items-center gap-3">
            <div [class]="modoEdicion()
              ? 'w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center'
              : 'w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center'">
              <span [class]="modoEdicion()
                ? 'material-symbols-outlined text-blue-500'
                : 'material-symbols-outlined text-orange-500'">
                {{ modoEdicion() ? 'edit' : 'person_add' }}
              </span>
            </div>
            <div>
              <h2 class="font-display font-bold text-gray-900">
                {{ modoEdicion() ? 'Editar usuario' : 'Nuevo usuario' }}
              </h2>
              <p class="text-xs text-gray-400">
                {{ modoEdicion() ? 'Actualiza los datos del usuario' : 'Crea un acceso al sistema' }}
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

        <!-- Body scroll -->
        <div class="flex-1 overflow-y-auto">
          <form [formGroup]="form" class="px-6 py-5 space-y-5">

            <!-- Datos básicos -->
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="label">Nombre completo</label>
                <input
                  type="text"
                  formControlName="nombre"
                  class="input"
                  placeholder="Ej: Pedro García"
                  autocomplete="off"
                />
                @if (form.get('nombre')?.touched && form.get('nombre')?.invalid) {
                  <p class="form-error">Nombre requerido</p>
                }
              </div>

              <div class="col-span-2">
                <label class="label">Correo electrónico</label>
                <input
                  type="email"
                  formControlName="email"
                  class="input"
                  placeholder="usuario@sede.com"
                  autocomplete="off"
                />
                @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
                  <p class="form-error">Email requerido</p>
                }
                @if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
                  <p class="form-error">Email inválido</p>
                }
              </div>

              <!-- Contraseña solo en creación -->
              @if (!modoEdicion()) {
                <div class="col-span-2">
                  <label class="label">Contraseña temporal</label>
                  <div class="relative">
                    <input
                      [type]="verPassword() ? 'text' : 'password'"
                      formControlName="password"
                      class="input pr-10"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      (click)="verPassword.set(!verPassword())"
                    >
                      <span class="material-symbols-outlined text-base">
                        {{ verPassword() ? 'visibility_off' : 'visibility' }}
                      </span>
                    </button>
                  </div>
                  @if (form.get('password')?.touched && form.get('password')?.invalid) {
                    <p class="form-error">Mínimo 6 caracteres</p>
                  }
                </div>
              }
            </div>

            <!-- Selector de rol -->
            <div>
              <label class="label mb-2">Rol en el sistema</label>
              <div class="grid grid-cols-2 gap-2">
                @for (rol of roles; track rol.value) {
                  <button
                    type="button"
                    (click)="form.patchValue({ rol: rol.value })"
                    [class]="form.get('rol')?.value === rol.value
                      ? 'flex items-start gap-3 p-3 rounded-xl border-2 ' + rol.border + ' ' + rol.bg + ' transition-all text-left'
                      : 'flex items-start gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all text-left'"
                  >
                    <span [class]="'material-symbols-outlined mt-0.5 ' + (form.get('rol')?.value === rol.value ? rol.color : 'text-gray-400')">
                      {{ rol.icon }}
                    </span>
                    <div>
                      <p [class]="'text-sm font-semibold ' + (form.get('rol')?.value === rol.value ? rol.color : 'text-gray-600')">
                        {{ rol.label }}
                      </p>
                      <p class="text-xs text-gray-400 mt-0.5 leading-snug">{{ rol.descripcion }}</p>
                    </div>
                  </button>
                }
              </div>
            </div>

            <!-- Selector de sede -->
            @if (rolSeleccionado()?.needsSede) {
              <div>
                <label class="label">Sede asignada</label>
                <select formControlName="sedeId" class="select">
                  <option value="">Selecciona una sede...</option>
                  @for (sede of sedes(); track sede.id) {
                    @if (sede.activa) {
                      <option [value]="sede.id">{{ sede.nombre }}</option>
                    }
                  }
                </select>
                @if (form.get('sedeId')?.touched && form.get('sedeId')?.invalid) {
                  <p class="form-error">Debes asignar una sede</p>
                }
              </div>
            }

            <!-- Toggle activo (solo edición) -->
            @if (modoEdicion()) {
              <div class="flex items-center justify-between py-1 border-t border-gray-100 pt-4">
                <div>
                  <p class="text-sm font-medium text-gray-700">Usuario activo</p>
                  <p class="text-xs text-gray-400">Puede iniciar sesión en el sistema</p>
                </div>
                <button
                  type="button"
                  (click)="form.patchValue({ activo: !form.get('activo')?.value })"
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

            @if (errorMsg()) {
              <div class="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-base">error</span>
                {{ errorMsg() }}
              </div>
            }

          </form>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
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
                {{ modoEdicion() ? 'save' : 'person_add' }}
              </span>
            }
            {{ modoEdicion() ? 'Guardar cambios' : 'Crear usuario' }}
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
export class FormUsuario implements OnInit {
  readonly usuarioEditar = input<Usuario | null>(null);
  readonly cerrar        = output<void>();
  readonly guardado      = output<Usuario>();

  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  guardando   = signal(false);
  errorMsg    = signal('');
  verPassword = signal(false);
  sedes       = signal<Sede[]>([]);
  roles       = ROLES;

  modoEdicion = computed(() => !!this.usuarioEditar());

  form = this.fb.group({
    nombre:   ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    rol:      [Rol.Mesero, Validators.required],
    sedeId:   ['', Validators.required],
    activo:   [true],
  });

  rolSeleccionado = computed(() =>
    ROLES.find((r) => r.value === this.form.get('rol')?.value) ?? null,
  );

  ngOnInit(): void {
    // Cargar sedes activas
    this.http.get<Sede[]>(`${environment.apiUrl}/branches`).subscribe((s) =>
      this.sedes.set(s.filter((x) => x.activa)),
    );

    const u = this.usuarioEditar();
    if (u) {
      this.form.patchValue({
        nombre: u.nombre,
        email:  u.email,
        rol:    u.rol,
        sedeId: (u as any).sedeId ?? '',
        activo: u.activo,
      });
      // En edición la contraseña no es requerida
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.errorMsg.set('');

    const body = { ...this.form.value };
    if (this.modoEdicion() && !body.password) delete (body as any).password;

    const u    = this.usuarioEditar();
    const req$ = u
      ? this.http.patch<Usuario>(`${environment.apiUrl}/usuarios/${u.id}`, body)
      : this.http.post<Usuario>(`${environment.apiUrl}/usuarios`, body);

    req$.subscribe({
      next:  (usuario) => { this.guardado.emit(usuario); this.guardando.set(false); },
      error: (err)     => {
        this.errorMsg.set(err?.error?.message ?? 'Error al guardar');
        this.guardando.set(false);
      },
    });
  }
}
