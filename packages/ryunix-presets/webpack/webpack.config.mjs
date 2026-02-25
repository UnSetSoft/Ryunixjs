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
import { createRequire } from 'module'
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
import AppRouterPlugin from './utils/appRouterPlugin.mjs'
import ApiRouterPlugin from './utils/ApiRouterPlugin.mjs'
import { handleApiRequest } from './utils/apiHandler.mjs'
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

const ryunixRequire = createRequire(import.meta.url)
// Using thread-loader as a reference to find where my-app/node_modules/ryunix-presets/node_modules or .pnpm node_modules are located
const presetsNodeModules = dirname(dirname(ryunixRequire.resolve('thread-loader/package.json')))

const hasAppDir = fs.existsSync(resolveApp(dir, 'app')) || fs.existsSync(resolveApp(dir, `${config.webpack.root}/app`));
const entryPoint = hasAppDir
  ? resolveApp(dir, `${config.webpack.output.buildDirectory}/main.ryx`)
  : './main.ryx';

const sharedWebpackConfig = {
  experiments: {
    lazyCompilation: config.webpack.experiments.lazyCompilation,
  },
  context: resolveApp(dir, config.webpack.root),
  devtool: config.webpack.production ? false : 'source-map',
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
            loader: ryunixRequire.resolve('@mdx-js/loader'),
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
          ryunixRequire.resolve('thread-loader'),
          {
            loader: ryunixRequire.resolve('babel-loader'),
            options: {
              presets: [
                [
                  ryunixRequire.resolve('@babel/preset-env'),
                  {
                    targets: 'defaults and not IE 11',
                    useBuiltIns: false,
                    modules: false,
                    bugfixes: true,
                  },
                ],
                ryunixRequire.resolve('@babel/preset-react'),
              ],
              cacheDirectory: resolveApp(
                dir,
                `${config.webpack.output.buildDirectory}/cache/babel`,
              ),
              plugins: [
                [
                  ryunixRequire.resolve('@babel/plugin-transform-react-jsx'),
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
  resolveLoader: {
    modules: ['node_modules', presetsNodeModules],
  },
  externals: [
    {
      ryunix: '@unsetsoft/ryunixjs',
    },
    ...config.webpack.externals,
  ],
}

// Plugin factory — called once per compiler so each gets fresh instances.
// isServer=true omits browser-only plugins (HtmlWebpackPlugin, MiniCssExtractPlugin, CopyPlugin).
const getPlugins = (isServer = false) => [
  fs.existsSync(resolveApp(dir, '.env')) &&
  new Dotenv({
    path: resolveApp(dir, '.env'),
    prefix: 'ryunix.env.RYUNIX_APP_',
    systemvars: false,
    ignoreStub: true,
  }),
  new webpack.DefinePlugin({
    'ryunix.config.env': JSON.stringify(config.experimental.env),
    'process.env.RYUNIX_SSR': JSON.stringify(
      isServer
        ? true
        : (config.experimental.ssr || (config.experimental.ssg?.prerender?.length ?? 0) > 0),
    ),
    'process.env.RYUNIX_IS_SERVER': JSON.stringify(isServer),
  }),
  // Only inject HTML for the client build
  !isServer &&
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
  !isServer &&
    config.webpack.production &&
  new MiniCssExtractPlugin({
    filename: 'assets/css/[name].[contenthash].css',
  }),
  !isServer &&
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolveApp(dir, 'public'),
          to: resolveApp(dir, `${config.webpack.output.buildDirectory}/static`),
          globOptions: {
            ignore: ['**/template.html', '**/index.html', '**/*.html', '**/favicon.png'],
          },
          filter: (resourcePath) => {
            try { return !resourcePath.toLowerCase().endsWith('.html') } catch { return true }
          },
          noErrorOnMissing: true,
        },
      ],
    }),
  ...(!isServer ? config.webpack.plugins : []),
].filter(Boolean)

