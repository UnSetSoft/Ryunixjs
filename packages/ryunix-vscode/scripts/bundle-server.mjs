import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['server/src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'server/out/server.js',
  /** Runtime dependency — avoids bundling source-map-support / legacy Buffer paths */
  external: ['typescript'],
  logLevel: 'info',
})
