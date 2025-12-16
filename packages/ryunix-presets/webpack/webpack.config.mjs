import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import webpack from 'webpack'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import ESLintPlugin from 'eslint-webpack-plugin'
import eslintConfig from './eslint.config.mjs'
import {
  getPackageManager,
  ENV_HASH,
  getEnviroment,
  resolveApp,
} from './utils/index.mjs'
import fs from 'fs'
import config from './utils/config.cjs'
import Dotenv from 'dotenv-webpack'
import { getPackageVersion } from './utils/index.mjs'
import RyunixRoutesPlugin from './utils/ssgPlugin.mjs'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import rehypeHighlight from 'rehype-highlight'

const __filename = fileURLToPath(import.meta.url)

const __dirname = dirname(__filename)

let dir

const manager = getPackageManager()

const loadDir = (pkm) => {
  try {
    switch (pkm) {
      case 'pnpm':
        throw new Error(`The manager ${pkm} is not supported.`)
      default:
        return process.cwd()
    }
  } catch (e) {
    console.error(`[RYUNIX INIT ERROR]: ${e.message}`)
    process.exit(1)
  }
}

dir = loadDir(manager)

/**
 * Convert alias object to webpack alias format
 * @param {Object} object - Alias configuration object
 * @returns {Object} Webpack-compatible alias object
 */
function getAlias(object) {
  return Object.entries(object)
    .filter(([k, v]) => v != null)
    .reduce((accum, [k, v]) => {
      accum[k] = resolveApp(dir, v)
      return accum
    }, {})
}

const { version } = await getPackageVersion()

export default {
  experiments: {
    lazyCompilation: config.webpack.experiments.lazyCompilation,
  },
  context: resolveApp(dir, config.webpack.root),
  entry: './main.ryx',
  devtool: config.webpack.production ? 'source-map' : false,
  output: {
    path: resolveApp(dir, `${config.webpack.output.buildDirectory}/static`),
    publicPath: '/',
    chunkFilename: './assets/js/[name].[fullhash:8].bundle.js',
    assetModuleFilename: './assets/media/[name].[hash][ext]',
    filename: './assets/js/[name].[fullhash:8].bundle.js',
    devtoolModuleFilenameTemplate: 'ryunix/[resource-path]',
    clean: config.experimental.ssg.prerender.length > 0 ? false : true,
  },
  target: config.webpack.target,
  devServer: {
    watchFiles: [resolveApp(dir, 'src/**/*')],
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
    minimize: config.webpack.production === true,
    minimizer: config.webpack.production
      ? [
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
        ]
      : [],
  },
  cache: {
    type: 'filesystem',
    version: ENV_HASH(getEnviroment()),
    cacheDirectory: resolveApp(
      dir,
      `${config.webpack.output.buildDirectory}/cache/webpack`,
    ),
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
      // MDX files support if enabled in config  
      config.experimental.mdx && {
        test: /\.mdx?$/,
        use: [
          {
            loader: '@mdx-js/loader',
            options: {

              jsxImportSource: '@unsetsoft/ryunixjs',
              providerImportSource: '@unsetsoft/ryunixjs',

              remarkPlugins: [
                remarkGfm,
                remarkFrontmatter,
                [remarkMdxFrontmatter, { name: 'frontmatter' }],
              ],
              rehypePlugins: [rehypeHighlight],
            },
          },
        ],
      },
      // JavaScript/JSX/RYX files
      {
        test: /\.(js|jsx|ryx)$/,
        exclude: /node_modules/,
        use: [
          'thread-loader',
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: 'defaults and not IE 11',
                    useBuiltIns: false,
                    modules: false,
                    bugfixes: true,
                  },
                ],
                '@babel/preset-react',
              ],
              cacheDirectory: resolveApp(
                dir,
                `${config.webpack.output.buildDirectory}/cache/babel`,
              ),
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
        ],
      },
      // CSS/SASS
      {
        test: /\.s[ac]ss|css$/i,
        exclude: /node_modules/,
        use: [
          config.webpack.production
            ? MiniCssExtractPlugin.loader
            : 'style-loader',
          'css-loader',
        ],
      },
      // Images
      {
        test: /\.(jpg|jpeg|png|gif|svg|ico)$/,
        exclude: /node_modules/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name].[hash][ext]',
        },
      },
      // Media files
      {
        test: /\.(mp3|mp4|pdf)$/,
        exclude: /node_modules/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/files/[name].[hash][ext]',
        },
      },
      // Custom rules from config
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
      '.mdx',
      '.md',
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
        systemvars: false,
        ignoreStub: true,
      }),
    new RyunixRoutesPlugin({
      routesPath: resolveApp(dir, `${config.webpack.root}/pages/routes.ryx`),
      outputPath: resolveApp(
        dir,
        `${config.webpack.output.buildDirectory}/ssg/routes.json`,
      ),
    }),
    new webpack.DefinePlugin({
      'ryunix.config.env': JSON.stringify(config.experimental.env),
    }),
    // ESLintPlugin - excluir archivos MDX y MD
    new ESLintPlugin({
      cwd: dir,
      files: ['**/*.ryx', ...config.eslint.files],
      extensions: ['js', 'ryx', 'jsx'],
      // Excluir explícitamente archivos MDX y MD
      exclude: ['node_modules', '**/*.mdx', '**/*.md'],
      emitError: true,
      emitWarning: true,
      failOnWarning: false,
      failOnError: false,
      overrideConfigFile: true,
      overrideConfig: eslintConfig[0],
    }),
    new HtmlWebpackPlugin({
      pageLang: config.static.seo.pageLang,
      title: config.static.seo.title,
      favicon: config.static.favicon
        ? join(dir, 'public', 'favicon.png')
        : false,
      meta: config.static.seo.meta,
      template: config.static.customTemplate
        ? join(dir, 'public', 'index.html')
        : join(__dirname, 'template', 'index.html'),
      info: {
        framework: 'Ryunix',
        version,
        mode: config.webpack.production ? 'production' : 'dev',
      },
    }),
    config.webpack.production &&
      new MiniCssExtractPlugin({
        filename: 'assets/css/[name].[contenthash].css',
      }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolveApp(dir, 'public'),
          to: resolveApp(dir, `${config.webpack.output.buildDirectory}/static`),
          globOptions: {
            ignore: [
              '**/template.html',
              '**/index.html',
              '**/*.html',
              '**/favicon.png',
            ],
          },
          filter: (resourcePath) => {
            try {
              return !resourcePath.toLowerCase().endsWith('.html')
            } catch (e) {
              return true
            }
          },
          noErrorOnMissing: true,
        },
      ],
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
