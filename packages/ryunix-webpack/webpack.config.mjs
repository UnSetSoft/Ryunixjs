import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import webpack from 'webpack'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import {
  getPackageManager,
  ENV_HASH,
  getEnviroment,
  resolveApp,
  RYUNIX_APP,
} from './utils/index.mjs'
import fs from 'fs'
import config from './utils/config.cjs'
import Dotenv from 'dotenv-webpack'
import { getPackageVersion } from './utils/index.mjs'

const __filename = fileURLToPath(import.meta.url)

const __dirname = dirname(__filename)

let dir

const manager = getPackageManager()
if (manager === 'yarn' || manager === 'npm' || manager === 'bun') {
  dir = dirname(join(__dirname, '..', '..'))
} else if (manager === 'pnpm') {
  throw new Error(`The manager ${manager} is not supported.`)
}

function getAlias(object) {
  const output = Object.entries(object)
    .filter(([k, v]) => {
      return true // some irrelevant conditions here
    })
    .reduce((accum, [k, v]) => {
      accum[k] = resolveApp(dir, v)
      return accum
    }, {})
  return output
}

const { version } = await getPackageVersion()

export default {
  // context: src
  context: resolveApp(dir, config.webpack.root),
  entry: './main.ryx',
  devtool:
    process.env.NODE_ENV === 'development' ? 'cheap-module-source-map' : false,
  output: {
    // path: .ryunix
    path: resolveApp(dir, config.webpack.output.buildDirectory),
    publicPath: '/',
    chunkFilename: './assets/js/[name].[fullhash:8].bundle.js',
    assetModuleFilename: './assets/media/[name].[hash][ext]',
    filename: './assets/js/[name].[fullhash:8].bundle.js',
    devtoolModuleFilenameTemplate: 'ryunix/[resource-path]',
    clean: true,
  },
  target: config.webpack.target,
  devServer: {
    hot: true,
    historyApiFallback: {
      index: '/',
      disableDotRule: true,
    },
    liveReload: false,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    },
    allowedHosts: config.webpack.devServer.allowedHosts,
    port: config.webpack.devServer.port,
    proxy: config.webpack.devServer.proxy,
  },
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 70000,
    },
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            dead_code: true,
            passes: 2,
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
  },
  cache: {
    type: 'filesystem',
    version: ENV_HASH(getEnviroment()),
    cacheDirectory: resolveApp(dir, 'node_modules/.cache'),
    store: 'pack',
    buildDependencies: {
      defaultWebpack: ['webpack/lib/'],
      config: [__filename],
    },
  },
  infrastructureLogging: {
    level: 'none',
  },
  stats: 'errors-warnings',
  module: {
    rules: [
      {
        test: /\.(js|jsx|ryx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            cacheDirectory: true,
            plugins: [
              [
                '@babel/plugin-transform-react-jsx',
                {
                  pragma: 'Ryunix.createElement',
                  pragmaFrag: 'Ryunix.Fragment',
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.s[ac]ss|css$/,
        exclude: /node_modules/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|gif|svg|ico)$/,
        exclude: /node_modules/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name].[hash][ext]',
        },
      },
      {
        test: /\.(mp3|mp4|pdf)$/,
        exclude: /node_modules/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/files/[name].[hash][ext]',
        },
      },
      ...config.webpack.module.rules,
    ],
  },
  resolve: {
    alias:
      config.webpack.resolve.alias && getAlias(config.webpack.resolve.alias),
    extensions: [
      '.*',
      '.js',
      '.jsx',
      '.ryx',
      ...config.webpack.resolve.extensions,
    ],
    fallback: config.webpack.resolve.fallback,
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    fs.existsSync(resolveApp(dir, '.env')) &&
      new Dotenv({
        path: resolveApp(dir, '.env'),
        prefix: 'ryunix.env.RYUNIX_APP_',
      }),
    new HtmlWebpackPlugin({
      pageLang: config.static.seo.pageLang,
      title: config.static.seo.title,
      favicon: config.static.favicon && join(dir, 'public', 'favicon.png'),
      meta: config.static.seo.meta,
      template: config.static.customTemplate
        ? join(dir, 'public', 'index.html')
        : join(__dirname, 'template', 'index.html'),
      info: {
        framework: 'Ryunix',
        version,
      },
    }),
    new MiniCssExtractPlugin({
      filename: 'assets/css/[name].[contenthash].css',
    }),
    ...config.webpack.plugins,
  ].filter(Boolean),
  externals: [
    {
      ryunix: '@unsetsoft/ryunixjs',
    },
    ...config.webpack.externals,
  ],
}
