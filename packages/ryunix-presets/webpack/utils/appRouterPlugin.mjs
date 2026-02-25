import fs from 'fs';
import path from 'path';

class AppRouterPlugin {
  constructor(options = {}) {
    this.appDir = options.appDir || 'src/app';
    this.outputPath = options.outputPath || '.ryunix/app-router.js';
    this.debug = options.debug || false;
  }

  apply(compiler) {
    let lastScanTime = 0;
    let lastRoutes = null;

    compiler.hooks.beforeCompile.tapAsync('AppRouterPlugin', (params, callback) => {
      const appDirPath = path.resolve(process.cwd(), this.appDir);

      if (!fs.existsSync(appDirPath)) {
        if (this.debug) console.log(`[AppRouter] No app directory found at ${appDirPath}`);
        callback();
        return;
      }

      if (params && params.compilationDependencies) {
        params.contextDependencies.add(appDirPath)
      }

      try {
        // Simple optimization: check if any file in the directory has changed
        // This is a bit coarse but better than scanning everything every time
        const stats = fs.statSync(appDirPath);
        const mtime = stats.mtimeMs;

        if (mtime > lastScanTime || !lastRoutes) {
          const routes = this.scanDirectory(appDirPath, '');
          this.generateRouterFile(routes, path.resolve(process.cwd(), this.outputPath));
          lastScanTime = mtime;
          lastRoutes = routes;
        }
      } catch (error) {
        console.error('[AppRouter] ❌ ERROR generating app router:', error);
      }

      callback();
    });

    compiler.hooks.afterCompile.tapAsync('AppRouterPlugin', (compilation, callback) => {
      const appDirPath = path.resolve(process.cwd(), this.appDir)
      if (fs.existsSync(appDirPath)) {
        compilation.contextDependencies.add(appDirPath)
      }
      callback()
    })
  }

  scanDirectory(dir, basePath) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let layout = null;
    let index = null;
    let errorFile = null;
    let loadingFile = null;
    const children = [];

    // Find special files
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (!['.ryx', '.js', '.jsx', '.ts', '.tsx', '.mdx'].includes(ext)) continue;

        const name = path.basename(entry.name, ext);
        const fullPath = path.join(dir, entry.name).replace(/\\/g, '/');

