import { Component, input } from '@angular/core';
import { EstadoPedido } from '../../models';

const CONFIG: Record<EstadoPedido, { label: string; css: string }> = {
  [EstadoPedido.Pendiente]:  { label: 'Pendiente',  css: 'badge-pendiente' },
  [EstadoPedido.EnProceso]:  { label: 'En Proceso', css: 'badge-en-proceso' },
  [EstadoPedido.Enviado]:    { label: 'Enviado',    css: 'badge-enviado' },
  [EstadoPedido.Entregado]:  { label: 'Entregado',  css: 'badge-entregado' },
  [EstadoPedido.Finalizado]: { label: 'Finalizado', css: 'badge-finalizado' },
  [EstadoPedido.Rechazado]:  { label: 'Rechazado',  css: 'badge-rechazado' },
};

@Component({
  selector: 'app-badge-estado',
  standalone: true,
  template: `
    <span [class]="cfg.css">
      <span class="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {{ cfg.label }}
    </span>
  `,
})
export class BadgeEstadoComponent {
  // Input signal (Angular 17.1+)
  estado = input.required<EstadoPedido>();

  get cfg() {
    return CONFIG[this.estado()] ?? { label: this.estado(), css: 'badge' };
  }
}
