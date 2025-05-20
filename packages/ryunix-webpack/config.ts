export interface staticInfoSEO {
  pageLang?: string | 'en'
  title?: string | 'Ryunix App'
  meta?: {
    charset?: string
    keywords?: string
    description?: string
    subject?: string
    copyright?: string
    language?: string | 'EN'
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

export interface staticInfo {
  favicon?: boolean
  customTemplate?: string | false
  seo?: staticInfoSEO
}

export interface WebPackSettings {
  production?: boolean | false
  root?: string | 'src'
  output?: {
    buildDirectory: string | '.ryunix'
  }
  target?: string | 'web'
  resolve?: {
    alias?: {
      [key: string]: any
    }
    fallback?: {
      [key: string]: any
    }
    extensions?: {
      [key: string]: any
    }
  }
  plugin?: object[]
  devServer?: {
    port?: number | 3000
    proxy?: {
      [key: string]: any
    }
    allowedHosts?: 'auto' | 'all' | [string]
  }
  externals?: object[]
  module?: {
    rules?: object[]
  }
}

export interface Setting extends Record<string, any> {
  static?: staticInfo
  webpack?: WebPackSettings
}
