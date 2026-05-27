// @ts-nocheck
/**
 * Helpers for expanding dynamic App Router paths via generateStaticParams at SSG time.
 */

/**
 * @param {string} template - Route template, e.g. "/:locale/docs/:...path"
 * @param {Record<string, unknown>} params
 * @returns {string}
 */
export function buildPathFromParams(template, params) {
  let path = template

  path = path.replace(/:\.\.\.(\w+)/g, (_, key) => {
    const val = params[key]
    if (val == null || val === '') return ''
    return Array.isArray(val) ? val.join('/') : String(val)
  })

  path = path.replace(/:(\w+)/g, (_, key) => {
    const val = params[key]
    if (val == null || val === '') return ''
    return Array.isArray(val) ? val.join('/') : String(val)
  })

  path = `/${path.replace(/^\/+/, '').replace(/\/+/g, '/')}`

  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1)
  }

  return path || '/'
}

function generateNestedLoops(segments, resolveFn) {
  if (!segments.length) {
    return 'results.push({ path: buildPathFromParams(template, {}), meta });'
  }

  const open = []
  const close = []
  let parentParams = '{}'

  for (let depth = 0; depth < segments.length; depth++) {
    const seg = segments[depth]
    const genExpr = resolveFn(seg.layoutId, seg.indexId)
    const loopVar = `p${depth}`

    open.push(`
  {
    const gen${depth} = ${genExpr};
    if (!gen${depth}) return results;
    const list${depth} = await gen${depth}({ params: ${parentParams} });
    if (!Array.isArray(list${depth}) || list${depth}.length === 0) return results;
    for (const ${loopVar} of list${depth}) {
      const params${depth} = { ...${parentParams}, ...${loopVar} };`)

    close.unshift(`
    }`)
    close.unshift(`
  }`)

    parentParams = `params${depth}`
  }

  return `${open.join('')}
      results.push({ path: buildPathFromParams(template, ${parentParams}), meta });${close.join('')}`
}

/**
 * @param {{ path: string, meta?: object }[]} staticRoutes
 * @param {{ path: string, meta?: object, segments: object[] }[]} dynamicRoutes
 * @returns {string}
 */
export function generateResolveSSGPathsCode(staticRoutes, dynamicRoutes) {
  const staticLiteral = JSON.stringify(
    staticRoutes.map((r) => ({ path: r.path, meta: r.meta || {} })),
    null,
    2,
  )

  const expanders = dynamicRoutes.map((route, index) => {
    const segments = route.segments.map((s) => ({
      param: s.param,
      isCatchAll: !!s.isCatchAll,
      layoutId: s.layoutId || null,
      indexId: s.indexId || null,
    }))

    const fnName = `expandSSG_${index}`
    const resolveFn = (layoutId, indexId) => {
      const parts = []
      if (indexId)
        parts.push(`getOptExport(${indexId}, 'generateStaticParams')`)
      if (layoutId)
        parts.push(`getOptExport(${layoutId}, 'generateStaticParams')`)
      return parts.length ? parts.join(' || ') : 'null'
    }

    const body = generateNestedLoops(segments, resolveFn)

    return `
async function ${fnName}() {
  const results = [];
  const template = ${JSON.stringify(route.path)};
  const meta = ${JSON.stringify(route.meta || {})};
  ${body}
  return results;
}`
  })

  const expanderCalls = dynamicRoutes
    .map((_, index) => `...(await expandSSG_${index}())`)
    .join(',\n    ')

  return `
function buildPathFromParams(template, params) {
  let path = template;
  path = path.replace(/:\\.\\.\\.(\\w+)/g, (_, key) => {
    const val = params[key];
    if (val == null || val === '') return '';
    return Array.isArray(val) ? val.join('/') : String(val);
  });
  path = path.replace(/:(\\w+)/g, (_, key) => {
    const val = params[key];
    if (val == null || val === '') return '';
    return Array.isArray(val) ? val.join('/') : String(val);
  });
  path = '/' + path.replace(/^\\/+/, '').replace(/\\/+/g, '/');
  if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
  return path || '/';
}
${expanders.join('\n')}

export async function resolveSSGPaths() {
  const staticRoutes = ${staticLiteral};
  const expanded = [
    ...staticRoutes,
    ${expanderCalls || ''}
  ];
  return expanded.filter((route, index, all) =>
    route.path && !route.path.includes(':') &&
    all.findIndex((r) => r.path === route.path) === index
  );
}
`
}

/**
 * Parse a dynamic App Router folder name into segment metadata.
 * @param {string} folderName
 */
export function parseDynamicSegment(folderName) {
  const match = folderName.match(/^\[(\.\.\.)?([^\]]+)\]$/)
  if (!match) return null
  return { param: match[2], isCatchAll: !!match[1] }
}
