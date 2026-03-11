export interface Settings {
  // Modern / First-Class Configuration
  ssr?: boolean
  mdx?: boolean
  env?: Record<string, any>
  rootDir?: string
  buildDir?: string
  port?: number
  proxy?: any[] | Record<string, any>
  favicon?: boolean | string
  debug?: boolean

  // Citizens of the core
  eslint?: {
    files: string[]
    plugins: Record<string, any>
    rules: Record<string, any>
  }

  server?: {
    csp: boolean | string
    cors: {
      enabled: boolean
      origin: string
      methods: string
      headers: string
      credentials: boolean
    }
  }

  webpack?: {
    production: boolean
    target: string
    resolve: {
      alias: Record<string, any>
      fallback: Record<string, any>
      extensions: string[]
    }
    plugins: object[]
    devServer: {
      allowedHosts: 'auto' | 'all' | string[]
    }
    externals: object[]
    module: {
      rules: object[]
    }
    experiments: {
      lazyCompilation: boolean
    }
  }

  // Legacy Configuration (The old way)
  legacy?: {
    seo?: {
      pageLang?: string
      title?: string
      meta?: Record<string, any>
    }
    template?: string | false
    ssg?: {
      sitemap?: {
        enable: boolean
        baseURL: string | false
        settings: {
          changefreq: string
          priority: string
        }
      }
    }
  }

  /**
   * @deprecated Use the root 'static' or 'legacy' property instead.
   */
  static?: any
  /**
   * @deprecated Use the root 'ssr', 'mdx', or 'legacy' property instead.
   */
  experimental?: any
}
