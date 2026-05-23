import type { RyunixUserConfig } from './config'

/** Compile-time smoke test for public config types (not executed). */
const _typetest: RyunixUserConfig = {
  ssr: true,
  compiler: 'swc',
  env: { API_URL: 'http://localhost:3000' },
  webpack: {
    resolve: { alias: { '@app': 'src' } },
    experiments: { lazyCompilation: false },
  },
  experimental: {
    ssg: { prerender: ['/'] },
  },
}

void _typetest
