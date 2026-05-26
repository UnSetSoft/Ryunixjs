import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import webpack from 'webpack'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import ESLintPlugin from 'eslint-webpack-plugin'
import { createRequire } from 'module'
import {
  getPackageManager,
  ENV_HASH,
  getEnviroment,
  resolveApp,
} from './utils/index.js'
import fs from 'fs'
import config from './utils/config.cjs'
import Dotenv from 'dotenv-webpack'
import { getPackageVersion } from './utils/index.js'
import RyunixRoutesPlugin from './utils/ssgPlugin.js'
import AppRouterPlugin from './utils/appRouterPlugin.js'
import ApiRouterPlugin from './utils/ApiRouterPlugin.js'
import { handleApiRequest } from './utils/apiHandler.js'
import { renderDevRoute } from './utils/ssrDevHandler.js'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { remarkGithubAlerts } from './plugins/remark-github-alerts.js'
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
// But with fallback to handle edge cases
let presetsNodeModules
try {
  presetsNodeModules = dirname(
    dirname(ryunixRequire.resolve('thread-loader/package.json')),
  )
} catch (e) {
  // Fallback: try to resolve from the ryunix-presets package itself
  try {
    presetsNodeModules = dirname(
      ryunixRequire.resolve('@unsetsoft/ryunix-presets/package.json'),
    )
  } catch (e2) {
    // Last fallback: use the project's node_modules
    presetsNodeModules = dirname(resolveApp(dir, 'package.json'))
  }
}
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
      return opts && typeof opts === 'object' && Object.keys(opts).length > 0
        ? fn(opts)
        : fn()
    })
  } catch (e) {
    console.warn(`[Ryunix] Could not load postcss.config.js: ${e.message}`)
    return []
  }
}
const postcssPlugins = resolvePostcssPlugins()
const hasAppDir =
  fs.existsSync(resolveApp(dir, 'app')) ||
  fs.existsSync(resolveApp(dir, `${config.rootDir}/app`))
const entryPoint = hasAppDir
  ? resolveApp(dir, `${config.buildDir}/server/app/main.ryx`)
  : './main.ryx'
