#!/usr/bin/env node
/**
 * Genera componentes y archivos de rutas para cada feature.
 * Ejecutar desde la raíz del proyecto:
 *   node generate-features.mjs
 */
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ⚠️  Angular CLI ya resuelve desde src/app/ — NO incluir ese prefijo aquí
const BASE = 'features';

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

const ng = (cmd) => {
  console.log(`  → ng generate ${cmd}`);
  execSync(`npx ng generate ${cmd}`, { stdio: 'inherit' });
};

for (const feature of features) {
  console.log(`\n📦 Feature: ${feature.name}`);

  // Componentes standalone (--standalone es válido para componentes)
  for (const comp of feature.components) {
    ng(`component ${BASE}/${feature.name}/components/${comp} --standalone`);
  }

  // Servicios — en Angular 21 son Injectable por defecto, sin flag --standalone
  ng(`service ${BASE}/${feature.name}/services/${feature.name}`);

  // Archivo de rutas manual (ng generate no tiene un schematic para routes)
  const routesDir  = join('src', 'app', BASE, feature.name);
  const routesPath = join(routesDir, `${feature.name}.routes.ts`);

  const firstName = feature.components[0];
  const className =
    firstName
      .split('-')
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join('') + 'Component';
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
  mkdirSync(routesDir, { recursive: true });
  writeFileSync(routesPath, content, 'utf8');
  console.log(`  ✅ ${routesPath}`);
}

console.log('\n✅ Todos los features generados.');
