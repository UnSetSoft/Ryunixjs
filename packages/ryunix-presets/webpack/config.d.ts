/**
 * Typings for the project-root `ryunix.config.(ts|mts|js|cjs)`.
 *
 * In JS projects, annotate the default export with
 * `import('@unsetsoft/ryunix-presets').RyunixUserConfig` via JSDoc `@type`.
 * See package README and CRA templates for a full example.
 */

/** Values injected into the client bundle (`DefinePlugin`). */
export type RyunixEnv = Record<string, string | number | boolean | undefined>

/** CORS for the dev / preview server. */
export interface RyunixCorsConfig {
  enabled?: boolean
  origin?: string
  methods?: string
  headers?: string
  credentials?: boolean
}

export interface RyunixServerConfig {
  /** Content-Security-Policy header (dev server). */
  csp?: boolean | string
  cors?: RyunixCorsConfig
}

export interface RyunixEslintConfig {
  /** Glob patterns linted in dev (default: all `.ryx` files). */
  files?: string[]
  plugins?: Record<string, unknown>
  rules?: Record<string, unknown>
}

export interface RyunixWebpackResolveConfig {
  alias?: Record<string, string | false | string[]>
  fallback?: Record<string, string | false | string[]>
  extensions?: string[]
}

export interface RyunixWebpackDevServerConfig {
  allowedHosts?: 'auto' | 'all' | string[]
}

export interface RyunixWebpackExperimentsConfig {
  lazyCompilation?: boolean
}

export interface RyunixWebpackConfig {
  production?: boolean
  target?: string
  resolve?: RyunixWebpackResolveConfig
  plugins?: unknown[]
  devServer?: RyunixWebpackDevServerConfig
  /**
   * Also read by the loader (alias of `devServer.allowedHosts`).
   * @see RyunixWebpackDevServerConfig.allowedHosts
   */
  server?: {
    allowedHosts?: 'auto' | 'all' | string[]
  }
  externals?: unknown[]
  module?: {
    rules?: unknown[]
  }
  experiments?: RyunixWebpackExperimentsConfig
}

export interface RyunixHydrationConfig {
  /** Recovery strategy for hydration mismatches (default: `"boundary"`). */
  recover?: 'boundary' | 'root' | 'none'
  /** Boundary placement strategy for route wrapping (default: `"route"`). */
  boundaries?: 'route' | 'server-only' | 'all-layouts'
  /** Emit more verbose mismatch warnings in development. */
  strict?: boolean
}

export interface RyunixSitemapSettings {
  changefreq?: string
  priority?: string
}

export interface RyunixLegacySsgSitemap {
  enable?: boolean
  baseURL?: string | false
  settings?: RyunixSitemapSettings
  /** Routes to prerender when file-based SSG manifest is empty. */
  prerender?: string[]
}

export interface RyunixLegacySsgConfig {
  sitemap?: RyunixLegacySsgSitemap
}

export interface RyunixLegacySeoConfig {
  pageLang?: string
  title?: string
  meta?: Record<string, string | string[] | undefined>
}

export interface RyunixLegacyConfig {
  seo?: RyunixLegacySeoConfig
  /** Custom HTML template path, or `false` to disable. */
  template?: string | false
  ssg?: RyunixLegacySsgConfig
}

/** Options for global semantic HTML styles (`style: true` or object). */
export interface RyunixStyleFontFaceSource {
  /** Path or URL to the font file (e.g. `/assets/fonts/brand.woff2`). */
  url: string
  format?: 'woff2' | 'woff' | 'truetype' | 'opentype'
}

/** Custom or third-party font configuration. */
export interface RyunixStyleFontConfig {
  /** CSS `font-family` name used in `--ryx-font-sans`. */
  family: string
  /**
   * Self-hosted files for `@font-face`.
   * String paths or `{ url, format }` objects (woff2 recommended).
   */
  src?: string | Array<string | RyunixStyleFontFaceSource>
  /** Fallback stack after `family`. */
  fallback?: string
  /** Letter-spacing applied to body text (default varies by preset). */
  tracking?: string
  weight?: string | number
  style?: 'normal' | 'italic'
  /**
   * Load from Google Fonts instead of self-hosting.
   * Example: `"Inter:wght@400;500;600;700"`.
   */
  google?: string
}

/** Built-in readable presets (via [fonts.bunny.net](https://fonts.bunny.net)). */
export type RyunixStyleFontPreset =
  | 'system'
  | 'inter'
  | 'source-sans'
  | 'nunito'

