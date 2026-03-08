import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/auth/auth.service';
import { FormUsuario } from '../form-usuario/form-usuario';
import { Usuario, Sede, Rol } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

interface RolMeta {
  label:  string;
  icon:   string;
  color:  string;
  bg:     string;
  ring:   string;
}

const ROL_META: Record<Rol, RolMeta> = {
  [Rol.SuperAdmin]:    { label: 'Super Admin',  icon: 'shield',           color: 'text-purple-700', bg: 'bg-purple-50',  ring: 'ring-purple-200' },
  [Rol.AdminSede]:     { label: 'Admin Sede',   icon: 'manage_accounts',  color: 'text-blue-700',   bg: 'bg-blue-50',    ring: 'ring-blue-200'   },
  [Rol.Mesero]:        { label: 'Mesero',        icon: 'restaurant',       color: 'text-orange-600', bg: 'bg-orange-50',  ring: 'ring-orange-200' },
  [Rol.Cocina]:        { label: 'Cocina',        icon: 'cooking',          color: 'text-amber-700',  bg: 'bg-amber-50',   ring: 'ring-amber-200'  },
  [Rol.Domiciliario]:  { label: 'Domiciliario',  icon: 'delivery_dining',  color: 'text-indigo-700', bg: 'bg-indigo-50',  ring: 'ring-indigo-200' },
};

