import { promises as fsp } from 'fs';
import { basename } from 'path';
import { promisify } from 'util';
import simpleTS from './lib/simple-ts';
import del from 'del';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import glob from 'glob';

const globP = promisify(glob);

function removeDefs() {
  return {
    generateBundle(_, bundle) {
      for (const key of Object.keys(bundle)) {
        if (key.includes('.d.ts')) delete bundle[key];
      }
    },
  };
}

function getBabelPlugin({ useESModules = false }) {
  return getBabelOutputPlugin({
    presets: [['@babel/preset-env', { targets: { ie: '10' } }]],
    plugins: [
      [
        '@babel/plugin-transform-runtime',
        {
          useESModules,
        },
      ],
    ],
    runtimeHelpers: true,
    allowAllFormats: true,
  });
}

export default async function ({ watch }) {
  const devBuild = watch;
  await del('dist');

  if (devBuild)
    return {
      input: 'test/index.ts',
      plugins: [
        simpleTS('test', { noBuild: true, watch }),
        commonjs(),
        resolve(),
        // Copy HTML file
        {
          async generateBundle() {
            this.emitFile({
              type: 'asset',
              source: await fsp.readFile('test/index.html'),
              fileName: 'index.html',
            });
          },
        },
      ],
      output: [
        {
          file: 'dist/test/index.js',
          format: 'es',
        },
      ],
      watch: { clearScreen: false },
    };

  return [
    // Main builds
    {
      input: 'src/index.ts',
      plugins: [simpleTS('src')],
      output: [
        {
          file: 'dist/esm/index.js',
          format: 'es',
        },
        {
          file: 'dist/cjs/index.js',
          format: 'cjs',
        },
        {
          file: 'dist/iife/index-min.js',
          format: 'iife',
          name: 'idbKeyval',
          esModule: false,
          plugins: [
            terser({
              compress: { ecma: 2020 },
            }),
            removeDefs(),
          ],
        },
      ],
    },
    // Compat builds
    {
      input: 'src/index.ts',
      external: (id) => {
        if (id.startsWith('@babel/runtime')) return true;
      },
      plugins: [simpleTS('src', { noBuild: true })],
      output: [
        {
          file: 'dist/esm-compat/index.js',
          format: 'es',
          plugins: [getBabelPlugin({ useESModules: true })],
        },
        {
          file: 'dist/cjs-compat/index.js',
          format: 'cjs',
          plugins: [getBabelPlugin({ useESModules: false })],
        },
        {
          file: 'dist/iife-compat/index-min.js',
          format: 'iife',
          name: 'idbKeyval',
          esModule: false,
          plugins: [
            getBabelPlugin({ useESModules: false }),
            terser({
              compress: { ecma: 5 },
            }),
            removeDefs(),
          ],
        },
      ],
    },
    // Size tests
    ...(await globP('size-tests/*.js').then((paths) =>
      paths.map((path) => ({
        input: path,
        plugins: [
          terser({
            compress: { ecma: 2020 },
          }),
        ],
        output: [
          {
            file: `dist/size-tests/${basename(path)}`,
            format: 'es',
          },
        ],
      })),
    )),
  ];
}