// 1. CLIENT CONFIGURATION (The standard web output)
const clientConfig = {
  ...sharedWebpackConfig,
  name: 'client',
  entry: entryPoint,
  target: config.webpack.target, // usually 'web'
  output: {
    path: resolveApp(dir, `${config.webpack.output.buildDirectory}/static`),
    publicPath: '/',
    chunkFilename: './assets/js/[name].[fullhash:8].bundle.js',
    assetModuleFilename: './assets/media/[name].[hash][ext]',
    filename: './assets/js/[name].[fullhash:8].bundle.js',
    devtoolModuleFilenameTemplate: 'ryunix/[resource-path]',
    clean: config.experimental.ssg.prerender.length > 0 ? false : true,
  },
  devServer: {
    watchFiles: [resolveApp(dir, 'src/**/*'), resolveApp(dir, 'app/**/*')],
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
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined')
      }

      devServer.app.use(async (req, res, next) => {
        try {
          const apiRootPath = resolveApp(dir, `${config.webpack.output.buildDirectory}/api`)
          const handled = await handleApiRequest(req, res, apiRootPath)
          if (!handled) {
            next()
          }
        } catch (err) {
          next(err)
        }
      })

      return middlewares
    },
  },
  module: {
    ...sharedWebpackConfig.module,
    rules: [
      ...sharedWebpackConfig.module.rules.filter(Boolean),
      // CSS/SASS for Client
      {
        test: /\.s[ac]ss|css$/i,
        exclude: /node_modules/,
        use: [
          config.webpack.production
            ? MiniCssExtractPlugin.loader
            : ryunixRequire.resolve('style-loader'),
          ryunixRequire.resolve('css-loader'),
          {
            loader: ryunixRequire.resolve('postcss-loader'),
            options: {
              postcssOptions: {
                // If a user has tailwind or postcss configs, it will load them
              }
            }
          }
        ],
      },
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new RyunixRoutesPlugin({
      routesPath: resolveApp(dir, `${config.webpack.root}/pages/routes.ryx`),
      outputPath: resolveApp(
        dir,
        `${config.webpack.output.buildDirectory}/ssg/routes.json`,
      ),
    }),
    new AppRouterPlugin({
      appDir: fs.existsSync(resolveApp(dir, 'app')) ? resolveApp(dir, 'app') : resolveApp(dir, `${config.webpack.root}/app`),
      outputPath: resolveApp(dir, `${config.webpack.output.buildDirectory}/app-router.js`),
    }),
    new ApiRouterPlugin({
      appDir: fs.existsSync(resolveApp(dir, 'app')) ? resolveApp(dir, 'app') : resolveApp(dir, `${config.webpack.root}/app`),
      outputPath: resolveApp(dir, `${config.webpack.output.buildDirectory}/api`),
    }),
    // ESLintPlugin - excluding MDX and MD files
    new ESLintPlugin({
      cwd: dir,
      files: ['**/*.ryx', ...config.eslint.files],
      extensions: ['js', 'ryx', 'jsx'],
      exclude: ['node_modules', '**/*.mdx', '**/*.md'],
      emitError: true,
      emitWarning: true,
      failOnWarning: false,
      failOnError: false,
      overrideConfigFile: true,
      overrideConfig: eslintConfig[0],
    }),
    ...getPlugins(false),
  ].filter(Boolean),
}

// 2. SERVER CONFIGURATION (For SSG HTML rendering)
const serverConfig = {
  ...sharedWebpackConfig,
  name: 'server',
  target: 'node', // Compile for Node.js
  entry: resolveApp(dir, `${config.webpack.output.buildDirectory}/app-router-server.js`),
  output: {
    path: resolveApp(dir, `${config.webpack.output.buildDirectory}/server`),
    filename: 'app-router-server.bundle.mjs',
    publicPath: '/',
    library: { type: 'module' },
    chunkFormat: 'module',
    clean: true,
  },
  experiments: {
    outputModule: true,
  },
  optimization: {
    minimize: false, // Don't minimize server bundle for faster builds
  },
  module: {
    ...sharedWebpackConfig.module,
    rules: [
      ...sharedWebpackConfig.module.rules.filter(Boolean),
      // Ignore CSS files for the Node build (they are extracted by the client build)
      {
        test: /\.s[ac]ss|css$/i,
        type: 'asset/source', // Just process them as strings to avoid crashing Node
      }
    ]
  },
  plugins: getPlugins(true),
  externals: [
    {
      ryunix: '@unsetsoft/ryunixjs',
      '@unsetsoft/ryunixjs': '@unsetsoft/ryunixjs',
    },
    ...config.webpack.externals,
  ]
}

// Export dual compilers only in production if SSR or SSG prerender is enabled
export default (config.webpack.production && (config.experimental.ssr || config.experimental.ssg?.prerender?.length > 0))
  ? [clientConfig, serverConfig]
  : clientConfig;
