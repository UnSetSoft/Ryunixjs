'use strict'
const { getConfig } = require('./settingfile.cjs')
const reactPlugin = require('eslint-plugin-react')
const config = getConfig()

const defaultSettings = {
  experimental: {
    ssg: {
      sitemap: {
        // allow sitemap generation
        enable: config?.experimental?.ssg?.sitemap?.enable
          ? config.experimental.ssg.sitemap.enable
          : false,
        // base url. ex: https://example.com
        baseURL: config?.experimental?.ssg?.sitemap?.baseURL
          ? config.experimental.ssg.sitemap.baseURL
          : false,
        // global settings for the sitemap.
        settings: config?.experimental?.ssg?.sitemap?.settings
          ? {
              changefreq: config.experimental.ssg.sitemap.settings.changefreq
                ? config.experimental.ssg.sitemap.settings.changefreq
                : 'weekly',
              priority: config.experimental.ssg.sitemap.settings.priority
                ? config.experimental.ssg.sitemap.settings.priority
                : '0.7',
            }
          : {
              // default values
              changefreq: 'weekly',
              priority: '0.7',
            },
      },
      // prerendered pages
      // TODO: better form to import from routing system. but for now is the best method.
      // NEXT: rename this! :)
      prerender: config?.experimental?.ssg?.prerender
        ? config.experimental.ssg.prerender
        : [],
    },
    env: config?.experimental?.env ? config.experimental.env : {},
  },
  static: {
    favicon: config?.static?.favicon ? config.static.favicon : false,
    // if is true, public/index.html are required.
    customTemplate: config?.static?.customTemplate
      ? config.static.customTemplate
      : false,

    // global SEO.
    seo: {
      pageLang: config?.static?.seo?.pageLang
        ? config.static.seo.pageLang
        : 'en',
      title: config?.static?.seo?.title
        ? config.static.seo.title
        : 'Ryunix App',
      meta: config?.static?.seo?.meta ? config.static.seo.meta : {},
    },
    ssg: {}, // TODO: Move experimental.ssg here.
  },

  eslint: {
    files: config?.eslint?.files ? config.eslint.files : ['**/*.ryx'],
    plugins: config?.eslint?.plugins
      ? {
          react: reactPlugin,
          ...config.eslint.plugins,
        }
      : {
          react: reactPlugin,
        },
    rules: config?.eslint?.rules
      ? {
          'max-len': config.eslint.rules['max-len']
            ? config.eslint.rules['max-len']
            : ['error', { code: 400 }],
          camelcase: config.eslint.rules.camelcase
            ? config.eslint.rules.camelcase
            : 'off',
          'no-unused-vars': config.eslint.rules['no-unused-vars']
            ? config.eslint.rules['no-unused-vars']
            : 'warn',
          'no-console': config.eslint.rules['no-console']
            ? config.eslint.rules['no-console']
            : 'off',
          'no-underscore-dangle': config.eslint.rules['no-underscore-dangle']
            ? config.eslint.rules['no-underscore-dangle']
            : ['error', { allow: ['id_', '_id'] }],
          'arrow-body-style': config.eslint.rules['arrow-body-style']
            ? config.eslint.rules['arrow-body-style']
            : 'off',
          indent: config.eslint.rules.indent
            ? config.eslint.rules.indent
            : 'warn',
          'consistent-return': config.eslint.rules['consistent-return']
            ? config.eslint.rules['consistent-return']
            : 'off',
          'no-else-return': config.eslint.rules['no-else-return']
            ? config.eslint.rules['no-else-return']
            : 'off',
          'global-require': config.eslint.rules['global-require']
            ? config.eslint.rules['global-require']
            : 'off',
          'no-param-reassign': config.eslint.rules['no-param-reassign']
            ? config.eslint.rules['no-param-reassign']
            : ['error', { props: false }],
          'new-cap': config.eslint.rules['new-cap']
            ? config.eslint.rules['new-cap']
            : 'off',
          'arrow-parens': config.eslint.rules['arrow-parens']
            ? config.eslint.rules['arrow-parens']
            : 'off',
          'prefer-destructuring': config.eslint.rules['prefer-destructuring']
            ? config.eslint.rules['prefer-destructuring']
            : 'warn',
          'no-nested-ternary': config.eslint.rules['no-nested-ternary']
            ? config.eslint.rules['no-nested-ternary']
            : 'off',
          'react/jsx-uses-vars': config.eslint.rules['react/jsx-uses-vars']
            ? config.eslint.rules['react/jsx-uses-vars']
            : 'warn',
          // by default only this
          'react/jsx-uses-react': 'off',
          'react/react-in-jsx-scope': 'off',
          indent: [
            'warn',
            config?.eslint?.rules['indent']
              ? config.eslint.rules['indent'][1]
              : 2,
          ],
          ...config.eslint.rules,
        }
      : {
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
        },
  },

  webpack: {
    production: config?.webpack?.production ?? false,
    root: config?.webpack?.root ? config.webpack.root : 'src',
    output: {
      buildDirectory: config?.webpack?.output?.buildDirectory
        ? config.webpack.output.buildDirectory
        : '.ryunix',
    },
    target: config?.webpack?.target ? config.webpack.target : 'web',
    resolve: {
      alias: config?.webpack?.resolve?.alias
        ? config.webpack.resolve.alias
        : {},
      fallback: config?.webpack?.resolve?.fallback
        ? config.webpack.resolve.fallback
        : {},
      extensions: config?.webpack?.resolve?.extensions
        ? config.webpack.resolve.extensions
        : [],
    },
    plugins: config?.webpack?.plugins ? config.webpack.plugins : [],
    devServer: {
      port: config?.webpack?.server?.port ? config.webpack.server.port : 3000,
      proxy: config?.webpack?.server?.proxy ? config.webpack.server.proxy : [],
      allowedHosts: config?.webpack?.server?.allowedHosts
        ? config.webpack.server.allowedHosts
        : 'auto',
    },
    externals: config?.webpack?.externals ? config.webpack.externals : [{}],
    module: {
      rules: config?.webpack?.module?.rules ? config.webpack.module.rules : [],
    },
    experiments: {
      lazyCompilation: config?.webpack?.experiments?.lazyCompilation
        ? config.webpack.experiments.lazyCompilation
        : false,
    },
  },
}

module.exports = defaultSettings
