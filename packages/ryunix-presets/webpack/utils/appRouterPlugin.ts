import fs from 'fs'
import path from 'path'
import type { Compiler } from 'webpack'
import {
  generateResolveSSGPathsCode,
  parseDynamicSegment,
  type DynamicSsgRoute,
  type SsgRouteMeta,
} from './ssgStaticParams.js'
import {
  copyRouteMetadataAssets,
  mergeMetadataAssets,
  metadataAssetsToMeta,
  scanSegmentMetadataFiles,
  toMetadataAssetManifest,
  type RouteMetadataAsset,
} from './routeMetadataFiles.js'

interface ComponentPaths {
  path?: string | null
  serverPath?: string | null
  clientPath?: string | null
}

interface DynamicSegmentInfo {
  param: string
  isCatchAll: boolean
}

interface RouteNode {
  path: string
  dynamicSegment: DynamicSegmentInfo | null
  layout: ComponentPaths | null
  layoutIsAsync: boolean
  index: ComponentPaths | null
  indexIsAsync: boolean
  error: ComponentPaths | null
  loading: ComponentPaths | null
  metadataFiles: RouteMetadataAsset[]
  children: RouteNode[]
}

interface ComponentInfo {
  id: string
  isServerComponent: boolean
  isAsync: boolean
  isProxy?: boolean
  loading?: ComponentInfo | null
  error?: ComponentInfo | null
}

interface FlatMdxPending {
  name: string
  fullPath: string
  index: ComponentPaths | null
}

interface DynamicSsgSegment {
  param: string
  isCatchAll: boolean
  layoutId: string | null
  indexId: string | null
}

interface RouteDefinition {
  path: string
  layoutsArrayStr: string
  errorPropStr: string
  loadingConfigStr: string
  errorConfigStr: string
  fileMetadataJson: string
}

class AppRouterPlugin {
  appDir: string
  outputPath: string
  ssgOutputPath: string | null
  debug: boolean

  constructor(
    options: {
      appDir?: string
      outputPath?: string
      ssgOutputPath?: string | null
      debug?: boolean
    } = {},
  ) {
    this.appDir = options.appDir || 'src/app'
    this.outputPath = options.outputPath || '.ryunix/server/app/app-router.js'
    this.ssgOutputPath = options.ssgOutputPath || null
    this.debug = options.debug || false
  }

  apply(compiler: Compiler) {
    let lastScanTime = 0
    let lastRoutes: RouteNode | RouteNode[] | null = null

    compiler.hooks.beforeCompile.tapAsync(
      'AppRouterPlugin',
      (params, callback) => {
        const appDirPath = path.resolve(process.cwd(), this.appDir)

        if (!fs.existsSync(appDirPath)) {
          if (this.debug)
            console.log(`[AppRouter] No app directory found at ${appDirPath}`)
          callback()
          return
        }

        const compileParams = params as {
          contextDependencies?: { add: (path: string) => void }
        }
        if (compileParams.contextDependencies) {
          compileParams.contextDependencies.add(appDirPath)
        }

        try {
          const newestMtime = this.getNewestMtime(appDirPath)

          if (newestMtime > lastScanTime || !lastRoutes) {
            const routes = this.scanDirectory(appDirPath, '')
            this.generateRouterFile(
              routes,
              path.resolve(process.cwd(), this.outputPath),
            )
            lastScanTime = newestMtime
            lastRoutes = routes
          }
        } catch (error) {
          console.error('[AppRouter] ❌ ERROR generating app router:', error)
        }

        callback()
      },
    )

    compiler.hooks.afterCompile.tapAsync(
      'AppRouterPlugin',
      (compilation, callback) => {
        const appDirPath = path.resolve(process.cwd(), this.appDir)
        if (fs.existsSync(appDirPath)) {
          compilation.contextDependencies.add(appDirPath)
        }
        callback()
      },
    )
  }