export type RyunixStyleFontInput = RyunixStyleFontPreset | RyunixStyleFontConfig

/** Normalized font config used by the preset at build time. */
export interface RyunixStyleFontResolved {
  id: string
  family: string | null
  links: string[]
  sans: string
  tracking: string
  fontFace: string
}

export interface RyunixStyleConfig {
  /** Enable semantic styles (default: `false`; use `style: true` to opt in). */
  enabled?: boolean
  /** Page padding around app content. `false` disables. Default: `1.5rem`. */
  padding?: string | false
  /** Max width for `main`. `false` disables. Default: `72rem`. */
  maxWidth?: string | false
  /**
   * Typography: preset name, custom `@font-face`, or Google Fonts spec.
   * Default: `"system"` (native stack, slightly softened tracking).
   */
  font?: RyunixStyleFontInput
}

/** Normalized `style` config after preset defaults are applied. */
export interface RyunixStyleResolvedConfig {
  enabled: boolean
  padding: string | null
  maxWidth: string | null
  font: RyunixStyleFontResolved
}

export interface RyunixI18nCookieConfig {
  name?: string
  maxAgeSeconds?: number
}

/** Locale routing and message catalogs (`createI18n` / `createAppI18n`). */
export interface RyunixI18nConfig {
  locales: string[]
  defaultLocale: string
  localeLabels?: Record<string, string>
  cookie?: boolean | RyunixI18nCookieConfig
}

/**
 * Modern options for `ryunix.config.js` (merged with defaults in `config.cjs`).
 */
export interface RyunixConfig {
  /** Server-side rendering (default: `true`). */
  ssr?: boolean
  /** Hydration behavior and mismatch recovery policy. */
  hydration?: RyunixHydrationConfig
  /** MDX pages and loaders (default: `false`). */
  mdx?: boolean
  /**
   * Global semantic HTML styles (typography, tables, forms, MDX alerts).
   * Theme toggles via `class="dark"` on `<html>`. Default: `false` (`style: true` to enable).
   */
  style?: boolean | RyunixStyleConfig
  /** `DefinePlugin` env map exposed as `ryunix.config.env`. */
  env?: RyunixEnv
  /** Source root when not using `/app` at project root (default: `"src"`). */
  rootDir?: string
  /** Build output directory (default: `".ryunix"`). */
  buildDir?: string
  /** Dev server port (default: `3000`). */
  port?: number
  /** Webpack devServer `proxy` (default: `[]`). */
  proxy?: unknown[] | Record<string, unknown>
  /** Favicon path, or `true` for `public/favicon.png`. */
  favicon?: boolean | string
  /** Transpiler for application sources: `"swc"` (default) or `"babel"`. */
  compiler?: 'swc' | 'babel'
  /** Locale routing (`/[locale]/…`) and optional message catalogs. */
  i18n?: RyunixI18nConfig
  /** Verbose Ryunix / webpack logging. */
  debug?: boolean
  eslint?: RyunixEslintConfig
  server?: RyunixServerConfig
  webpack?: RyunixWebpackConfig
  legacy?: RyunixLegacyConfig
}

/**
 * Deprecated keys still accepted by the config loader (warnings in the terminal).
 */
export interface RyunixDeprecatedConfig {
  /**
   * @deprecated `hydrate` was removed from public config.
   * Use `hydration.recover` and CLI/env debug flags instead.
   */
  hydrate?: boolean
  experimental?: {
    /** @deprecated Use root `ssr`. */
    ssr?: boolean
    /** @deprecated Use root `mdx`. */
    mdx?: boolean
    /** @deprecated Use root `env`. */
    env?: RyunixEnv
    ssg?: {
      sitemap?: RyunixLegacySsgSitemap
      /** @deprecated Prefer App Router metadata; routes for legacy prerender. */
      prerender?: string[]
    }
  }
  static?: {
    /** @deprecated Use root `favicon`. */
    favicon?: boolean | string
    seo?: RyunixLegacySeoConfig
    /** @deprecated Use App Router `layout.ryx`. */
    customTemplate?: string | false
  }
}

/** Shape allowed in `ryunix.config.js` at the project root. */
export type RyunixUserConfig = RyunixConfig & RyunixDeprecatedConfig

/** @deprecated Use `RyunixUserConfig`. */
export type Settings = RyunixUserConfig
