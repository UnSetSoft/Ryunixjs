/** Compile-time smoke test for public config types (not executed). */
const _typetest = {
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
export {}
