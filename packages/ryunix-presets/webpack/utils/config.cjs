'use strict'
const { getConfig } = require('./settingfile.cjs')
const reactPlugin = require('eslint-plugin-react')

const userConfig = getConfig()

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get nested config value with fallback
 * @param {string} path - Dot notation path (e.g., 'webpack.production')
 * @param {*} defaultValue - Fallback value
 * @returns {*} Config value or default
 */
const getConfigValue = (path, defaultValue) => {
  const keys = path.split('.')
  let value = userConfig

  for (const key of keys) {
    if (value?.[key] === undefined) return defaultValue
    value = value[key]
  }

  return value ?? defaultValue
}

/**
 * Merge objects with defaults
 * @param {Object} defaults - Default values
 * @param {Object} overrides - User overrides
 * @returns {Object} Merged object
 */
const mergeDefaults = (defaults, overrides = {}) => ({
  ...defaults,
  ...overrides,
})

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_ESLINT_RULES = {
  'max-len': ['error', { code: 400 }],
  camelcase: 'off',
  'no-unused-vars': 'warn',
  'no-console': 'off',
  'no-underscore-dangle': ['error', { allow: ['id_', '_id'] }],
  'arrow-body-style': 'off',
  indent: ['warn', 2],
  'consistent-return': 'off',
  'no-else-return': 'off',
  'global-require': 'off',
  'no-param-reassign': ['error', { props: false }],
  'new-cap': 'off',
  'arrow-parens': 'off',
  'prefer-destructuring': 'warn',
  'no-nested-ternary': 'off',
  'react/jsx-uses-vars': 'warn',
  'react/jsx-uses-react': 'off',
  'react/react-in-jsx-scope': 'off',
}

const DEFAULT_SSG_SITEMAP_SETTINGS = {
  changefreq: 'weekly',
  priority: '0.7',
}

// ============================================================================
// Configuration Builder
// ============================================================================

const defaultSettings = {
  experimental: {
    mdx: getConfigValue('experimental.mdx', false),

    ssg: {
      sitemap: {
        enable: getConfigValue('experimental.ssg.sitemap.enable', false),
        baseURL: getConfigValue('experimental.ssg.sitemap.baseURL', false),
        settings: mergeDefaults(
          DEFAULT_SSG_SITEMAP_SETTINGS,
          getConfigValue('experimental.ssg.sitemap.settings', {}),
        ),
      },
      // TODO: DEPRECATED - Remove in future releases
      prerender: getConfigValue('experimental.ssg.prerender', []),
    },

    env: getConfigValue('experimental.env', {}),
  },

  static: {
    favicon: getConfigValue('static.favicon', false),
    customTemplate: getConfigValue('static.customTemplate', false),

    seo: {
      pageLang: getConfigValue('static.seo.pageLang', 'en'),
      title: getConfigValue('static.seo.title', 'Ryunix App'),
      meta: getConfigValue('static.seo.meta', {}),
    },

    ssg: {}, // TODO: Move experimental.ssg here
  },

  eslint: {
    files: getConfigValue('eslint.files', ['**/*.ryx']),

    plugins: mergeDefaults(
      { react: reactPlugin },
      getConfigValue('eslint.plugins', {}),
    ),

    rules: mergeDefaults(
      DEFAULT_ESLINT_RULES,
      getConfigValue('eslint.rules', {}),
    ),
  },

  server: {
    csp: getConfigValue('server.csp', false),
    cors: {
      enabled: getConfigValue('server.cors.enabled', false),
      origin: getConfigValue('server.cors.origin', '*'),
      methods: getConfigValue('server.cors.methods', 'GET, HEAD, OPTIONS'),
      headers: getConfigValue('server.cors.headers', 'Content-Type'),
      credentials: getConfigValue('server.cors.credentials', false),
    },
  },
  webpack: {
    production: getConfigValue('webpack.production', false),
    root: getConfigValue('webpack.root', 'src'),

    output: {
      buildDirectory: getConfigValue(
        'webpack.output.buildDirectory',
        '.ryunix',
      ),
    },

    target: getConfigValue('webpack.target', 'web'),

    resolve: {
      alias: getConfigValue('webpack.resolve.alias', {}),
      fallback: getConfigValue('webpack.resolve.fallback', {}),
      extensions: getConfigValue('webpack.resolve.extensions', []),
    },

    plugins: getConfigValue('webpack.plugins', []),

    devServer: {
      port: getConfigValue('webpack.server.port', 3000),
      proxy: getConfigValue('webpack.server.proxy', []),
      allowedHosts: getConfigValue('webpack.server.allowedHosts', 'auto'),
    },

    externals: getConfigValue('webpack.externals', [{}]),

    module: {
      rules: getConfigValue('webpack.module.rules', []),
    },

    experiments: {
      lazyCompilation: getConfigValue(
        'webpack.experiments.lazyCompilation',
        false,
      ),
    },
  },
}

module.exports = defaultSettings