  scanDirectory(
    dir: string,
    basePath: string,
    segmentAtThisLevel: DynamicSegmentInfo | null = null,
  ): RouteNode | RouteNode[] | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    let layout: ComponentPaths | null = null
    let index: ComponentPaths | null = null
    let errorFile: ComponentPaths | null = null
    let loadingFile: ComponentPaths | null = null
    const children: RouteNode[] = []
    const pendingFlatMdx: FlatMdxPending[] = []
    const routePath = basePath === '' ? '/' : basePath
    const segmentMetadataFiles = scanSegmentMetadataFiles(dir, routePath)

    const isAsync = (filePath: string | null): boolean => {
      if (!filePath) return false
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        return (
          /export\s+async\s+default\s+function/i.test(content) ||
          /export\s+default\s+async\s+function/i.test(content) ||
          /async\s+function\s+([A-Z][\w]*)/.test(content)
        )
      } catch (_e) {
        return false
      }
    }

    const getPath = (obj: ComponentPaths | string | null): string | null => {
      if (!obj) return null
      if (typeof obj === 'string') return obj
      return obj.path ?? obj.serverPath ?? obj.clientPath ?? null
    }

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (!['.ryx', '.js', '.jsx', '.ts', '.tsx', '.mdx'].includes(ext))
          continue

        const base = path.basename(entry.name, ext)
        let name = base

        const fullPath = path.join(dir, entry.name).replace(/\\/g, '/')
        const content = fs.readFileSync(fullPath, 'utf8')

        // Robust directive detection using regex
        let isServer =
          base.endsWith('.server') || /^\s*\/\/\s*@server/im.test(content)
        let isClient =
          base.endsWith('.client') || /^\s*\/\/\s*@client/im.test(content)

        if (base.endsWith('.server')) {
          name = base.slice(0, -7)
        } else if (base.endsWith('.client')) {
          name = base.slice(0, -7)
        }

        // Auto-detection if no explicit directives/suffixes
        if (!isServer && !isClient) {
          const hasHooks =
            /use(Store|Effect|LayoutEffect|Context|Ref|Memo|Id|Transition)/.test(
              content,
            )
          const hasAsyncExport =
            /export\s+async\s+default|export\s+default\s+async/.test(content)

          if (hasHooks) {
            isClient = true
          } else if (hasAsyncExport) {
            isServer = true
          } else {
            // Default to shared for ambiguous components
            isServer = false
            isClient = false
          }
        }

        if (this.debug) {
          console.log(
            `[AppRouter] File: ${entry.name} -> isServer: ${isServer}, isClient: ${isClient}`,
          )
        }

        const assign = (
          type: ComponentPaths | null,
          filePath: string,
        ): ComponentPaths => {
          if (!type) {
            return {
              path: isServer || isClient ? null : filePath,
              serverPath: isServer ? filePath : null,
              clientPath: isClient ? filePath : null,
            }
          }
          if (isServer) type.serverPath = filePath
          else if (isClient) type.clientPath = filePath
          else type.path = filePath
          return type
        }

        if (name === 'layout') layout = assign(layout, fullPath)
        else if (name === 'index') index = assign(index, fullPath)
        else if (name === 'error') errorFile = assign(errorFile, fullPath)
        else if (name === 'loading') loadingFile = assign(loadingFile, fullPath)
        else if (ext === '.mdx') {
          pendingFlatMdx.push({
            name,
            fullPath,
            index: assign(null, fullPath),
          })
        }
      }
    }

    const directoryNames = new Set(
      entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
    )

    for (const flatMdx of pendingFlatMdx) {
      if (directoryNames.has(flatMdx.name)) {
        if (this.debug) {
          console.warn(
            `[AppRouter] Ignoring ${flatMdx.name}.mdx — directory "${flatMdx.name}/" takes precedence`,
          )
        }
        continue
      }

      const routePath =
        basePath === '' || basePath === '/'
          ? `/${flatMdx.name}`
          : `${basePath}/${flatMdx.name}`

      children.push({
        path: routePath,
        dynamicSegment: null,
        layout: null,
        layoutIsAsync: false,
        index: flatMdx.index,
        indexIsAsync: isAsync(flatMdx.fullPath),
        error: null,
        loading: null,
        metadataFiles: [],
        children: [],
      })
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const routeSegment = entry.name
        const dynamicSegment = parseDynamicSegment(routeSegment)
        const routePath = routeSegment.replace(
          /\[(\.\.\.)?([^\]]+)\]/g,
          ':$1$2',
        )

        let newBasePath = basePath
        if (newBasePath === '/' || newBasePath === '') {
          newBasePath = `/${routePath}`
        } else {
          newBasePath = `${basePath}/${routePath}`
        }

        const childRoutes = this.scanDirectory(
          path.join(dir, entry.name),
          newBasePath,
          dynamicSegment,
        )
        if (childRoutes) {
          if (Array.isArray(childRoutes)) children.push(...childRoutes)
          else children.push(childRoutes)
        }
      }
    }

    if (
      !layout &&
      !index &&
      children.length === 0 &&
      !errorFile &&
      !loadingFile &&
      segmentMetadataFiles.length === 0
    ) {
      return null
    }

    const node: RouteNode = {
      path: routePath,
      dynamicSegment: segmentAtThisLevel,
      layout,
      layoutIsAsync: isAsync(getPath(layout)),
      index,
      indexIsAsync: isAsync(getPath(index)),
      error: errorFile,
      loading: loadingFile,
      metadataFiles: segmentMetadataFiles,
      children,
    }

    if (!layout && !index && !errorFile && !loadingFile) return children

    return node
  }

  generateRouterFile(
    routeNode: RouteNode | RouteNode[] | null,
    outputPath: string,
  ) {
    const generate = (isServerBuild: boolean) => {
      let importStatements = `import Ryunix, { RouterProvider, Children, useMetadata, useEffect, useStore, ServerBoundary, HydrationBoundary, RyunixDevOverlay, mergeRouteMetadata } from '@unsetsoft/ryunixjs';\n`
      let componentIdCounter = 0
      const getNextId = () => componentIdCounter++
      const routeDefinitions: RouteDefinition[] = []
      const staticSsgRoutes: SsgRouteMeta[] = []
      const dynamicSsgRoutes: DynamicSsgRoute[] = []
      let rootLayouts: ComponentInfo[] = []

      const appDirPath = path.resolve(process.cwd(), this.appDir)
      const errorsPath = fs.existsSync(path.join(appDirPath, 'error.ryx'))
        ? path.join(appDirPath, 'error.ryx')
        : null

      let errorsId: string | null = null
      if (errorsPath) {
        errorsId = `Errors_App`
        importStatements += `import * as ${errorsId} from '${this.getRelativeImport(errorsPath, outputPath)}';\n`
      }

      const traverse = (
        node: RouteNode | RouteNode[],
        parentLayouts: ComponentInfo[] = [],
        dynamicSegments: DynamicSsgSegment[] = [],
        inheritedMetadata: RouteMetadataAsset[] = [],
      ) => {
        if (Array.isArray(node)) {
          for (const child of node)
            traverse(child, parentLayouts, dynamicSegments, inheritedMetadata)
          return
        }

        const routeMetadataChain = mergeMetadataAssets(
          inheritedMetadata,
          node.metadataFiles || [],
        )
        const routeFileMeta = metadataAssetsToMeta(routeMetadataChain)
        const fileMetadataJson = JSON.stringify(routeFileMeta)

        const currentLayouts = [...parentLayouts]
        let layoutInfo: ComponentInfo | null = null
        let indexInfo: ComponentInfo | null = null

        const processComponent = (
          prefix: string,
          componentObj: ComponentPaths | null,
          isAsync: boolean,
        ): ComponentInfo | null => {
          if (!componentObj) return null
          const id = `${prefix}_${getNextId()}`
          const compPath = isServerBuild
            ? componentObj.serverPath ||
              componentObj.path ||
              componentObj.clientPath
            : componentObj.clientPath || componentObj.path

          if (!compPath) {
            return { id, isServerComponent: true, isAsync, isProxy: true }
          }

          importStatements += `import * as ${id} from '${this.getRelativeImport(compPath, outputPath)}';\n`
          return { id, isServerComponent: !!componentObj.serverPath, isAsync }
        }

        if (node.layout) {
          layoutInfo = processComponent(
            'Layout',
            node.layout,
            !!node.layoutIsAsync,
          )
          const layoutLoadingInfo = processComponent(
            'Loading',
            node.loading,
            false,
          )
          const layoutErrorInfo = processComponent('Error', node.error, false)

          if (layoutInfo) {
            layoutInfo.loading = layoutLoadingInfo
            layoutInfo.error = layoutErrorInfo
            currentLayouts.push(layoutInfo)
            if (
              parentLayouts.length === 0 &&
              !rootLayouts.some((l) => l.id === layoutInfo!.id)
            ) {
              rootLayouts.push(layoutInfo)
            }
          }
        }

        let segments: DynamicSsgSegment[] = dynamicSegments

        if (node.index) {
          indexInfo = processComponent('Index', node.index, !!node.indexIsAsync)
          const loadingInfo = processComponent('Loading', node.loading, false)
          const errorFileInfo = processComponent('Error', node.error, false)

          if (node.dynamicSegment) {
            segments = [
              ...dynamicSegments,
              {
                param: node.dynamicSegment.param,
                isCatchAll: node.dynamicSegment.isCatchAll,
                layoutId: layoutInfo?.id || null,
                indexId: indexInfo?.id || null,
              },
            ]
          }

          if (indexInfo) {
            const formatComp = (
              info: ComponentInfo | null | undefined,
            ): string => {
              if (!info) return 'null'
              if (info.isProxy)
                return `{ isServerComponent: true, id: '${info.id}', isAsync: ${info.isAsync}, loading: ${formatComp(info.loading)}, error: ${formatComp(info.error)} }`
              return `{ default: getOptExport(${info.id}, 'default'), isServerComponent: ${info.isServerComponent}, id: '${info.id}', isAsync: ${info.isAsync}, loading: ${formatComp(info.loading)}, error: ${formatComp(info.error)}, Metatags: getOptExport(${info.id}, 'Metatags') || getOptExport(${info.id}, 'frontmatter') || {}, generateMetadata: getOptExport(${info.id}, 'generateMetadata') }`
            }

            const layoutsArrayStr = `[${currentLayouts.map((l) => formatComp(l)).join(', ')}]`
            const indexConfigStr = formatComp(indexInfo)
            const loadingConfigStr = formatComp(loadingInfo)
            const errorConfigStr = formatComp(errorFileInfo)

            const errorPropStr = errorsId
              ? `Object.assign(${indexConfigStr}, { errorComponent: getOptExport(${errorsId}, 'UnknownError') || getOptExport(${errorsId}, 'default') })`
              : indexConfigStr

            routeDefinitions.push({
              path: node.path,
              layoutsArrayStr,
              errorPropStr,
              loadingConfigStr,
              errorConfigStr,
              fileMetadataJson,
            })

            if (isServerBuild) {
              const metadataAssets = toMetadataAssetManifest(routeMetadataChain)
              if (node.path.includes(':')) {
                dynamicSsgRoutes.push({
                  path: node.path,
                  meta: routeFileMeta,
                  metadataAssets,
                  segments,
                })
              } else {
                staticSsgRoutes.push({
                  path: node.path,
                  meta: routeFileMeta,
                  metadataAssets,
                })
              }
            }
          }
        } else if (node.dynamicSegment) {
          segments = [
            ...dynamicSegments,
            {
              param: node.dynamicSegment.param,
              isCatchAll: node.dynamicSegment.isCatchAll,
              layoutId: layoutInfo?.id || null,
              indexId: null,
            },
          ]
        }

        if (Array.isArray(node.children)) {
          for (const child of node.children) {
            traverse(child, currentLayouts, segments, routeMetadataChain)
          }
        }
      }

      if (routeNode) traverse(routeNode)

      let notFoundRouteStr = ''
      if (errorsId) {
        const layoutsArrayStr = `[${rootLayouts.map((l) => `{ default: getOptExport(${l.id}, 'default'), isServerComponent: ${l.isServerComponent}, id: '${l.id}', isAsync: ${l.isAsync}, Metatags: getOptExport(${l.id}, 'Metatags') || getOptExport(${l.id}, 'frontmatter') || {} }`).join(', ')}]`
        notFoundRouteStr = `,
    {
      path: '*',
      NotFound: (props) => <RouteWrapper routePath="*" layouts={${layoutsArrayStr}} index={{ default: getOptExport(${errorsId}, 'NotFound') || getOptExport(${errorsId}, 'default'), isAsync: false, Metatags: getOptExport(${errorsId}, 'Metatags') || getOptExport(${errorsId}, 'frontmatter') || {} }} props={props} />
    }`
      }

      return {
        content: this.assembleFileContent(
          importStatements,
          routeDefinitions,
          notFoundRouteStr,
        ),
        staticSsgRoutes,
        dynamicSsgRoutes,
      }
    }

    const clientResult = generate(false)
    const serverResult = generate(true)

    this.writeIfChanged(outputPath, clientResult.content)

    const serverEntryPath = path.join(
      path.dirname(outputPath),
      'app-router-server.js',
    )
    const ssgManifestRoutes = [
      ...serverResult.staticSsgRoutes,
      ...serverResult.dynamicSsgRoutes.map(
        ({ path: routePath, meta, segments, metadataAssets }) => ({
          path: routePath,
          meta,
          metadataAssets,
          dynamic: true,
          segments,
        }),
      ),
    ]
    const resolveSSGPathsCode =
      serverResult.dynamicSsgRoutes.length > 0
        ? generateResolveSSGPathsCode(
            serverResult.staticSsgRoutes,
            serverResult.dynamicSsgRoutes,
          )
        : ''
    const serverEntryContent = `/* AUTO-GENERATED SERVER ROUTER */\n${serverResult.content}\nexport const ssgRoutes = ${JSON.stringify(ssgManifestRoutes, null, 2)};\n${resolveSSGPathsCode}\n`
    this.writeIfChanged(serverEntryPath, serverEntryContent)

    const mainEntryPath = path.join(path.dirname(outputPath), 'main.ryx')

    // Look for global CSS to include in the client bundle
    let globalCssImport = ''
    const possibleCssPaths = [
      path.resolve(process.cwd(), 'styles/global.css'),
      path.resolve(process.cwd(), 'src/styles/global.css'),
      path.resolve(process.cwd(), 'app/globals.css'),
      path.resolve(process.cwd(), 'src/app/globals.css'),
    ]

    const foundCss = possibleCssPaths.find((p) => fs.existsSync(p))
    if (foundCss) {
      const relCss = this.getRelativeImport(foundCss, mainEntryPath)
      globalCssImport = `import '${relCss}';\n`
    }

    this.writeIfChanged(
      mainEntryPath,
      `import Ryunix from '@unsetsoft/ryunixjs';\n${globalCssImport}import AppRouter from './${path.basename(outputPath)}';\nif (typeof window !== 'undefined') { globalThis.Ryunix = Ryunix; }\nRyunix.init(<AppRouter />);\n`,
    )

    const ssgManifestPath = this.ssgOutputPath
      ? path.resolve(process.cwd(), this.ssgOutputPath)
      : path.join(path.dirname(outputPath), 'ssg', 'routes.json')
    this.writeIfChanged(
      ssgManifestPath,
      JSON.stringify(ssgManifestRoutes, null, 2),
    )

    this.syncMetadataAssetsToStatic([
      ...serverResult.staticSsgRoutes,
      ...serverResult.dynamicSsgRoutes,
    ])
  }

  syncMetadataAssetsToStatic(routes: SsgRouteMeta[]) {
    const assets = new Map<string, RouteMetadataAsset>()
    for (const route of routes) {
      for (const manifest of route.metadataAssets || []) {
        assets.set(manifest.publicPath, {
          kind: manifest.kind,
          filename: manifest.filename,
          sourcePath: manifest.sourcePath,
          publicPath: manifest.publicPath,
        })
      }
    }

    if (assets.size === 0) return

    const staticRoot = path.resolve(process.cwd(), '.ryunix/static')
    copyRouteMetadataAssets(Array.from(assets.values()), staticRoot)
  }

  assembleFileContent(
    importStatements: string,
    routeDefinitions: RouteDefinition[],
    notFoundRouteStr = '',
  ) {
    const escapePath = (routePath: string) =>
      routePath.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

    const routeDefinitionEntries = routeDefinitions
      .map(
        (def) => `
  '${escapePath(def.path)}': {
    routePath: '${escapePath(def.path)}',
    layouts: ${def.layoutsArrayStr},
    index: ${def.errorPropStr},
    loading: ${def.loadingConfigStr},
    error: ${def.errorConfigStr},
    fileMetadata: ${def.fileMetadataJson},
  }`,
      )
      .join(',')

    const routeEntries = routeDefinitions
      .map(
        (def) => `
    { path: '${escapePath(def.path)}', component: RouteRenderer }`,
      )
      .join(',')

    return `/* AUTO-GENERATED APP ROUTER */
${importStatements}
const getOptExport = (mod, key) => mod ? mod[key] : undefined;

const resolveFileMetadata = (fileMetadata, routePath, params = {}) => {
  if (!fileMetadata || typeof fileMetadata !== 'object') return {};
  if (!routePath || !routePath.includes(':')) return fileMetadata;

  const actualPath = routePath
    .replace(/:\\.\\.\\.(\\w+)/g, (_, key) => {
      const val = params[key];
      if (val == null || val === '') return '';
      return Array.isArray(val) ? val.join('/') : String(val);
    })
    .replace(/:(\\w+)/g, (_, key) => {
      const val = params[key];
      if (val == null || val === '') return '';
      return Array.isArray(val) ? val.join('/') : String(val);
    })
    .replace(/\\/+/g, '/');

  const normalizedActual = actualPath.startsWith('/') ? actualPath : \`/\${actualPath}\`;
  const resolved = {};
  for (const [key, value] of Object.entries(fileMetadata)) {
    if (typeof value === 'string') {
      resolved[key] = value.split(routePath).join(normalizedActual);
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
};

const AsyncComponentRenderer = ({ Component, componentProps, ErrorFallback }) => {
  const [content, setContent] = useStore(() => {
    try {
      const res = Component(componentProps);
      if (res != null && typeof res === 'object' && typeof res.then === 'function') {
        return { status: 'pending', promise: res };
      }
      return { status: 'ready', node: <Ryunix.Fragment>{res}</Ryunix.Fragment> };
    } catch (err) {
      return { status: 'error', err };
    }
  });

  useEffect(() => {
    if (!content || content.status !== 'pending') return undefined;
    let active = true;
    content.promise
      .then((res) => {
        if (!active) return;
        setContent({ status: 'ready', node: <Ryunix.Fragment>{res}</Ryunix.Fragment> });
      })
      .catch((err) => {
        console.error('Error rendering async component:', err);
        if (!active) return;
        setContent({
          status: 'error',
          err,
        });
      });
    return () => {
      active = false;
    };
  }, [content?.status === 'pending' ? content.promise : null]);

  if (!content) return null;
  if (content.status === 'error') {
    return ErrorFallback ? (
      <ErrorFallback error={content.err} />
    ) : (
      <div style={{ padding: '2rem', color: 'red' }}>Error rendering async component</div>
    );
  }
  if (content.status === 'ready') return content.node;
  return null;
};

const SyncComponentRenderer = ({ Component, componentProps, ErrorFallback }) => {
  try {
    const res = Component(componentProps);
    return <Ryunix.Fragment>{res}</Ryunix.Fragment>;
  } catch(err) {
    console.error('Error rendering sync component:', err);
    return ErrorFallback ? <ErrorFallback error={err} /> : <div style={{ padding: '2rem', color: 'red' }}>Error rendering component</div>;
  }
};

const wrapRouteHydrationBoundary = (element, routePath) => {
  const mode = process.env.RYUNIX_HYDRATION_BOUNDARIES || 'route';
  if (!element || mode === 'server-only') return element;
  if (mode === 'route' || mode === 'all-layouts') {
    const id = routePath || 'route';
    return <HydrationBoundary id={id}>{element}</HydrationBoundary>;
  }
  return element;
};

const RouteWrapper = (props) => {
  const isServer = globalThis.process && String(globalThis.process.env?.RYUNIX_IS_SERVER) === 'true';
  if (isServer) {
    return RouteWrapperServer(props);
  }
  return RouteWrapperClient(props);
};

const RouteWrapperServer = async ({ routePath, layouts, index, props, loading, error, fileMetadata = {} }) => {
  let combinedMeta = mergeRouteMetadata({}, resolveFileMetadata(fileMetadata, routePath, props.params));
  if (layouts) {
    for (const l of layouts) {
      if (l.Metatags) combinedMeta = mergeRouteMetadata(combinedMeta, l.Metatags);
      if (l.generateMetadata) {
        try {
          const dynamic = await l.generateMetadata({ params: props.params, searchParams: props.query });
          combinedMeta = mergeRouteMetadata(combinedMeta, dynamic);
        } catch (e) { console.error('Error in layout generateMetadata:', e); }
      }
    }
  }
  if (index) {
    if (index.Metatags) combinedMeta = mergeRouteMetadata(combinedMeta, index.Metatags);
    if (index.generateMetadata) {
      try {
        const dynamic = await index.generateMetadata({ params: props.params, searchParams: props.query });
        combinedMeta = mergeRouteMetadata(combinedMeta, dynamic);
      } catch (e) { console.error('Error in index generateMetadata:', e); }
    }
  }
  useMetadata(combinedMeta);

  return <RouteWrapperRender routePath={routePath} layouts={layouts} index={index} props={props} loading={loading} error={error} />;
};

const RouteWrapperClient = ({ routePath, layouts, index, props, loading, error, fileMetadata = {} }) => {
  const getStaticMeta = () => {
    let meta = mergeRouteMetadata({}, resolveFileMetadata(fileMetadata, routePath, props.params));
    if (layouts) {
      for (const l of layouts) {
        if (l.Metatags) meta = mergeRouteMetadata(meta, l.Metatags);
      }
    }
    if (index && index.Metatags) {
      meta = mergeRouteMetadata(meta, index.Metatags);
    }
    return meta;
  };

  const [currentMeta, setCurrentMeta] = useStore(getStaticMeta());
  useMetadata(currentMeta);

  useEffect(() => {
    const runMetadata = async () => {
      let combinedMeta = getStaticMeta();
      if (layouts) {
        for (const l of layouts) {
          if (l.generateMetadata) {
            try {
              const dynamic = await l.generateMetadata({ params: props.params, searchParams: props.query });
              combinedMeta = mergeRouteMetadata(combinedMeta, dynamic);
            } catch (e) { console.error('Error in layout generateMetadata:', e); }
          }
        }
      }
      if (index && index.generateMetadata) {
        try {
          const dynamic = await index.generateMetadata({ params: props.params, searchParams: props.query });
          combinedMeta = mergeRouteMetadata(combinedMeta, dynamic);
        } catch (e) { console.error('Error in index generateMetadata:', e); }
      }
      setCurrentMeta(combinedMeta);
    };
    runMetadata();
  }, [JSON.stringify(props.params), JSON.stringify(props.query), props.location]);

  return <RouteWrapperRender routePath={routePath} layouts={layouts} index={index} props={props} loading={loading} error={error} />;
};

const RouteWrapperRender = ({ routePath, layouts, index, props, loading, error }) => {

  let content = null;
  const isServerRender = typeof process !== 'undefined' && String(process.env.RYUNIX_IS_SERVER) === 'true';

  const renderComponent = (compInfo, props) => {
    if (!compInfo || !compInfo.default) return null;
    if (isServerRender) {
       // Server side: directly render to support Server Components returning Promises
       return <compInfo.default {...props} />;
    }
    // Client side: use wrapper for async components
    if (compInfo.isAsync) {
      return <AsyncComponentRenderer Component={compInfo.default} componentProps={props} ErrorFallback={compInfo.errorComponent} />;
    }
    return <SyncComponentRenderer Component={compInfo.default} componentProps={props} ErrorFallback={compInfo.errorComponent} />;
  }

  const wrapBoundaries = (element, l, e) => {
    let result = element;
    if (l && l.default) {
      result = <Ryunix.Suspense fallback={<l.default />}>{result}</Ryunix.Suspense>;
    }
    if (e && e.default) {
      result = <Ryunix.ErrorBoundary fallback={e.default}>{result}</Ryunix.ErrorBoundary>;
    }
    return result;
  }

  if (index) {
    if (index.isServerComponent) {
      if (index.default) {
        content = (
          <ServerBoundary id={index.id}>
            {renderComponent(index, props)}
          </ServerBoundary>
        );
      } else {
        content = <ServerBoundary id={index.id} />;
      }
    } else if (index.default) {
      content = renderComponent(index, props);
    }
    
    // Wrap index with its segment boundaries and route-level hydration boundary only.
    content = wrapBoundaries(content, loading, error);
    content = (
      <Ryunix.Fragment key={'page-' + (index.id || routePath)}>
        {wrapRouteHydrationBoundary(content, routePath)}
      </Ryunix.Fragment>
    );
  }

  if (layouts) {
    for (let i = layouts.length - 1; i >= 0; i--) {
      const l = layouts[i];
      let layoutContent = null;
      if (l.isServerComponent) {
         if (l.default) {
           layoutContent = (
             <ServerBoundary id={l.id}>
               {renderComponent(l, { ...props, children: content })}
             </ServerBoundary>
           );
         } else {
           layoutContent = <ServerBoundary id={l.id}>{content}</ServerBoundary>;
         }
      } else if (l.default) {
        layoutContent = renderComponent(l, { ...props, children: content });
      }

      if (layoutContent) {
        content = (
          <Ryunix.Fragment key={'layout-' + l.id}>
            {wrapBoundaries(layoutContent, l.loading, l.error)}
          </Ryunix.Fragment>
        );
      }
    }
  }

  return content;
};

const ROUTE_DEFINITIONS = {${routeDefinitionEntries}
};

const routePathToRegex = (routePath) => {
  const parts = routePath.split('/').filter(Boolean).map((segment) => {
    if (segment.startsWith(':...')) return '(.+)';
    if (segment.startsWith(':')) return '([^/]+)';
    return segment;
  });
  return new RegExp('^/' + parts.join('/') + '$');
};

const resolveRouteDefinition = (pathname) => {
  const direct = ROUTE_DEFINITIONS[pathname];
  if (direct) return direct;
  for (const [pattern, def] of Object.entries(ROUTE_DEFINITIONS)) {
    if (!pattern.includes(':')) continue;
    if (routePathToRegex(pattern).test(pathname)) return def;
  }
  return null;
};

const RouteRenderer = (props) => {
  const pathname = (props.location || '/').split('?')[0].split('#')[0];
  const def = resolveRouteDefinition(pathname);
  if (!def) return null;
  return (
    <RouteWrapper
      routePath={def.routePath}
      layouts={def.layouts}
      index={def.index}
      loading={def.loading}
      error={def.error}
      fileMetadata={def.fileMetadata || {}}
      props={props}
    />
  );
};

const routes = [${routeEntries}${notFoundRouteStr}
];

export default function AppRouter() {
  const isDev = process.env.NODE_ENV !== 'production';
  const content = (
    <Ryunix.RouterProvider routes={routes}>
      <Ryunix.Children />
    </Ryunix.RouterProvider>
  );

  if (isDev) {
    return (
      <Ryunix.ErrorBoundary fallback={RyunixDevOverlay}>
        {content}
      </Ryunix.ErrorBoundary>
    );
  }

  return content;
}
`
  }

  writeIfChanged(filePath: string, content: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    if (fs.existsSync(filePath)) {
      if (fs.readFileSync(filePath, 'utf8') === content) return
    }
    fs.writeFileSync(filePath, content)
  }

  getRelativeImport(targetPath: string, outputPath: string) {
    const relativePath = path
      .relative(path.dirname(outputPath), targetPath)
      .replace(/\\/g, '/')
    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
  }

  getNewestMtime(dirPath: string) {
    let newest = 0
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        try {
          const stats = fs.statSync(fullPath)
          const mtime = stats.mtimeMs
          if (mtime > newest) newest = mtime
          if (entry.isDirectory()) {
            const childNewest = this.getNewestMtime(fullPath)
            if (childNewest > newest) newest = childNewest
          }
        } catch {}
      }
    } catch {}
    return newest
  }
}

export default AppRouterPlugin
