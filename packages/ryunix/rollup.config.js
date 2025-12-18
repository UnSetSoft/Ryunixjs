import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

const Ryunix = [
  // ESM BUILD (para bundlers)
  {
    input: 'src/main.js',
    output: {
      file: 'dist/Ryunix.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [resolve({ extensions: ['.js', '.mjs'] }), commonjs()],
  },

  // UMD BUILD (para browser)
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
    plugins: [resolve({ browser: true }), commonjs()],
  },
]

export default Ryunix