        if (name === 'layout') layout = fullPath;
        else if (name === 'index') index = fullPath;
        else if (name === 'error') errorFile = fullPath;
        else if (name === 'loading') loadingFile = fullPath;
      }
    }

    // Process subdirectories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const routeSegment = entry.name;
        // Convert [...slug] to :...slug and [slug] to :slug
        const routePath = routeSegment.replace(/\[(\.\.\.)?([^\]]+)\]/g, ':$1$2');

        let newBasePath = basePath;
        if (newBasePath === '/') {
          newBasePath = `/${routePath}`;
        } else if (newBasePath === '') {
          newBasePath = `/${routePath}`;
        } else {
          newBasePath = `${basePath}/${routePath}`;
        }

        const childRoutes = this.scanDirectory(
          path.join(dir, entry.name),
          newBasePath
        );
        if (childRoutes) {
          // If the child is an array (flattened from a folder with only children but no index/layout), concat it.
          // Otherwise, push it.
          if (Array.isArray(childRoutes)) {
            children.push(...childRoutes);
          } else {
            children.push(childRoutes);
          }
        }
      }
    }

    const extractMeta = (filePath) => {
      if (!filePath) return null;
      try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Remove BOM if present
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        content = content.replace(/\r\n/g, '\n');

        // Check for MDX YAML frontmatter
        if (filePath.endsWith('.mdx')) {
          const mdxMatch = content.match(/^---\s*\n([\s\S]*?)\n\s*---/);
          if (mdxMatch) {
            const yamlContent = mdxMatch[1];
            const frontmatter = {};
            const lines = yamlContent.split('\n').filter(line => line.trim());

            for (const line of lines) {
              const keyValueMatch = line.match(/^\s*(\w+)\s*:\s*(.+)$/);
              if (keyValueMatch) {
                const key = keyValueMatch[1].trim();
                let value = keyValueMatch[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                  value = value.slice(1, -1);
                }
                frontmatter[key] = value;
              }
            }
            // Title and description are the standard keys in YAML used for metatags
            if (Object.keys(frontmatter).length > 0) return frontmatter;
          }
        }

        const metatagMatch = content.match(/export\s+const\s+Metatags?\s*=\s*(\{[\s\S]*?\})(?=\s*(?:export|;|$))/);
        if (metatagMatch) {
          return new Function(`return ${metatagMatch[1]}`)();
        }
      } catch (e) {
        if (this.debug) console.error(`[AppRouter] Error parsing Metatag in ${filePath}:`, e.message);
      }
      return null;
    };

    const layoutMeta = extractMeta(layout) || {};
    const indexMeta = extractMeta(index) || {};
    let meta = {};

    const mergeMeta = (target, source) => {
      if (!source) return;
      Object.keys(source).forEach(key => {
        if (key === 'title') {
          if (typeof source.title === 'object') {
            target.titleTemplate = source.title.template || target.titleTemplate;
            target.titleDefault = source.title.default || target.titleDefault;
            target.title = source.title.default || target.title;
          } else {
            target.title = source.title;
          }
        } else {
          target[key] = source[key];
        }
      });
    };

    mergeMeta(meta, layoutMeta);
    mergeMeta(meta, indexMeta);



    if (Object.keys(meta).length === 0) {
      meta = null;
    }

    if (!layout && !index && children.length === 0 && !errorFile && !loadingFile) {
      return null;
    }

    const isAsync = (filePath) => {
      if (!filePath) return false;
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('async function') || content.includes('async (');
      } catch (e) {
        return false;
      }
    };

    const node = {
      path: basePath === '' ? '/' : basePath,
      layout,
      layoutIsAsync: isAsync(layout),
      index,
      indexIsAsync: isAsync(index),
      meta,
      error: errorFile,
      loading: loadingFile,
      children,
    };

    if (!layout && !index && !errorFile && !loadingFile) {
      return children;
    }

    return node;
  }

  generateRouterFile(routeNode, outputPath) {
    let importStatements = `import Ryunix, { RouterProvider, Children, useMetadata, useEffect, useStore } from '@unsetsoft/ryunixjs';\n`;
    let routeDefinitions = '';

    let componentIdCounter = 0;
    const getNextId = () => componentIdCounter++;

    // Flatten logic
    const flattenedRoutes = [];
    const ssgRoutes = [];

    let rootLayouts = [];

    const appDirPath = path.resolve(process.cwd(), this.appDir);
    const errorsPath = Math.max(fs.existsSync(path.join(appDirPath, 'errors.ryx')), fs.existsSync(path.join(appDirPath, 'error.ryx')))
      ? fs.existsSync(path.join(appDirPath, 'errors.ryx')) ? path.join(appDirPath, 'errors.ryx') : path.join(appDirPath, 'error.ryx')
      : null;

    let errorsId = null;
    if (errorsPath) {
      errorsId = `Errors_App`;
      importStatements += `import * as ${errorsId} from '${this.getRelativeImport(errorsPath, outputPath)}';\n`;
    }

    const mergeStaticMeta = (target, source) => {
      if (!source) return;
      Object.keys(source).forEach(key => {
        if (key === 'title') {
          if (typeof source.title === 'object') {
            target.titleTemplate = source.title.template || target.titleTemplate;
            target.titleDefault = source.title.default || target.titleDefault;
            target.title = source.title.default || target.title;
          } else {
            target.title = source.title;
          }
        } else {
          target[key] = source[key];
        }
      });
    };

    const traverse = (node, parentLayouts = [], inheritedMeta = {}) => {
      if (Array.isArray(node)) {
        for (const child of node) {
          traverse(child, parentLayouts, inheritedMeta);
        }
        return;
      }

      const currentLayouts = [...parentLayouts];
      const currentMeta = { ...inheritedMeta };
      if (node.meta) Object.assign(currentMeta, JSON.parse(JSON.stringify(node.meta))); // deep clone workaround

      if (node.meta) {
        mergeStaticMeta(currentMeta, node.meta);
      }
      if (node.layout) {
        const layoutId = `Layout_${getNextId()}`;
        importStatements += `import * as ${layoutId} from '${this.getRelativeImport(node.layout, outputPath)}';\n`;
        currentLayouts.push({ id: layoutId, isAsync: !!node.layoutIsAsync });
        if (parentLayouts.length === 0 && !rootLayouts.some(l => l.id === layoutId)) {
          rootLayouts.push({ id: layoutId, isAsync: !!node.layoutIsAsync });
        }
      }

      if (node.index) {
        const indexId = `Index_${getNextId()}`;
        importStatements += `import * as ${indexId} from '${this.getRelativeImport(node.index, outputPath)}';\n`;

        const layoutsArrayStr = `[${currentLayouts.map(l => `{ default: getOptExport(${l.id}, 'default'), isAsync: ${l.isAsync}, Metatags: getOptExport(${l.id}, 'Metatags') || getOptExport(${l.id}, 'frontmatter') || {} }`).join(', ')}]`;
        const indexConfigStr = `{ default: getOptExport(${indexId}, 'default'), isAsync: ${!!node.indexIsAsync}, Metatags: getOptExport(${indexId}, 'Metatags') || getOptExport(${indexId}, 'frontmatter') || {} }`;
        const errorPropStr = errorsId ? `Object.assign(${indexConfigStr}, { errorComponent: getOptExport(${errorsId}, 'UnknownError') || getOptExport(${errorsId}, 'UnknowError') || getOptExport(${errorsId}, 'default') })` : indexConfigStr;

        let componentBody = `<RouteWrapper layouts={${layoutsArrayStr}} index={${errorPropStr}} props={props} />`;

        flattenedRoutes.push(`
  {
    path: '${node.path}',
    component: (props) => ${componentBody}
  }`);

        const finalMeta = { ...currentMeta };
        if (finalMeta.titleTemplate && finalMeta.title && finalMeta.title !== finalMeta.titleDefault) {
          finalMeta.title = finalMeta.titleTemplate.replace('%s', finalMeta.title);
        } else if (finalMeta.titleDefault && !finalMeta.title) {
          finalMeta.title = finalMeta.titleDefault;
        }

        ssgRoutes.push({
          path: node.path,
          meta: Object.keys(finalMeta).length > 0 ? finalMeta : {}
        });
      }

      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          traverse(child, currentLayouts, currentMeta);
        }
      }
    };

    if (routeNode) {
      traverse(routeNode);
    }

    if (errorsPath) {
      const layoutsArrayStr = `[${rootLayouts.map(l => `{ default: getOptExport(${l.id}, 'default'), isAsync: ${l.isAsync}, Metatags: getOptExport(${l.id}, 'Metatags') || getOptExport(${l.id}, 'frontmatter') || {} }`).join(', ')}]`;
      flattenedRoutes.push(`
  {
    path: '*',
    NotFound: (props) => <RouteWrapper layouts={${layoutsArrayStr}} index={{ default: getOptExport(${errorsId}, 'NotFound') || getOptExport(${errorsId}, 'default'), isAsync: false, Metatags: getOptExport(${errorsId}, 'Metatags') || getOptExport(${errorsId}, 'frontmatter') || {} }} props={props} />,
    ErrorBuild: (props) => <RouteWrapper layouts={${layoutsArrayStr}} index={{ default: getOptExport(${errorsId}, 'ErrorBuild') || getOptExport(${errorsId}, 'default'), isAsync: false, Metatags: getOptExport(${errorsId}, 'Metatags') || getOptExport(${errorsId}, 'frontmatter') || {} }} props={props} />
  }`);
    }

    const fileContent = `/* AUTO-GENERATED APP ROUTER */
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
        if (ErrorFallback) {
          if (active) setContent(<ErrorFallback error={err} />);
        } else {
          if (active) setContent(<div style={{ padding: '2rem', color: 'red' }}>Error rendering async component</div>);
        }
      }
    };
    run();
    return () => { active = false; };
  }, []); // Only run once on mount

  return content;
};

const SyncComponentRenderer = ({ Component, componentProps, ErrorFallback }) => {
  try {
    const res = Component(componentProps);
    return <Ryunix.Fragment>{res}</Ryunix.Fragment>;
  } catch(err) {
    console.error('Error rendering sync component:', err);
    if (ErrorFallback) {
      return <ErrorFallback error={err} />;
    }
    return <div style={{ padding: '2rem', color: 'red' }}>Error rendering component</div>;
  }
};

const RouteWrapper = ({ layouts, index, props }) => {
  const staticMeta = {};
  
  const mergeMeta = (target, source) => {
    if (!source) return;
    Object.keys(source).forEach(key => {
      if (key === 'title') {
        if (typeof source.title === 'object') {
          target.titleTemplate = source.title.template || target.titleTemplate;
          target.titleDefault = source.title.default || target.titleDefault;
          target.title = source.title.default || target.title;
        } else {
          target.title = source.title;
        }
      } else {
        target[key] = source[key];
      }
    });
  };

  layouts.forEach(l => { if (l && l.Metatags) mergeMeta(staticMeta, l.Metatags); });
  if (index && index.Metatags) mergeMeta(staticMeta, index.Metatags);

  const formatMeta = (metaObj) => {
    const formattedMeta = { ...metaObj };
    if (metaObj.titleTemplate && metaObj.title) {
       formattedMeta.title = metaObj.titleTemplate.replace('%s', metaObj.title);
    } else if (metaObj.titleDefault && !metaObj.title) {
       formattedMeta.title = metaObj.titleDefault;
    }
    return formattedMeta;
  };

  const [currentMeta, setCurrentMeta] = useStore(formatMeta(staticMeta));

  // Ensure parameter proxies are available for both synchronous and asynchronous contexts
  const promiseProps = (obj) => {
    const promise = Promise.resolve(obj);
    return new Proxy(promise, {
      get(target, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return target[prop].bind(target);
        }
        return obj[prop];
      }
    });
  };

  const asyncParams = promiseProps(props.params || {});
  const asyncQuery = promiseProps(props.query || {});

  useEffect(() => {
    let active = true;
    const loadMeta = async () => {
      // Defer execution to cleanly escape the Ryunix commitWork synchronous phase
      await Promise.resolve();
      
      let resolvedMeta = { ...staticMeta };
      
      for (const layout of layouts) {
        if (layout?.DynamicMetadata) {
          try {
            const res = await layout.DynamicMetadata({ params: asyncParams, searchParams: asyncQuery }, resolvedMeta);
            mergeMeta(resolvedMeta, res);
            if (active) setCurrentMeta(formatMeta(resolvedMeta));
          } catch (e) {
            console.error('Error in layout DynamicMetadata:', e);
          }
        }
      }
      
      if (index?.DynamicMetadata) {
        try {
          const res = await index.DynamicMetadata({ params: asyncParams, searchParams: asyncQuery }, resolvedMeta);
          mergeMeta(resolvedMeta, res);
          if (active) setCurrentMeta(formatMeta(resolvedMeta));
        } catch (e) {
          console.error('Error in index DynamicMetadata:', e);
        }
      }
    };
    
    loadMeta();
    return () => { active = false; };
  }, [JSON.stringify(props.params), JSON.stringify(props.query)]);

  useMetadata(currentMeta);

  const ErrorFallback = index?.errorComponent;

  // Build root content synchronously so Ryunix Fiber can track hooks for synchronous components
  let content = null;
  if (index?.default) {
    const IndexComp = index.default;
    const isAsync = index.isAsync || (IndexComp.constructor.name === 'AsyncFunction' || IndexComp[Symbol.toStringTag] === 'AsyncFunction');
    
    if (isAsync) {
      content = <AsyncComponentRenderer Component={IndexComp} componentProps={{ ...props, params: asyncParams, searchParams: asyncQuery }} ErrorFallback={ErrorFallback} />;
    } else {
      content = <SyncComponentRenderer Component={IndexComp} componentProps={{ ...props, params: asyncParams, searchParams: asyncQuery }} ErrorFallback={ErrorFallback} />;
    }
  }

  // Wrap with Layouts
  for (let i = layouts.length - 1; i >= 0; i--) {
    const LayoutComp = layouts[i]?.default;
    const isAsync = layouts[i]?.isAsync || (LayoutComp && (LayoutComp.constructor.name === 'AsyncFunction' || LayoutComp[Symbol.toStringTag] === 'AsyncFunction'));
    
    if (LayoutComp) {
      if (isAsync) {
        content = <AsyncComponentRenderer Component={LayoutComp} componentProps={{ ...props, params: asyncParams, searchParams: asyncQuery, children: content }} ErrorFallback={ErrorFallback} />;
      } else {
        content = <SyncComponentRenderer Component={LayoutComp} componentProps={{ ...props, params: asyncParams, searchParams: asyncQuery, children: content }} ErrorFallback={ErrorFallback} />;
      }
    }
  }

  // Handle fallback if it's an error boundary route (optional, Ryunix handles its own suspense/errors generally)
  return content;
};

const routes = [${flattenedRoutes.join(',\n')}
];

export default function AppRouter() {
  return (
    <RouterProvider routes={routes}>
      <Children />
    </RouterProvider>
  );
}
`;

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Only write if the content actually changed to avoid Webpack infinite loops
    let shouldWrite = true;
    if (fs.existsSync(outputPath)) {
      const existingContent = fs.readFileSync(outputPath, 'utf8');
      if (existingContent === fileContent) {
        shouldWrite = false;
      }
    }

    if (shouldWrite) {
      if (this.debug) console.log(`[AppRouter] Generating routes at ${outputPath}`);
      fs.writeFileSync(outputPath, fileContent);
    }

    const mainEntryPath = path.join(path.dirname(outputPath), 'main.ryx');
    const mainEntryContent = `import Ryunix from '@unsetsoft/ryunixjs';
import AppRouter from './${path.basename(outputPath)}';
 
Ryunix.init(<AppRouter />);
`;
    let shouldWriteMain = true;
    if (fs.existsSync(mainEntryPath)) {
      const existingMainContent = fs.readFileSync(mainEntryPath, 'utf8');
      if (existingMainContent === mainEntryContent) {
        shouldWriteMain = false;
      }
    }
    if (shouldWriteMain) {
      fs.writeFileSync(mainEntryPath, mainEntryContent);
      if (this.debug) console.log(`[AppRouter] Generating main entry at ${mainEntryPath}`);
    }

    // Server Entry for SSG/SSR
    const serverEntryPath = path.join(path.dirname(outputPath), 'app-router-server.js');
    const serverEntryContent = `import AppRouter from './${path.basename(outputPath)}';
export const ssgRoutes = ${JSON.stringify(ssgRoutes, null, 2)};
export default AppRouter;
`;
    let shouldWriteServer = true;
    if (fs.existsSync(serverEntryPath)) {
      const existingServerContent = fs.readFileSync(serverEntryPath, 'utf8');
      if (existingServerContent === serverEntryContent) {
        shouldWriteServer = false;
      }
    }
    if (shouldWriteServer) {
      fs.writeFileSync(serverEntryPath, serverEntryContent);
      if (this.debug) console.log(`[AppRouter] Generating server entry at ${serverEntryPath}`);
    }

    // SSG Output
    const ssgManifestPath = path.join(path.dirname(outputPath), 'ssg', 'routes.json');
    const ssgManifestContent = JSON.stringify(ssgRoutes, null, 2);

    let shouldWriteSsg = true;
    if (fs.existsSync(ssgManifestPath)) {
      const existingSsgContent = fs.readFileSync(ssgManifestPath, 'utf8');
      if (existingSsgContent === ssgManifestContent) {
        shouldWriteSsg = false;
      }
    }

    if (shouldWriteSsg) {
      fs.mkdirSync(path.dirname(ssgManifestPath), { recursive: true });
      if (this.debug) console.log(`[AppRouter] Generating SSG manifest at ${ssgManifestPath}`);
      fs.writeFileSync(ssgManifestPath, ssgManifestContent);
    }
  }

  getRelativeImport(targetPath, outputPath) {
    const relativePath = path.relative(path.dirname(outputPath), targetPath).replace(/\\/g, '/');
    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
  }
}

export default AppRouterPlugin;
