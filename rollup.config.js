import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

const plugins = [
  resolve(),
  commonjs(),
]

export default [
  {
    input: 'lib/callers.js',
    output: {
      name: 'ReadiumGlueCallers',
      file: './dist/ReadiumGlue-callers-evidentpoint.js',
      format: 'umd',
      sourcemap: true,
      globals: {
        '@readium/glue-rpc': 'ReadiumGlueRPC',
        '@readium/glue-shared': 'ReadiumGlueShared',
      },
      extend: true,
    },
    external: ['@readium/glue-rpc', '@readium/glue-shared'],
    plugins,
  },
  {
    input: 'lib/services.js',
    output: {
      name: 'ReadiumGlueServices',
      file: './dist/ReadiumGlue-services-evidentpoint.js',
      format: 'umd',
      sourcemap: true,
      globals: {
        '@readium/glue-rpc': 'ReadiumGlueRPC',
        '@readium/glue-shared': 'ReadiumGlueShared',
      },
      extend: true,
    },
    external: ['@readium/glue-rpc', '@readium/glue-shared'],
    plugins,
  },
];
