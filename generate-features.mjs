#!/usr/bin/env node
/**
 * Genera componentes y archivos de rutas para cada feature.
 * Ejecutar desde la raíz del proyecto:
 *   node generate-features.mjs
 */
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const NG_BASE = 'app/features';
const FS_BASE = 'src/app/features';

const features = [
  {
    name: 'dashboard',
    components: ['dashboard'],
  },
  {
    name: 'pedidos',
    components: ['lista-pedidos', 'form-pedido', 'detalle-pedido'],
  },
  {
    name: 'productos',
    components: ['lista-productos', 'form-producto'],
  },
  {
    name: 'inventario',
    components: ['inventario'],
  },
  {
    name: 'caja',
    components: ['caja'],
  },
  {
    name: 'movimientos',
    components: ['lista-movimientos', 'form-movimiento'],
  },
  {
    name: 'reportes',
    components: ['reportes'],
  },
  {
    name: 'usuarios',
    components: ['lista-usuarios', 'form-usuario'],
  },
  {
    name: 'sedes',
    components: ['lista-sedes', 'form-sede'],
  },
];

const ng = (cmd, options = '') => {
  console.log(`  → ng ${cmd} ${options}`.trim());
  execSync(`npx ng generate ${cmd} ${options}`.trim(), { stdio: 'inherit' });
};

for (const feature of features) {
  console.log(`\n📦 Feature: ${feature.name}`);

  // Componentes
  for (const comp of feature.components) {
    ng(`component ${NG_BASE}/${feature.name}/components/${comp}`, '--standalone');
  }

  // Servicio (no soporta --standalone)
  ng(`service ${NG_BASE}/${feature.name}/services/${feature.name}`);

  // Archivo de rutas
  const routesPath = join(FS_BASE, feature.name, `${feature.name}.routes.ts`);
  const firstName  = feature.components[0];
  const className  = firstName.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('') + 'Component';
  const importPath = `./components/${firstName}/${firstName}.component`;

  const content = `import { Routes } from '@angular/router';

export const ${feature.name.toUpperCase()}_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('${importPath}').then((m) => m.${className}),
  },
];
`;
  mkdirSync(join(FS_BASE, feature.name), { recursive: true });
  writeFileSync(routesPath, content, 'utf8');
  console.log(`  ✅ ${routesPath}`);
}

console.log('\n✅ Todos los features generados.');
