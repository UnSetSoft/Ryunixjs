export interface Settings {
  static: {
    favicon: boolean
    customTemplate: string | false
    seo: {
      pageLang: string
      title: string
      meta: {
        description?: string
        keywords?: string
        subject?: string
        copyright?: string
        language?: string
        robots?: string
        revised?: string
        abstract?: string
        topic?: string
        summary?: string
        classification?: string
        author?: string
        designer?: string
        replyTo?: string
        owner?: string
        url?: string
        identifierURL?: string
        directory?: string
        pageName?: string
        category?: string
        coverage?: string
        distribution?: string
        rating?: string
        revisitAfter?: string
        subtitle?: string
        target?: string
        handheldFriendly?: string
        mobileOptimized?: string
        date?: string
        searchDate?: string
        dcTitle?: string
        resourceLoaderDynamicStyles?: string
        medium?: string
        syndicationSource?: string
        originalSource?: string
        verifyV1?: string
        yKey?: string
        pageKey?: string
        itemPropName?: string
        [key: string]: any
      }
    }
  }

  eslint: {
    files: string[]
    plugins: Record<string, any>
    rules: Record<string, any>
  }

  webpack: {
    production: boolean
    root: string
    output: {
      buildDirectory: string
    }
    target: string
    resolve: {
      alias: Record<string, any>
      fallback: Record<string, any>
      extensions: string[]
    }
    plugins: object[]
    devServer: {
      port: number
      proxy: Record<string, any>
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
}
