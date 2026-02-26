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
import { renderDevRoute } from './utils/ssrDevHandler.mjs'
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

// A require() rooted at the user project — resolves user-installed packages (e.g. tailwind, postcss plugins)
const projectRequire = createRequire(resolveApp(dir, 'package.json'))

/**
 * Load postcss plugins from the user project's postcss.config.js
 * resolving each plugin name via projectRequire so they are found
 * in the user's node_modules even in pnpm monorepos.
 */
const resolvePostcssPlugins = () => {
  const configPath = resolveApp(dir, 'postcss.config.js')
  if (!fs.existsSync(configPath)) return []
  try {
    const config = projectRequire(configPath)
    const plugins = config.plugins || {}
    if (Array.isArray(plugins)) return plugins
    // Object form: { 'plugin-name': options }
    return Object.entries(plugins).map(([name, opts]) => {
      const pluginFn = projectRequire(name)
      const fn = pluginFn.default || pluginFn
      return opts && typeof opts === 'object' && Object.keys(opts).length > 0 ? fn(opts) : fn()
    })
  } catch (e) {
    console.warn(`[Ryunix] Could not load postcss.config.js: ${e.message}`)
    return []
  }
}

const postcssPlugins = resolvePostcssPlugins()

const hasAppDir = fs.existsSync(resolveApp(dir, 'app')) || fs.existsSync(resolveApp(dir, `${config.webpack.root}/app`));
const entryPoint = hasAppDir
  ? resolveApp(dir, `${config.webpack.output.buildDirectory}/server/app/main.ryx`)
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
      maxSize: 244000,
      cacheGroups: {
        framework: {
          test: /[\\/]node_modules[\\/](@unsetsoft[\\/]ryunixjs)[\\/]/,
          name: 'framework',
          priority: 40,
          enforce: true,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 20,
        },
        common: {
          name: 'commons',
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true,
        }
      },
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
                `${config.webpack.output.buildDirectory}/cache/babel-loader`,
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
          filename: 'images/[name].[hash][ext]',
        },
      },
      // Media files
      {
        test: /\.(mp3|mp4|pdf)$/,
        exclude: /node_modules/,
        type: 'asset/resource',
        generator: {
          filename: 'media/[name].[hash][ext]',
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
const isSSR = config.experimental.ssr

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
    ssrScript: isSSR ? `
       <noscript
        style="background: #f4f47f;color: black;padding: 10px;width: 100%;display: block;position: fixed;bottom: 0;z-index: 99;">
      <div style="display: flex;justify-content: center;align-items: center;">
        <p><b>Warning:</b> JavaScript is not enabled. Some features may not work.
        </p>
      </div>
    </noscript>
      ` : `
       <noscript
        style="background: #f57070ff;color: black;padding: 10px;width: 100%;display: block;position: fixed;bottom: 0;z-index: 99;">
      <div style="display: flex;justify-content: center;align-items: center;">
        <p><b>Error:</b> JavaScript is disabled. Please enable it to use this application.
        </p>
      </div>
    </noscript>
      
      `,
  }),
  !isServer &&
  (config.webpack.production || config.experimental.ssr) &&
  new MiniCssExtractPlugin({
    filename: 'css/[name].[contenthash].css',
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
    chunkFilename: './chunks/[name].[contenthash:8].chunk.js',
    assetModuleFilename: './media/[name].[hash][ext]',
    filename: './chunks/[name].[contenthash:8].bundle.js',
    devtoolModuleFilenameTemplate: 'ryunix/[resource-path]',
    clean: false, // Pre-build cleanup is handled explicitly in index.mjs
  },
  devServer: {
    watchFiles: [resolveApp(dir, 'src/**/*'), resolveApp(dir, 'app/**/*')],
    devMiddleware: {
      writeToDisk: (filePath) => {
        try { return filePath.includes('/server/') || filePath.includes('\\server\\') } catch { return false }
      },
    },
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
          const apiRootPath = resolveApp(dir, `${config.webpack.output.buildDirectory}/server/api`)
          const handled = await handleApiRequest(req, res, apiRootPath)
          if (!handled) {
            next()
          }
        } catch (err) {
          next(err)
        }
      })

      devServer.app.use(async (req, res, next) => {
        try {
          if (config.experimental.ssr) {
            const handled = await renderDevRoute(req, res, devServer, dir, config)
            if (handled) return
          }
        } catch (err) {
          console.error('[Ryunix Dev SSR]', err)
        }
        next()
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
          (config.webpack.production || config.experimental.ssr)
            ? MiniCssExtractPlugin.loader
            : ryunixRequire.resolve('style-loader'),
          ryunixRequire.resolve('css-loader'),
          {
            loader: ryunixRequire.resolve('postcss-loader'),
            options: {
              postcssOptions: {
                config: false, // disable auto-detect; we load plugins explicitly
                plugins: postcssPlugins,
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
        `${config.webpack.output.buildDirectory}/cache/ssg/routes.json`,
      ),
    }),
    new AppRouterPlugin({
      appDir: fs.existsSync(resolveApp(dir, 'app')) ? resolveApp(dir, 'app') : resolveApp(dir, `${config.webpack.root}/app`),
      outputPath: resolveApp(dir, `${config.webpack.output.buildDirectory}/server/app/app-router.js`),
      ssgOutputPath: resolveApp(dir, `${config.webpack.output.buildDirectory}/cache/ssg/routes.json`),
    }),
    new ApiRouterPlugin({
      appDir: fs.existsSync(resolveApp(dir, 'app')) ? resolveApp(dir, 'app') : resolveApp(dir, `${config.webpack.root}/app`),
      outputPath: resolveApp(dir, `${config.webpack.output.buildDirectory}/server/api`),
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
  entry: resolveApp(dir, `${config.webpack.output.buildDirectory}/server/app/app-router-server.js`),
  output: {
    path: resolveApp(dir, `${config.webpack.output.buildDirectory}/server`),
    filename: 'app-router-server.bundle.mjs',
    chunkFilename: 'chunks/[name].[fullhash:8].chunk.mjs',
    publicPath: '/',
    library: { type: 'module' },
    chunkFormat: 'module',
    // Keep api/ subdirectory — it's written by ApiRouterPlugin, not by webpack
    clean: { keep: /^api[\\/]/ },
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
      // Ignore CSS for the Node build (extracted by the client build)
      {
        test: /\.s[ac]ss|css$/i,
        type: 'asset/source',
      },
      // Images/media: assign URL without emitting files (client build handles emission)
      {
        test: /\.(jpg|jpeg|png|gif|svg|ico)$/,
        exclude: /node_modules/,
        type: 'asset/resource',
        generator: { emit: false, filename: 'images/[name].[hash][ext]' },
      },
      {
        test: /\.(mp3|mp4|pdf)$/,
        exclude: /node_modules/,
        type: 'asset/resource',
        generator: { emit: false, filename: 'media/[name].[hash][ext]' },
      },
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

// Export dual compilers if SSR is enabled, or in production if SSG prerender is enabled
const enableServerDualCompiler = config.experimental.ssr || (config.webpack.production && config.experimental.ssg?.prerender?.length > 0);
export default enableServerDualCompiler
  ? [clientConfig, serverConfig]
  : clientConfig;
