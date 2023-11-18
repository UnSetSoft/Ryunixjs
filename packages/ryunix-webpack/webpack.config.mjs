import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import {
  getPackageManager,
  ENV_HASH,
  getEnviroment,
  resolveApp,
} from './utils/index.mjs'
import fs from 'fs'
import config from './utils/config.cjs'
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

export default {
  mode: config.webpack.production ? 'production' : 'development',
  context: resolveApp(dir, config.webpack.output.buildDirectory),
  entry: './main.ryx',
  devtool: 'source-map',
  output: {
    path: resolveApp(dir, config.buildDirectory),
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
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    },
    port: config.webpack.devServer.port,
    proxy: config.webpack.devServer.proxy,
  },
  optimization: {
    moduleIds: 'named',
    minimize: true,
    concatenateModules: true,
    minimizer: [
      new TerserPlugin({
        minify: TerserPlugin.swcMinify,
        terserOptions: {
          compress: {
            dead_code: true,
            // Zero means no limit.
            passes: 0,
          },
          format: {
            preamble: '',
          },
        },
      }),
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
        test: /\.(js|jsx|ryx|)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              [
                '@babel/plugin-transform-react-jsx',
                {
                  pragma: 'Ryunix.createElement',
                  pragmaFrag: 'Ryunix.Fragments',
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.sass|css$/,
        exclude: /(node_modules)/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|gif|svg|ico)$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets/image/',
            },
          },
        ],
      },
      {
        test: /\.(mp3|mp4|pdf)$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets/files/',
            },
          },
        ],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg|pdf|ico)$/, // to import images and fonts
        exclude: /(node_modules)/,
        loader: 'url-loader',
        options: { limit: false },
      },
      {
        test: /\.ico$/i,
        type: 'asset/resource',
        exclude: /(node_modules)/,
        generator: {
          filename: '[name][ext][query]',
        },
      },
    ],
  },
  resolve: {
    alias:
      config.webpack.resolve.alias && getAlias(config.webpack.resolve.alias),
    extensions: ['.*', '.js', '.jsx', '.ryx'],
    fallback: config.webpack.resolve.fallback,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: config.static.seo.title,
      favicon: config.static.favicon && join(dir, 'public', 'favicon.png'),
      meta: config.static.seo.meta,
      template: join(__dirname, 'template', 'index.html'),
    }),
  ],
  externals: {
    ryunix: 'Ryunix',
  },
}
