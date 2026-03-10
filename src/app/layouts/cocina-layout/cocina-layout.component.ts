import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-cocina-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="flex flex-col h-screen bg-gray-950 overflow-hidden">

      <!-- Topbar -->
      <header class="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
        <div class="flex items-center gap-2.5">
          <span class="text-lg">👨‍🍳</span>
          <div>
            <p class="font-display font-bold text-white text-sm leading-tight">Restaurant Manager</p>
            <p class="text-orange-400 text-[10px] font-semibold">Cocina</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div class="w-5 h-5 rounded-full bg-orange-500/30 flex items-center justify-center shrink-0">
              <span class="text-[10px] font-bold text-orange-300">
                {{ auth.currentUser()?.nombre?.[0]?.toUpperCase() }}
              </span>
            </div>
            <span class="text-xs text-white/60">{{ auth.currentUser()?.nombre }}</span>
          </div>

          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                   text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent
                   hover:border-red-500/20 transition-all"
            (click)="auth.logout()"
          >
            <span class="material-symbols-outlined text-sm">logout</span>
            Salir
          </button>
        </div>
      </header>

      <!-- Contenido -->
      <main class="flex-1 overflow-hidden">
        <router-outlet />
      </main>

    </div>
  `,
})
export class CocinaLayoutComponent {
  readonly auth = inject(AuthService);
}
