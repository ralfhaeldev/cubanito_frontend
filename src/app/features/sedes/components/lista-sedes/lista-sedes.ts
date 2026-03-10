import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormSede } from '../form-sede/form-sede';
import { Sede } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-lista-sedes',
  standalone: true,
  imports: [FormSede],
  template: `
    <div class="flex flex-col h-full">

      <!-- ── Hero header oscuro ──────────────────────────────────────── -->
      <div class="bg-gray-950 px-6 pt-8 pb-10 relative overflow-hidden">

        <!-- Decoración -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-brand/10 blur-3xl"></div>
          <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <!-- Grid pattern sutil -->
          <div class="absolute inset-0 opacity-[0.03]"
               style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 40px 40px;">
          </div>
        </div>

        <div class="relative max-w-5xl mx-auto">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-brand text-xs font-semibold uppercase tracking-widest mb-1">SuperAdmin</p>
              <h1 class="font-display font-bold text-white text-2xl">Gestión de sedes</h1>
              <p class="text-white/40 text-sm mt-1">
                {{ sedes().length }} sede{{ sedes().length !== 1 ? 's' : '' }} registrada{{ sedes().length !== 1 ? 's' : '' }}
                · {{ sedesActivas() }} activa{{ sedesActivas() !== 1 ? 's' : '' }}
              </p>
            </div>
            <button class="btn-primary gap-2" (click)="abrirFormNuevo()">
              <span class="material-symbols-outlined text-base">add_location</span>
              Nueva sede
            </button>
          </div>

          <!-- KPI strips -->
          <div class="mt-6 grid grid-cols-3 gap-3">
            @for (kpi of kpis(); track kpi.label) {
              <div class="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <span [class]="'material-symbols-outlined text-base ' + kpi.color">{{ kpi.icon }}</span>
                </div>
                <div>
                  <p class="font-display font-bold text-white text-lg leading-none">{{ kpi.value }}</p>
                  <p class="text-xs text-white/40 mt-0.5">{{ kpi.label }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ── Contenido ──────────────────────────────────────────────── -->
      <div class="flex-1 overflow-y-auto">
        <div class="max-w-5xl mx-auto px-6 py-8">

          @if (cargando()) {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (i of [1,2,3]; track i) {
                <div class="h-52 bg-gray-100 rounded-2xl animate-pulse"></div>
              }
            </div>

          } @else if (sedes().length === 0) {
            <div class="flex flex-col items-center justify-center py-24 text-gray-400">
              <span class="material-symbols-outlined text-6xl mb-4 text-gray-200">location_city</span>
              <p class="font-semibold text-gray-500 text-lg">Sin sedes registradas</p>
              <p class="text-sm mt-2 text-center max-w-xs">
                Crea la primera sede para comenzar a gestionar operaciones
              </p>
              <button class="btn-primary mt-6 gap-2" (click)="abrirFormNuevo()">
                <span class="material-symbols-outlined text-base">add_location</span>
                Crear primera sede
              </button>
            </div>

          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (sede of sedes(); track sede.id) {
                <div
                  class="bg-white rounded-2xl border border-gray-100 overflow-hidden
                         hover:shadow-card-md hover:border-gray-200 transition-all group"
                  [class.opacity-60]="!sede.activa"
                >
                  <!-- Franja de color superior -->
                  <div [class]="sede.activa
                    ? 'h-1.5 bg-gradient-to-r from-brand to-amber-400'
                    : 'h-1.5 bg-gray-200'">
                  </div>

                  <div class="p-5">

                    <!-- Top row -->
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <!-- Avatar con inicial -->
                        <div [class]="sede.activa
                          ? 'w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-amber-400 flex items-center justify-center'
                          : 'w-11 h-11 rounded-xl bg-gray-200 flex items-center justify-center'">
                          <span class="font-display font-black text-white text-lg">
                            {{ sede.nombre[0].toUpperCase() }}
                          </span>
                        </div>
                        <div>
                          <p class="font-display font-bold text-gray-900 leading-tight">{{ sede.nombre }}</p>
                          <p class="text-xs text-gray-400 font-mono">ID: {{ sede.id.slice(-8) }}</p>
                        </div>
                      </div>

                      <!-- Badge estado -->
                      @if (sede.activa) {
                        <span class="badge bg-green-50 text-green-700 ring-1 ring-green-200">
                          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Activa
                        </span>
                      } @else {
                        <span class="badge bg-gray-50 text-gray-500 ring-1 ring-gray-200">
                          <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          Inactiva
                        </span>
                      }
                    </div>

                    <!-- Divisor -->
                    <div class="h-px bg-gray-100 mb-4"></div>

                    <!-- Stats de la sede -->
                    <div class="grid grid-cols-2 gap-3 mb-4">
                      <div class="rounded-xl bg-gray-50 px-3 py-2.5">
                        <p class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Usuarios</p>
                        <div class="flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-gray-400 text-sm">group</span>
                          <span class="font-display font-bold text-gray-800">
                            {{ usuariosPorSede()[sede.id] }}
                          </span>
                        </div>
                      </div>
                      <div class="rounded-xl bg-gray-50 px-3 py-2.5">
                        <p class="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Estado DB</p>
                        <div class="flex items-center gap-1.5">
                          <span [class]="sede.activa
                            ? 'material-symbols-outlined text-green-500 text-sm'
                            : 'material-symbols-outlined text-gray-400 text-sm'">
                            database
                          </span>
                          <span [class]="sede.activa
                            ? 'text-sm font-semibold text-green-600'
                            : 'text-sm font-semibold text-gray-400'">
                            {{ sede.activa ? 'Online' : 'Offline' }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Acciones -->
                    <div class="flex gap-2">
                      <button
                        class="flex-1 btn-secondary btn-sm gap-1.5"
                        (click)="editar(sede)"
                      >
                        <span class="material-symbols-outlined text-sm">edit</span>
                        Editar
                      </button>
                      <button
                        [class]="sede.activa
                          ? 'btn-ghost btn-sm px-3 text-red-400 hover:bg-red-50 hover:text-red-600 gap-1.5'
                          : 'btn-ghost btn-sm px-3 text-green-500 hover:bg-green-50 hover:text-green-700 gap-1.5'"
                        (click)="toggleActiva(sede)"
                      >
                        <span class="material-symbols-outlined text-sm">
                          {{ sede.activa ? 'pause_circle' : 'play_circle' }}
                        </span>
                        {{ sede.activa ? 'Pausar' : 'Activar' }}
                      </button>
                    </div>

                  </div>
                </div>
              }

              <!-- Card "Agregar nueva" -->
              <button
                class="rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand/50
                       hover:bg-orange-50/40 transition-all group flex flex-col items-center justify-center
                       py-12 px-6 text-center"
                (click)="abrirFormNuevo()"
              >
                <div class="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-brand/10 flex items-center justify-center mb-3 transition-colors">
                  <span class="material-symbols-outlined text-gray-400 group-hover:text-brand transition-colors">
                    add_location
                  </span>
                </div>
                <p class="text-sm font-semibold text-gray-500 group-hover:text-brand transition-colors">
                  Agregar sede
                </p>
                <p class="text-xs text-gray-400 mt-1">Nueva sucursal al sistema</p>
              </button>
            </div>
          }

        </div>
      </div>
    </div>

    <!-- Modal form -->
    @if (mostrarForm()) {
      <app-form-sede
        [sedeEditar]="sedeEditando()"
        (cerrar)="cerrarForm()"
        (guardado)="onGuardado($event)"
      />
    }
  `,
})
export class ListaSedes implements OnInit {
  private http = inject(HttpClient);

