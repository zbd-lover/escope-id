import { defineConfig } from 'rollup'
import nodeResolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import { terser } from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {})
].map(name => RegExp(`^${name}($|/)`))

export default defineConfig([
  // CommonJS
  {
    input: './src/index.ts',
    output: { file: 'lib/escope-id.js', format: 'commonjs', indent: false },
    external,
    plugins: [
      typescript({
        emitDeclarationOnly: false,
        sourceMap: false,
        module: 'esnext'
      }),
      nodeResolve(),
      babel()
    ]
  },

  // ES
  {
    input: './src/index.ts',
    output: { file: 'es/escope-id.js', format: 'es', indent: false },
    external,
    plugins: [
      typescript({
        emitDeclarationOnly: false,
        sourceMap: false,
        module: 'esnext'
      }),
      commonjs(),
      nodeResolve(),
      babel()
    ]
  },

  // ES for Browsers
  {
    input: './src/index.ts',
    output: { file: 'es/escope-id.mjs', format: 'es', indent: false },
    external,
    plugins: [
      typescript({
        emitDeclarationOnly: false,
        sourceMap: false,
        module: 'esnext'
      }),
      commonjs(),
      nodeResolve(),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      babel({
        exclude: 'node_modules/**',
        skipPreflightCheck: true,
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true
        }
      })
    ]
  },

  // UMD Development
  {
    input: './src/index.ts',
    output: {
      file: 'dist/escope-id.js',
      format: 'umd',
      name: 'EscopeId',
      indent: false,
      exports: 'named'
    },
    plugins: [
      typescript({
        emitDeclarationOnly: false,
        sourceMap: false,
        module: 'esnext'
      }),
      commonjs(),
      nodeResolve(),
      babel({
        exclude: 'node_modules/**',
      }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('development')
      })
    ]
  },

  // UMD Production
  {
    input: './src/index.ts',
    output: {
      file: 'dist/escope-id.min.js',
      format: 'umd',
      name: 'EscopeId',
      indent: false,
      exports: 'named'
    },
    plugins: [
      typescript({
        emitDeclarationOnly: false,
        sourceMap: false,
        module: 'esnext'
      }),
      commonjs(),
      nodeResolve(),
      babel({
        exclude: 'node_modules/**',
        skipPreflightCheck: true,
      }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true
        }
      })
    ]
  }
])