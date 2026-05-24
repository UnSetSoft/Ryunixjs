import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'

const tsPlugin = typescript({
  include: ['src/**/*.ts'],
  compilerOptions: {
    allowJs: false,
    declaration: false,
  },
})

const Ryunix = [
  {
    input: 'src/main.js',
    output: {
      file: 'dist/Ryunix.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [tsPlugin, resolve({ extensions: ['.js', '.ts'] }), commonjs()],
  },
  {
    input: 'src/main.js',
    output: [
      {
        file: 'dist/Ryunix.umd.js',
        format: 'umd',
        name: 'Ryunix',
        exports: 'named',
        sourcemap: true,
      },
      {
        file: 'dist/Ryunix.umd.min.js',
        format: 'umd',
        name: 'Ryunix',
        exports: 'named',
        plugins: [terser()],
        sourcemap: true,
      },
    ],
    plugins: [
      tsPlugin,
      resolve({ browser: true, extensions: ['.js', '.ts'] }),
      commonjs(),
    ],
  },
]

export default Ryunix
