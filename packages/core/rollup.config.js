import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

const Ryunix = [
  {
    input: '.generated/main.js',
    output: {
      file: 'dist/Ryunix.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [resolve({ extensions: ['.js'] }), commonjs()],
  },
  {
    input: '.generated/main.js',
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
    plugins: [resolve({ browser: true, extensions: ['.js'] }), commonjs()],
  },
]

export default Ryunix
