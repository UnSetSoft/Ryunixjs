import type { RyunixUserConfig } from '../config.d.ts'

/** Merged defaults from `config.cjs` (user config + preset defaults). */
type PresetRuntimeConfig = RyunixUserConfig & {
  buildDir: string
  port: number
  compiler: string
  debug: boolean
  ssr: boolean
  rootDir: string
  mdx: boolean
  favicon: boolean | string
  eslint: NonNullable<RyunixUserConfig['eslint']> & { files: string[] }
  webpack: NonNullable<RyunixUserConfig['webpack']> & {
    production: boolean
    root: string
    externals: unknown[]
    devServer: Record<string, unknown>
    output: Record<string, unknown>
  }
  legacy: NonNullable<RyunixUserConfig['legacy']> & {
    ssg?: {
      prerender?: string[]
      sitemap?: Record<string, unknown>
    }
  }
  static: Record<string, unknown>
  server: NonNullable<RyunixUserConfig['server']>
  [key: string]: unknown
}

declare const config: PresetRuntimeConfig

export default config