const sharedWebpackConfig = {
  experiments: {
    lazyCompilation: config.webpack.experiments.lazyCompilation,
  },
  context: resolveApp(dir, config.rootDir),
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
          test: /[\\/]node_modules[\\/](@unsetsoft[\\/]ryunixjs|ryunix)[\\/]/,
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
        },
      },
    },
    minimize: config.webpack.production === true,
    minimizer: config.webpack.production
      ? [
          new TerserPlugin({
            parallel: true,
            minify:
              config.compiler === 'swc'
                ? TerserPlugin.swcMinify
                : TerserPlugin.terserMinify,
            terserOptions:
              config.compiler === 'swc'
                ? {}
                : {
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
    cacheDirectory: resolveApp(dir, `${config.buildDir}/cache/webpack`),
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
      config.mdx && {
        test: /\.mdx?$/,
        use: [
          config.compiler === 'swc'
            ? {
                loader: ryunixRequire.resolve('swc-loader'),
                options: {
                  jsc: {
                    parser: { syntax: 'ecmascript', jsx: true },
                    transform: {
                      react: {
                        pragma: 'Ryunix.createElement',
                        pragmaFrag: 'Ryunix.Fragment',
                      },
                    },
                    target: 'es2022',
                  },
                },
              }
            : {
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
                  plugins: [
                    [
                      ryunixRequire.resolve(
                        '@babel/plugin-transform-react-jsx',
                      ),
                      {
                        pragma: 'Ryunix.createElement',
                        pragmaFrag: 'Ryunix.Fragment',
                      },
                    ],
                  ],
                  cacheDirectory: resolveApp(
                    dir,
                    `${config.buildDir}/cache/babel-loader`,
                  ),
                },
              },
          {
            loader: ryunixRequire.resolve('@mdx-js/loader'),
            options: {
              jsxImportSource: '@unsetsoft/ryunixjs',
              providerImportSource: '@unsetsoft/ryunixjs',
              remarkPlugins: [
                remarkGfm,
                remarkGithubAlerts,
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
        use: [
          config.compiler !== 'swc' && ryunixRequire.resolve('thread-loader'),
          config.compiler === 'swc'
            ? {
                loader: ryunixRequire.resolve('swc-loader'),
                options: {
                  jsc: {
                    parser: {
                      syntax: 'ecmascript',
                      jsx: true,
                    },
                    transform: {
                      react: {
                        pragma: 'Ryunix.createElement',
                        pragmaFrag: 'Ryunix.Fragment',
                      },
                    },
                    target: 'es2022',
                  },
                },
              }
            : {
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
                    `${config.buildDir}/cache/babel-loader`,
                  ),
                  plugins: [
                    [
                      ryunixRequire.resolve(
                        '@babel/plugin-transform-react-jsx',
                      ),
                      {
                        pragma: 'Ryunix.createElement',
                        pragmaFrag: 'Ryunix.Fragment',
                      },
                    ],
                  ],
                },
              },
          resolve(__dirname, 'loaders/ryunix-server-action-loader.js'),
          resolve(__dirname, 'loaders/ryunix-rsc-loader.js'),
        ].filter(Boolean),
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
const isSSR = config.ssr
// Plugin factory — called once per compiler so each gets fresh instances.
// isServer=true omits browser-only plugins (HtmlWebpackPlugin, MiniCssExtractPlugin, CopyPlugin).
const getPlugins = (isServer = false) =>
  [
    fs.existsSync(resolveApp(dir, '.env')) &&
      new Dotenv({
        path: resolveApp(dir, '.env'),
        prefix: 'ryunix.env.RYUNIX_APP_',
        systemvars: false,
        ignoreStub: true,
      }),
    new webpack.DefinePlugin({
      'ryunix.config.env': JSON.stringify(config.env),
      'process.env.RYUNIX_SSR': JSON.stringify(
        config.ssr || (config.legacy.ssg?.prerender?.length ?? 0) > 0,
      ),
      'process.env.RYUNIX_HYDRATION_RECOVER': JSON.stringify(
        config.hydration?.recover || 'boundary',
      ),
      'process.env.RYUNIX_HYDRATION_BOUNDARIES': JSON.stringify(
        config.hydration?.boundaries || 'route',
      ),
      'process.env.RYUNIX_HYDRATION_STRICT': JSON.stringify(
        Boolean(config.hydration?.strict),
      ),
      'process.env.RYUNIX_DEBUG': JSON.stringify(config.debug),
      'process.env.RYUNIX_IS_SERVER': JSON.stringify(isServer),
    }),
    // Only inject HTML for the client build
    !isServer &&
      new HtmlWebpackPlugin({
        pageLang: config.legacy.seo.pageLang,
        title: config.legacy.seo.title,
        favicon: config.favicon
          ? typeof config.favicon === 'string'
            ? resolveApp(dir, config.favicon)
            : join(dir, 'public', 'favicon.png')
          : false,
        meta: config.legacy.seo.meta,
        template: config.legacy.template
          ? resolveApp(dir, config.legacy.template)
          : join(__dirname, 'template', 'index.html'),
        info: {
          framework: 'Ryunix',
          version,
          mode: config.webpack.production ? 'production' : 'dev',
        },
        ssrScript:
          (isSSR
            ? `
       <noscript
        style="background: #f4f47f;color: black;padding: 10px;width: 100%;display: block;position: fixed;bottom: 0;z-index: 99;">
      <div style="display: flex;justify-content: center;align-items: center;">
        <p><b>Warning:</b> JavaScript is not enabled. Some features may not work.
        </p>
      </div>
    </noscript>
      `
            : `
       <noscript
        style="background: #f57070ff;color: black;padding: 10px;width: 100%;display: block;position: fixed;bottom: 0;z-index: 99;">
      <div style="display: flex;justify-content: center;align-items: center;">
        <p><b>Error:</b> JavaScript is disabled. Please enable it to use this application.
        </p>
      </div>
    </noscript>
      `) +
          (!isServer && !config.webpack.production
            ? `
      <script>
        (function() {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const ws = new WebSocket(protocol + '//' + window.location.host + '/ws');
          let overlayEl = null;

          function createOverlay(errors) {
            if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
            overlayEl = document.createElement('div');
            // Overlay container (matches devOverlay)
            overlayEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;background-color:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,sans-serif;';
            
            // Modal box (matches devOverlay)
            const modal = document.createElement('div');
            modal.style.cssText = 'background-color:#0c0c0c;width:100%;max-width:1000px;max-height:90vh;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.8);display:flex;flex-direction:column;overflow:hidden;border:1px solid #333;';
            
            // Header (matches devOverlay)
            const header = document.createElement('div');
            header.style.cssText = 'background-color:#161616;padding:16px 24px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;';
            
            const headerLeft = document.createElement('div');
            headerLeft.style.cssText = 'display:flex;align-items:center;gap:12px;';
            headerLeft.innerHTML = '<span style="background-color:rgba(239,68,68,0.2);color:#ef4444;padding:4px 8px;border-radius:4px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">SYNTAX ERROR</span><span style="color:#9ca3af;font-size:14px;">Ryunix Compiler</span>';

            const headerRight = document.createElement('button');
            headerRight.style.cssText = 'background:none;border:none;color:#9ca3af;cursor:pointer;outline:none;';
            headerRight.onclick = () => window.location.reload();
            headerRight.title = 'Reload page';
            headerRight.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>';

            header.appendChild(headerLeft);
            header.appendChild(headerRight);
            
            const content = document.createElement('div');
            content.style.cssText = 'padding:32px;overflow-y:auto;flex:1;color:#fff;';
            
            const title = document.createElement('h1');
            title.style.cssText = 'font-size:24px;font-weight:bold;margin-bottom:24px;font-family:ui-monospace,monospace;line-height:1.4;word-break:break-word;';
            title.innerHTML = '<span style="color:#f87171">BuildFailure</span>: Failed to compile';
            content.appendChild(title);

            const seenErrors = new Set();

            errors.forEach(errObj => {
              const errStr = typeof errObj === 'string' ? errObj : (errObj.message || JSON.stringify(errObj));
              const cleanErr = errStr.replace(/\\x1b\\[[0-9;]*m/g, '').replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
              
              if (seenErrors.has(cleanErr)) return;
              seenErrors.add(cleanErr);

              // Extract file location if available (swc or standard webpack format)
              const fileMatch = cleanErr.match(/ERROR in ([^\\n]+)/) || cleanErr.match(/╭─\\[(.*?):\\d+:\\d+\\]/);
              const errorFile = fileMatch ? fileMatch[1].trim() : '';

              if (errorFile) {
                const fileDiv = document.createElement('div');
                fileDiv.style.cssText = 'margin-bottom:16px;color:#9ca3af;font-size:14px;display:flex;align-items:center;gap:8px;';
                fileDiv.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>' + errorFile;
                content.appendChild(fileDiv);
              }

              const snippetContext = document.createElement('div');
              snippetContext.style.cssText = 'margin-bottom:16px;';
              snippetContext.innerHTML = '<p style="color:#9ca3af;font-size:14px;margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Compiler Output</p>';

              const snippet = document.createElement('div');
              // Matches snippetContainerStyle updates exactly
              snippet.style.cssText = 'background-color:#000;border-radius:8px;border:1px solid #333;padding:16px;font-family:ui-monospace,monospace;font-size:14px;overflow-x:auto;color:#d1d5db;white-space:pre-wrap;margin-bottom:32px;height:auto;max-height:150px;overflow-y:auto;';
              snippet.textContent = cleanErr;
              
              snippetContext.appendChild(snippet);
              content.appendChild(snippetContext);
            });

            const footer = document.createElement('p');
            footer.style.cssText = 'color:#9ca3af;font-size:14px;margin-top:16px;';
            footer.innerText = 'This error occurred during the build process and can only be dismissed by fixing the syntax error.';
            content.appendChild(footer);

            modal.appendChild(header);
            modal.appendChild(content);
            overlayEl.appendChild(modal);
            document.body.appendChild(overlayEl);
          }

          const renderOrListen = (errData) => {
            if (document.body) createOverlay(errData);
            else window.addEventListener('DOMContentLoaded', () => createOverlay(errData));
          };

          ws.addEventListener('message', (event) => {
            try {
              const payload = JSON.parse(event.data);
              if (payload.type === 'errors' && payload.data && (payload.data.length > 0 || Object.keys(payload.data).length > 0)) {
                console.log('[Ryunix] Displaying compiler error overlay');
                const errArray = Array.isArray(payload.data) ? payload.data : [payload.data];
                renderOrListen(errArray);
              } else if (payload.type === 'ok' || payload.type === 'warnings') {
                if (overlayEl && overlayEl.parentNode) {
                  overlayEl.parentNode.removeChild(overlayEl);
                  overlayEl = null;
                  
                  // Upon recovering from a syntax/build error, force a clean reload
                  // to prevent rendering black screens or stale closures (due to liveReload being false)
                  console.log('[Ryunix] Build successful, reloading page...');
                  window.location.reload();
                }
              }
            } catch (e) {}
          });
        })();
      </script>`
            : ''),
      }),
    !isServer &&
      (config.webpack.production || config.ssr) &&
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash].css',
      }),
    !isServer &&
      new CopyWebpackPlugin({
        patterns: [
          {
            from: resolveApp(dir, 'public'),
            to: resolveApp(dir, `${config.buildDir}/static`),
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
              } catch {
                return true
              }
            },
            noErrorOnMissing: true,
          },
        ],
      }),
    ...(!isServer ? config.webpack.plugins : []),
  ].filter(Boolean)
const clientConfig = {
  ...sharedWebpackConfig,
  name: 'client',
  entry: entryPoint,
  target: config.webpack.target, // usually 'web'
  output: {
    path: resolveApp(dir, `${config.buildDir}/static`),
    publicPath: '/',
    chunkFilename: './chunks/[name].[contenthash:8].chunk.js',
    assetModuleFilename: './media/[name].[hash][ext]',
    filename: './chunks/[name].[contenthash:8].bundle.js',
    devtoolModuleFilenameTemplate: 'ryunix/[resource-path]',
    clean: false, // Pre-build cleanup is handled explicitly in index.mjs
  },
  devServer: {
    watchFiles: [resolveApp(dir, 'src/**/*'), resolveApp(dir, 'app/**/*')],
    client: {
      overlay: false, // Disable default webpack iframe overlay
    },
    devMiddleware: {
      writeToDisk: (filePath) => {
        try {
          return (
            filePath.includes('/server/') || filePath.includes('\\server\\')
          )
        } catch {
          return false
        }
      },
    },
    hot: true,
    historyApiFallback: {
      index: '/',
      disableDotRule: true,
    },
    liveReload: false,
    headers: {
      'Access-Control-Allow-Origin': config.server.cors.origin || '*',
      'Access-Control-Allow-Methods': config.server.cors.methods || '*',
      'Access-Control-Allow-Headers': config.server.cors.headers || '*',
      'Access-Control-Allow-Credentials': String(
        config.server.cors.credentials || false,
      ),
    },
    allowedHosts: config.webpack.devServer.allowedHosts,
    port: config.port,
    proxy: config.proxy,
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined')
      }
      devServer.app.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/_ryunix/action') {
          try {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', async () => {
              try {
                if (req.headers['x-ryunix-action'] !== 'true') {
                  res.writeHead(403, { 'Content-Type': 'application/json' })
                  return res.end(
                    JSON.stringify({ error: 'Forbidden: Missing CSRF header' }),
                  )
                }
                const { actionId, args } = JSON.parse(body)
                const action = global.__RYUNIX_SERVER_ACTIONS__?.[actionId]
                if (!action) {
                  res.writeHead(404, { 'Content-Type': 'application/json' })
                  return res.end(
                    JSON.stringify({
                      error: `Server Action ${actionId} not found`,
                    }),
                  )
                }
                const result = await action(...args)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(result))
              } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: err.message }))
              }
            })
            return
          } catch (err) {
            next(err)
            return
          }
        }
        if (req.method === 'GET' && req.url.startsWith('/_ryunix/source')) {
          try {
            const urlObj = new URL(req.url, `http://${req.headers.host}`)
            const filePath = urlObj.searchParams.get('file')
            const lineStr = urlObj.searchParams.get('line')
            if (!filePath || !lineStr) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              return res.end(
                JSON.stringify({ error: 'Missing file or line parameter' }),
              )
            }
            const line = parseInt(lineStr, 10)
            if (!fs.existsSync(filePath)) {
              res.writeHead(404, { 'Content-Type': 'application/json' })
              return res.end(JSON.stringify({ error: 'File not found' }))
            }
            const content = fs.readFileSync(filePath, 'utf8')
            const lines = content.split('\n')
            const start = Math.max(0, line - 5 - 1) // 0-indexed, 5 lines before
            const end = Math.min(lines.length, line + 5)
            const snippet = lines.slice(start, end).join('\n')
            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ snippet, startLine: start + 1 }))
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ error: err.message }))
          }
        }
        next()
      })
      devServer.app.use(async (req, res, next) => {
        try {
          const apiRootPath = resolveApp(dir, `${config.buildDir}/server/api`)
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
          if (config.ssr) {
            const handled = await renderDevRoute(
              req,
              res,
              devServer,
              dir,
              config,
            )
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
      ...sharedWebpackConfig.module.rules
        .map((rule) => {
          const r = rule
          if (r.test && r.test.toString().includes('js|jsx|ryx')) {
            return {
              ...r,
              exclude: [/node_modules/, /\.server\.(js|jsx|ryx)$/],
            }
          }
          return rule
        })
        .filter(Boolean),
      // CSS/SASS for Client
      {
        test: /\.(s[ac]ss|css)$/i,
        exclude: /node_modules/,
        use: [
          config.webpack.production || config.ssr
            ? MiniCssExtractPlugin.loader
            : ryunixRequire.resolve('style-loader'),
          ryunixRequire.resolve('css-loader'),
          {
            loader: ryunixRequire.resolve('postcss-loader'),
            options: {
              postcssOptions: {
                config: false, // disable auto-detect; we load plugins explicitly
                plugins: postcssPlugins,
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Ryunix: '@unsetsoft/ryunixjs',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new RyunixRoutesPlugin({
      routesPath: resolveApp(dir, `${config.rootDir}/pages/routes.ryx`),
      outputPath: resolveApp(dir, `${config.buildDir}/cache/ssg/routes.json`),
      debug: config.debug,
    }),
    new AppRouterPlugin({
      appDir: fs.existsSync(resolveApp(dir, 'app'))
        ? resolveApp(dir, 'app')
        : resolveApp(dir, `${config.rootDir}/app`),
      outputPath: resolveApp(
        dir,
        `${config.buildDir}/server/app/app-router.js`,
      ),
      ssgOutputPath: resolveApp(
        dir,
        `${config.buildDir}/cache/ssg/routes.json`,
      ),
      debug: config.debug,
    }),
    new ApiRouterPlugin({
      appDir: fs.existsSync(resolveApp(dir, 'app'))
        ? resolveApp(dir, 'app')
        : resolveApp(dir, `${config.rootDir}/app`),
      outputPath: resolveApp(dir, `${config.buildDir}/server/api`),
      debug: config.debug,
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
      configType: 'flat',
      // ESLint 9 flat config requires a config file on disk; overrideConfig alone is not enough.
      overrideConfigFile: join(__dirname, 'eslint.config.js'),
    }),
    ...getPlugins(false),
  ].filter(Boolean),
}
// 2. SERVER CONFIGURATION (For SSG HTML rendering)
const serverConfig = {
  ...sharedWebpackConfig,
  name: 'server',
  target: 'node', // Compile for Node.js
  entry: resolveApp(dir, `${config.buildDir}/server/app/app-router-server.js`),
  output: {
    path: resolveApp(dir, `${config.buildDir}/server`),
    filename: 'app-router-server.bundle.js',
    chunkFilename: 'chunks/[name].[fullhash:8].chunk.js',
    publicPath: '/',
    library: { type: 'module' },
    chunkFormat: 'module',
    // Keep api/ subdirectory — it's written by ApiRouterPlugin, not by webpack
    // Keep api/ and app/ subdirectories
    clean: { keep: /^(api|app)[\\/]/ },
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
    ],
  },
  plugins: getPlugins(true),
  externals: [
    {
      ryunix: '@unsetsoft/ryunixjs',
    },
    '@unsetsoft/ryunixjs',
    ...config.webpack.externals,
  ],
}
// Export dual compilers if SSR is enabled, or in production if SSG prerender is enabled
const enableServerDualCompiler =
  config.ssr ||
  (config.webpack.production && config.legacy.ssg?.prerender?.length > 0)
export default enableServerDualCompiler
  ? [clientConfig, serverConfig]
  : clientConfig