// Colores de avatar por inicial
const AVATAR_COLORS = [
  'from-orange-400 to-amber-400',
  'from-blue-400 to-indigo-400',
  'from-emerald-400 to-teal-400',
  'from-purple-400 to-pink-400',
  'from-rose-400 to-red-400',
];

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [FormUsuario],
  template: `
    <div class="flex flex-col h-full">

      <!-- Header -->
      <div class="px-6 pt-6 pb-4 bg-white border-b border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="font-display font-bold text-xl text-gray-900">Usuarios</h1>
            <p class="text-sm text-gray-400 mt-0.5">
              {{ usuariosFiltrados().length }} usuario{{ usuariosFiltrados().length !== 1 ? 's' : '' }}
              · {{ usuariosActivos() }} activo{{ usuariosActivos() !== 1 ? 's' : '' }}
            </p>
          </div>
          <button class="btn-primary gap-2" (click)="abrirFormNuevo()">
            <span class="material-symbols-outlined text-base">person_add</span>
            Nuevo usuario
          </button>
        </div>

        <!-- Controles -->
        <div class="flex items-center gap-3 flex-wrap">

          <!-- Buscador -->
          <div class="relative flex-1 min-w-48">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
            <input
              type="text"
              class="input pl-9 text-sm"
              placeholder="Buscar por nombre o email..."
              [value]="busqueda()"
              (input)="busqueda.set($any($event.target).value)"
            />
          </div>

          <!-- Filtro por rol -->
          <div class="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5 overflow-x-auto">
            <button
              (click)="filtroRol.set(null)"
              [class]="!filtroRol()
                ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-900 shadow-sm transition-all whitespace-nowrap'
                : 'px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 transition-all whitespace-nowrap'"
            >
              Todos
            </button>
            @for (rol of rolesDisponibles; track rol.value) {
              <button
                (click)="filtroRol.set(filtroRol() === rol.value ? null : rol.value)"
                [class]="filtroRol() === rol.value
                  ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-900 shadow-sm transition-all whitespace-nowrap'
                  : 'px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 transition-all whitespace-nowrap'"
              >
                {{ rol.label }}
              </button>
            }
          </div>

        </div>
      </div>

      <!-- Lista -->
      <div class="flex-1 overflow-y-auto">

        @if (cargando()) {
          <div class="p-6 space-y-3">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
            }
          </div>

        } @else if (usuariosFiltrados().length === 0) {
          <div class="flex flex-col items-center justify-center py-24 text-gray-400">
            <span class="material-symbols-outlined text-5xl mb-3 text-gray-200">group</span>
            <p class="font-medium text-gray-500">Sin usuarios</p>
            <p class="text-sm mt-1">
              {{ busqueda() ? 'No hay resultados para "' + busqueda() + '"' : 'Crea el primer usuario de la sede' }}
            </p>
          </div>

        } @else {

          <!-- Agrupados por sede -->
          @for (grupo of gruposPorSede(); track grupo.sedeId) {
            <div class="px-6 pt-5 pb-1">
              <div class="flex items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-gray-400 text-base">location_on</span>
                <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {{ grupo.nombreSede }}
                </p>
                <span class="badge bg-gray-100 text-gray-500">{{ grupo.usuarios.length }}</span>
              </div>

              <div class="space-y-2">
                @for (usuario of grupo.usuarios; track usuario.id) {
                  <div
                    class="bg-white rounded-2xl border border-gray-100 hover:border-gray-200
                           hover:shadow-card-md transition-all px-4 py-3.5 flex items-center gap-4"
                    [class.opacity-50]="!usuario.activo"
                  >
                    <!-- Avatar -->
                    <div [class]="'w-11 h-11 rounded-xl bg-gradient-to-br ' + avatarColor(usuario.nombre) +
                                  ' flex items-center justify-center shrink-0'">
                      <span class="font-display font-black text-white text-base">
                        {{ usuario.nombre[0].toUpperCase() }}
                      </span>
                    </div>

                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-semibold text-gray-900 text-sm">{{ usuario.nombre }}</p>
                        <!-- Badge rol -->
                        <span [class]="'badge ring-1 ' + rolMeta(usuario.rol).bg + ' ' + rolMeta(usuario.rol).color + ' ' + rolMeta(usuario.rol).ring">
                          <span class="material-symbols-outlined text-[11px]">{{ rolMeta(usuario.rol).icon }}</span>
                          {{ rolMeta(usuario.rol).label }}
                        </span>
                        @if (!usuario.activo) {
                          <span class="badge bg-gray-100 text-gray-400 ring-1 ring-gray-200">inactivo</span>
                        }
                      </div>
                      <p class="text-xs text-gray-400 mt-0.5 truncate">{{ usuario.email }}</p>
                    </div>

                    <!-- Acciones -->
                    <div class="flex items-center gap-1 shrink-0">
                      <button
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
                               hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        (click)="editar(usuario)"
                        title="Editar"
                      >
                        <span class="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        [class]="usuario.activo
                          ? 'text-gray-400 hover:bg-red-50 hover:text-red-500'
                          : 'text-gray-400 hover:bg-green-50 hover:text-green-600'"
                        (click)="toggleActivo(usuario)"
                        [title]="usuario.activo ? 'Desactivar' : 'Activar'"
                      >
                        <span class="material-symbols-outlined text-base">
                          {{ usuario.activo ? 'person_off' : 'person_check' }}
                        </span>
                      </button>
                    </div>

                  </div>
                }
              </div>
            </div>
          }

          <!-- Espaciado al fondo -->
          <div class="h-8"></div>
        }

      </div>
    </div>

    <!-- Modal form -->
    @if (mostrarForm()) {
      <app-form-usuario
        [usuarioEditar]="usuarioEditando()"
        (cerrar)="cerrarForm()"
        (guardado)="onGuardado($event)"
      />
    }
  `,
})
export class ListaUsuarios implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  cargando        = signal(true);
  usuarios        = signal<Usuario[]>([]);
  sedes           = signal<Sede[]>([]);
  busqueda        = signal('');
  filtroRol       = signal<Rol | null>(null);
  mostrarForm     = signal(false);
  usuarioEditando = signal<Usuario | null>(null);

  rolesDisponibles = [
    { value: Rol.AdminSede,    label: 'Admin'       },
    { value: Rol.Mesero,       label: 'Mesero'      },
    { value: Rol.Cocina,       label: 'Cocina'      },
    { value: Rol.Domiciliario, label: 'Domiciliario'},
  ];

  // ─── Computed ─────────────────────────────────────────────────────────────

  usuariosActivos = computed(() => this.usuarios().filter((u) => u.activo).length);

  usuariosFiltrados = computed(() => {
    const q   = this.busqueda().toLowerCase().trim();
    const rol = this.filtroRol();
    let lista = this.usuarios();

    if (rol)  lista = lista.filter((u) => u.rol === rol);
    if (q)    lista = lista.filter((u) =>
      u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );

    return lista;
  });

  gruposPorSede = computed(() => {
    const mapa = new Map<string, { sedeId: string; nombreSede: string; usuarios: Usuario[] }>();

    for (const u of this.usuariosFiltrados()) {
      const sedeId = (u as any).sedeId ?? 'sin-sede';
      if (!mapa.has(sedeId)) {
        const sede = this.sedes().find((s) => s.id === sedeId);
        mapa.set(sedeId, {
          sedeId,
          nombreSede: sede?.nombre ?? (sedeId === 'sin-sede' ? 'Sin sede' : sedeId),
          usuarios:   [],
        });
      }
      mapa.get(sedeId)!.usuarios.push(u);
    }

    return Array.from(mapa.values());
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.cargando.set(true);
    Promise.all([
      this.http.get<Usuario[]>(`${environment.apiUrl}/usuarios`).toPromise(),
      this.http.get<Sede[]>(`${environment.apiUrl}/sedes`).toPromise(),
    ]).then(([usuarios, sedes]) => {
      this.usuarios.set(usuarios ?? []);
      this.sedes.set(sedes ?? []);
      this.cargando.set(false);
    }).catch(() => this.cargando.set(false));
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  rolMeta(rol: Rol): RolMeta {
    return ROL_META[rol] ?? ROL_META[Rol.Mesero];
  }

  avatarColor(nombre: string): string {
    const idx = nombre.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  }

  // ─── Acciones ─────────────────────────────────────────────────────────────

  abrirFormNuevo(): void {
    this.usuarioEditando.set(null);
    this.mostrarForm.set(true);
  }

  editar(usuario: Usuario): void {
    this.usuarioEditando.set(usuario);
    this.mostrarForm.set(true);
  }

  cerrarForm(): void {
    this.mostrarForm.set(false);
    this.usuarioEditando.set(null);
  }

  toggleActivo(usuario: Usuario): void {
    this.http
      .patch<Usuario>(`${environment.apiUrl}/usuarios/${usuario.id}`, { activo: !usuario.activo })
      .subscribe((actualizado) => {
        this.usuarios.update((list) =>
          list.map((u) => u.id === actualizado.id ? actualizado : u),
        );
      });
  }

  onGuardado(usuario: Usuario): void {
    const existe = this.usuarios().some((u) => u.id === usuario.id);
    if (existe) {
      this.usuarios.update((list) => list.map((u) => u.id === usuario.id ? usuario : u));
    } else {
      this.usuarios.update((list) => [usuario, ...list]);
    }
    this.cerrarForm();
  }
}
