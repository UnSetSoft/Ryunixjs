import fs from 'fs'
import path from 'path'
class AppRouterPlugin {
  appDir
  outputPath
  ssgOutputPath
  debug
  constructor(options = {}) {
    this.appDir = options.appDir || 'src/app'
    this.outputPath = options.outputPath || '.ryunix/server/app/app-router.js'
    this.ssgOutputPath = options.ssgOutputPath || null
    this.debug = options.debug || false
  }
  apply(compiler) {
    let lastScanTime = 0
    let lastRoutes = null
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
        if (params && params.compilationDependencies) {
          params.contextDependencies.add(appDirPath)
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
  scanDirectory(dir, basePath) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    let layout = null
    let index = null
    let errorFile = null
    let loadingFile = null
    const children = []
    const isAsync = (filePath) => {
      if (!filePath) return false
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        return (
          /export\s+async\s+default\s+function/i.test(content) ||
          /export\s+default\s+async\s+function/i.test(content) ||
          /async\s+function\s+([A-Z][\w]*)/.test(content)
        )
      } catch (e) {
        return false
      }
    }
    const getPath = (obj) => {
      if (!obj) return null
      if (typeof obj === 'string') return obj
      return obj.path || obj.serverPath || obj.clientPath
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
        const assign = (type, path) => {
          if (!type) {
            return {
              path: isServer || isClient ? null : path,
              serverPath: isServer ? path : null,
              clientPath: isClient ? path : null,
            }
          }
          if (isServer) type.serverPath = path
          else if (isClient) type.clientPath = path
          else type.path = path
          return type
        }
        if (name === 'layout') layout = assign(layout, fullPath)
        else if (name === 'index') index = assign(index, fullPath)
        else if (name === 'error') errorFile = assign(errorFile, fullPath)
        else if (name === 'loading') loadingFile = assign(loadingFile, fullPath)
      }
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const routeSegment = entry.name
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
      !loadingFile
    ) {
      return null
    }
    const node = {
      path: basePath === '' ? '/' : basePath,
      layout,
      layoutIsAsync: isAsync(getPath(layout)),
      index,
      indexIsAsync: isAsync(getPath(index)),
      error: errorFile,
      loading: loadingFile,
      children,
    }
    if (!layout && !index && !errorFile && !loadingFile) return children
    return node
  }
  generateRouterFile(routeNode, outputPath) {
    const generate = (isServerBuild) => {
      let importStatements = `import Ryunix, { RouterProvider, Children, useMetadata, useEffect, useStore, ServerBoundary, RyunixDevOverlay } from '@unsetsoft/ryunixjs';\n`
      let componentIdCounter = 0
      const getNextId = () => componentIdCounter++
      const flattenedRoutes = []
      const ssgRoutes = []
      let rootLayouts = []
      const appDirPath = path.resolve(process.cwd(), this.appDir)
      const errorsPath = fs.existsSync(path.join(appDirPath, 'error.ryx'))
        ? path.join(appDirPath, 'error.ryx')
        : null
      let errorsId = null
      if (errorsPath) {
        errorsId = `Errors_App`
        importStatements += `import * as ${errorsId} from '${this.getRelativeImport(errorsPath, outputPath)}';\n`
      }
      const traverse = (node, parentLayouts = []) => {
        if (Array.isArray(node)) {
          for (const child of node) traverse(child, parentLayouts)
          return
        }
        const currentLayouts = [...parentLayouts]
        const processComponent = (prefix, componentObj, isAsync) => {
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
          const layoutInfo = processComponent(
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
              !rootLayouts.some((l) => l.id === layoutInfo.id)
            ) {
              rootLayouts.push(layoutInfo)
            }
          }
        }
        if (node.index) {
          const indexInfo = processComponent(
            'Index',
            node.index,
            !!node.indexIsAsync,
          )
          const loadingInfo = processComponent('Loading', node.loading, false)
          const errorFileInfo = processComponent('Error', node.error, false)
          if (indexInfo) {
            const formatComp = (info) => {
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
            flattenedRoutes.push(`
    {
      path: '${node.path}',
      component: (props) => <RouteWrapper layouts={${layoutsArrayStr}} index={${errorPropStr}} loading={${loadingConfigStr}} error={${errorConfigStr}} props={props} />
    }`)
            if (isServerBuild) {
              ssgRoutes.push({ path: node.path, meta: {} })
            }
          }
        }
        if (Array.isArray(node.children)) {
          for (const child of node.children) traverse(child, currentLayouts)
        }
      }
      if (routeNode) traverse(routeNode)
      if (errorsId) {
        const layoutsArrayStr = `[${rootLayouts.map((l) => `{ default: getOptExport(${l.id}, 'default'), isServerComponent: ${l.isServerComponent}, id: '${l.id}', isAsync: ${l.isAsync}, Metatags: getOptExport(${l.id}, 'Metatags') || getOptExport(${l.id}, 'frontmatter') || {} }`).join(', ')}]`
        flattenedRoutes.push(`
    {
      path: '*',
      NotFound: (props) => <RouteWrapper layouts={${layoutsArrayStr}} index={{ default: getOptExport(${errorsId}, 'NotFound') || getOptExport(${errorsId}, 'default'), isAsync: false, Metatags: getOptExport(${errorsId}, 'Metatags') || getOptExport(${errorsId}, 'frontmatter') || {} }} props={props} />
    }`)
      }
      return {
        content: this.assembleFileContent(importStatements, flattenedRoutes),
        ssgRoutes,
      }
    }
    const clientResult = generate(false)
    const serverResult = generate(true)
    this.writeIfChanged(outputPath, clientResult.content)
    const serverEntryPath = path.join(
      path.dirname(outputPath),
      'app-router-server.js',
    )
    const serverEntryContent = `/* AUTO-GENERATED SERVER ROUTER */\n${serverResult.content}\nexport const ssgRoutes = ${JSON.stringify(serverResult.ssgRoutes, null, 2)};\n`
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
      JSON.stringify(serverResult.ssgRoutes, null, 2),
    )
  }
  assembleFileContent(importStatements, flattenedRoutes) {
    return `/* AUTO-GENERATED APP ROUTER */
${importStatements}
const getOptExport = (mod, key) => mod ? mod[key] : undefined;

const AsyncComponentRenderer = ({ Component, componentProps, ErrorFallback }) => {
  const [content, setContent] = useStore(null);
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await Component(componentProps);
        if (active) setContent(<Ryunix.Fragment>{res}</Ryunix.Fragment>);
      } catch(err) {
        console.error('Error rendering async component:', err);
        if (active) setContent(ErrorFallback ? <ErrorFallback error={err} /> : <div style={{ padding: '2rem', color: 'red' }}>Error rendering async component</div>);
      }
    };
    run();
    return () => { active = false; };
  }, []);
  return content;
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

const RouteWrapper = (props) => {
  const isServer = typeof process !== 'undefined' && String(process.env.RYUNIX_IS_SERVER) === 'true';
  if (isServer) {
    return RouteWrapperServer(props);
  }
  return RouteWrapperClient(props);
};

const RouteWrapperServer = async ({ layouts, index, props, loading, error }) => {
  let combinedMeta = {};
  if (layouts) {
    for (const l of layouts) {
      if (l.Metatags) combinedMeta = { ...combinedMeta, ...l.Metatags };
      if (l.generateMetadata) {
        try {
          const dynamic = await l.generateMetadata({ params: props.params, searchParams: props.query });
          combinedMeta = { ...combinedMeta, ...dynamic };
        } catch (e) { console.error('Error in layout generateMetadata:', e); }
      }
    }
  }
  if (index) {
    if (index.Metatags) combinedMeta = { ...combinedMeta, ...index.Metatags };
    if (index.generateMetadata) {
      try {
        const dynamic = await index.generateMetadata({ params: props.params, searchParams: props.query });
        combinedMeta = { ...combinedMeta, ...dynamic };
      } catch (e) { console.error('Error in index generateMetadata:', e); }
    }
  }
  useMetadata(combinedMeta);

  return <RouteWrapperRender layouts={layouts} index={index} props={props} loading={loading} error={error} />;
};

const RouteWrapperClient = ({ layouts, index, props, loading, error }) => {
  const getStaticMeta = () => {
    let meta = {};
    if (layouts) {
      for (const l of layouts) {
        if (l.Metatags) meta = { ...meta, ...l.Metatags };
      }
    }
    if (index && index.Metatags) {
      meta = { ...meta, ...index.Metatags };
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
              combinedMeta = { ...combinedMeta, ...dynamic };
            } catch (e) { console.error('Error in layout generateMetadata:', e); }
          }
        }
      }
      if (index && index.generateMetadata) {
        try {
          const dynamic = await index.generateMetadata({ params: props.params, searchParams: props.query });
          combinedMeta = { ...combinedMeta, ...dynamic };
        } catch (e) { console.error('Error in index generateMetadata:', e); }
      }
      setCurrentMeta(combinedMeta);
    };
    runMetadata();
  }, [JSON.stringify(props.params), JSON.stringify(props.query), props.location]);

  return <RouteWrapperRender layouts={layouts} index={index} props={props} loading={loading} error={error} />;
};

const RouteWrapperRender = ({ layouts, index, props, loading, error }) => {

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
    
    // Wrap index with its segment boundaries
    content = wrapBoundaries(content, loading, error);
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
        content = wrapBoundaries(layoutContent, l.loading, l.error);
      }
    }
  }

  return content;
};

const routes = [${flattenedRoutes.join(',\n')}];

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
  writeIfChanged(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    if (fs.existsSync(filePath)) {
      if (fs.readFileSync(filePath, 'utf8') === content) return
    }
    fs.writeFileSync(filePath, content)
  }
  getRelativeImport(targetPath, outputPath) {
    const relativePath = path
      .relative(path.dirname(outputPath), targetPath)
      .replace(/\\/g, '/')
    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
  }
  getNewestMtime(dirPath) {
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
