'use strict'
const fs = require('fs')
const path = require('path')
const defaultConfigFile = path.join(
  __dirname,
  '../../../../',
  'ryunix.config.js',
)

const CommonConfigFile = path.join(
  __dirname,
  '../../../../',
  'ryunix.config.cjs',
)

let config = {}

if (fs.existsSync(defaultConfigFile)) {
  config = require('../../../../ryunix.config.js')
  console.log('[info] configuration file was found.')
} else if (fs.existsSync(CommonConfigFile)) {
  config = require('../../../../ryunix.config.cjs')
  console.log('[info] configuration file was found.')
}

const defaultSettings = {
  static: {
    favicon: config?.static?.favicon ? config.static.favicon : true,
    seo: {
      title: config?.static?.seo?.title
        ? config.static.seo.title
        : 'Ryunix App',
      meta: config?.static?.seo?.meta
        ? config.static.seo.meta
        : {
            description: 'Web site created using @unsetsoft/cra',
          },
    },
  },

  eslint: {
    files:  config?.eslint?.files ? config.eslint.files : [],
    plugins: config?.eslint?.plugins ? config.eslint.plugins : {},
    rules: config?.eslint?.rules ? config.eslint.rules : {
      'no-unused-vars': 'off',
      "indent": ["error", 2],
      "linebreak-style": 1,
      "quotes": ["error", "double"]
    },
  },

  webpack: {
    production: config?.webpack?.production ? config.webpack.production : false,
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
      proxy: config?.webpack?.server?.proxy ? config.webpack.server.proxy : {},
      allowedHosts: config?.webpack?.server?.allowedHosts
        ? config.webpack.server.allowedHosts
        : 'auto',
    },
    externals: config?.webpack?.externals ? config.webpack.externals : [{}],
    module: {
      rules: config?.webpack?.module?.rules ? config.webpack.module.rules : [],
    },
  },
}

module.exports = defaultSettings