  cargando       = signal(true);
  sedes          = signal<Sede[]>([]);
  mostrarForm    = signal(false);
  sedeEditando   = signal<Sede | null>(null);

  // Mock: cantidad de usuarios por sede (en producción vendría del backend)
  usuariosPorSede = signal<Record<string, number>>({
    'sede-1': 4,
    'sede-2': 2,
    'sede-3': 0,
  });

  sedesActivas = computed(() => this.sedes().filter((s) => s.activa).length);

  kpis = computed(() => [
    {
      label: 'Total sedes',
      value: String(this.sedes().length),
      icon:  'location_city',
      color: 'text-white',
    },
    {
      label: 'Activas',
      value: String(this.sedesActivas()),
      icon:  'check_circle',
      color: 'text-green-400',
    },
    {
      label: 'Inactivas',
      value: String(this.sedes().length - this.sedesActivas()),
      icon:  'pause_circle',
      color: 'text-gray-400',
    },
  ]);

  ngOnInit(): void {
    this.cargarSedes();
  }

  private cargarSedes(): void {
    this.cargando.set(true);
    this.http.get<Sede[]>(`${environment.apiUrl}/sedes`).subscribe({
      next:  (data) => { this.sedes.set(data); this.cargando.set(false); },
      error: ()     => this.cargando.set(false),
    });
  }

  // ─── Acciones ─────────────────────────────────────────────────────────────

  abrirFormNuevo(): void {
    this.sedeEditando.set(null);
    this.mostrarForm.set(true);
  }

  editar(sede: Sede): void {
    this.sedeEditando.set(sede);
    this.mostrarForm.set(true);
  }

  cerrarForm(): void {
    this.mostrarForm.set(false);
    this.sedeEditando.set(null);
  }

  toggleActiva(sede: Sede): void {
    this.http
      .patch<Sede>(`${environment.apiUrl}/sedes/${sede.id}`, { activa: !sede.activa })
      .subscribe((actualizada) => {
        this.sedes.update((list) =>
          list.map((s) => s.id === actualizada.id ? actualizada : s),
        );
      });
  }

  onGuardado(sede: Sede): void {
    const existe = this.sedes().some((s) => s.id === sede.id);
    if (existe) {
      this.sedes.update((list) => list.map((s) => s.id === sede.id ? sede : s));
    } else {
      this.sedes.update((list) => [...list, sede]);
    }
    this.cerrarForm();
  }
}
