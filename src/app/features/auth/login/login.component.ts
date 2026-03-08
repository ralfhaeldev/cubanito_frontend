import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-surface-muted px-4">
      <div class="w-full max-w-sm">

        <div class="text-center mb-8">
          <span class="text-5xl">🍔</span>
          <h1 class="font-display font-bold text-2xl text-gray-900 mt-3">Restaurant Manager</h1>
          <p class="text-sm text-gray-500 mt-1">Ingresa a tu cuenta</p>
        </div>

        <div class="card-md">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <div>
              <label class="label">Correo electrónico</label>
              <input
                type="email"
                formControlName="email"
                class="input"
                placeholder="admin@sede.com"
                autocomplete="email"
              />
              @if (form.get('email')?.touched && form.get('email')?.invalid) {
                <p class="form-error">Correo requerido</p>
              }
            </div>

            <div>
              <label class="label">Contraseña</label>
              <input
                type="password"
                formControlName="password"
                class="input"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              @if (form.get('password')?.touched && form.get('password')?.invalid) {
                <p class="form-error">Contraseña requerida</p>
              }
            </div>

            @if (errorMsg()) {
              <div class="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {{ errorMsg() }}
              </div>
            }

            <button
              type="submit"
              class="btn-primary w-full"
              [disabled]="loading() || form.invalid"
            >
              @if (loading()) { <span class="animate-spin">⏳</span> }
              @else { Ingresar }
            </button>

          </form>
        </div>

      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading  = signal(false);
  errorMsg = signal('');

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    const { email, password } = this.form.value;

    this.auth.login(email!, password!).subscribe({
      next:  () => this.router.navigate([this.auth.getHomeRoute()]),
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Credenciales inválidas');
      },
    });
  }
}
