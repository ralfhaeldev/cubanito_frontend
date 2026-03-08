import { Pipe, PipeTransform } from '@angular/core';

/** Formatea un número como moneda COP: $12.500 */
@Pipe({ name: 'cop', standalone: true })
export class CopPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style:                 'currency',
      currency:              'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
