/**
 * SSG Utilities - Improved static site generation
 */
import fs from 'fs'
import path from 'path'

/**
 * Extract routes from routes config for SSG
 */
const extractSSGRoutes = (routes) => {
  const ssgRoutes = []

  const processRoute = (route, parentPath = '') => {
    if (!route.path || route.path.includes(':')) return // Skip dynamic routes
    if (route.NotFound || route.noRenderLink) return // Skip special routes

    const fullPath = parentPath + route.path

    ssgRoutes.push({
      path: fullPath === '' ? '/' : fullPath,
      component: route.component,
      meta: route.meta || {},
      sitemap: route.sitemap || {},
      label: route.label,
    })

    // Process nested routes
    if (route.subRoutes) {
      route.subRoutes.forEach((subRoute) => {
        processRoute(subRoute, fullPath)
      })
    }
  }

  routes.forEach((route) => processRoute(route))
  return ssgRoutes
}

/**
 * Generate robots.txt
 */
const generateRobotsTxt = (baseURL, options = {}) => {
  const { disallow = [], allow = [], userAgents = ['*'] } = options

  let content = ''

  userAgents.forEach((agent) => {
    content += `User-agent: ${agent}\n`
    allow.forEach((path) => (content += `Allow: ${path}\n`))
    disallow.forEach((path) => (content += `Disallow: ${path}\n`))
  })

  content += `\nSitemap: ${baseURL}/sitemap.xml\n`

  return content
}

/**
 * Generate enhanced sitemap with all routes
 */
const generateSitemap = (routes, baseURL, defaultSettings = {}) => {
  const { changefreq = 'weekly', priority = '0.7' } = defaultSettings

  const urls = routes
    .map((route) => {
      const url = `${baseURL}${route.path === '/' ? '' : route.path}`
      const meta = route.meta || {}
      const sitemap = route.sitemap || {}

      const lastmod =
        meta.lastmod ||
        sitemap.lastmod ||
        new Date().toISOString().split('T')[0]
      const freq = sitemap.changefreq || meta.changefreq || changefreq
      const prio = sitemap.priority || meta.priority || priority

      return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

/**
 * Generate meta tags HTML
 */
const generateMetaTags = (meta, defaultMeta = {}) => {
  const tags = { ...defaultMeta, ...meta }
  let html = ''

  Object.entries(tags).forEach(([key, value]) => {
    if (['title', 'canonical'].includes(key)) return

    const isProperty = key.startsWith('og:') || key.startsWith('twitter:')
    const attr = isProperty ? 'property' : 'name'
    html += `    <meta ${attr}="${key}" content="${value}">\n`
  })

  return html
}

/**
 * Prerender route to HTML
 */
const prerenderRoute = async (route, template, config) => {
  const meta = route.meta || config.static.seo.meta
  let html = template

  // Replace title
  if (meta.title) {
    html = html.replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
  }

  // Add/replace meta tags
  const metaTags = generateMetaTags(meta, config.static.seo.meta)

  // Remove existing meta tags (except framework/mode)
  html = html.replace(/<meta name="(?!framework|mode).*?>\n/g, '')
  html = html.replace(/<meta property=.*?>\n/g, '')

  // Add new meta tags before </head>
  html = html.replace(/<\/head>/, `${metaTags}  </head>`)

  // Add canonical if provided
  if (meta.canonical) {
    const canonical = `    <link rel="canonical" href="${meta.canonical}">\n`
    html = html.replace(/<\/head>/, `${canonical}  </head>`)
  }

  return html
}

/**
 * Full SSG build process
 */
const buildSSG = async (routesConfig, config, buildDir) => {
  const routes = extractSSGRoutes(routesConfig)

  // Template is in buildDir/static/index.html
  const templatePath = path.join(buildDir, 'static', 'index.html')

  if (!fs.existsSync(templatePath)) {
    console.error('❌ Template not found at:', templatePath)
    return
  }

  const template = fs.readFileSync(templatePath, 'utf-8')
  const prerenderRoutes = []
  for (const route of routes) {
    const html = await prerenderRoute(route, template, config)

    const outputDir =
      route.path === '/'
        ? path.join(buildDir, 'static')
        : path.join(buildDir, 'static', route.path)

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(path.join(outputDir, 'index.html'), html)
    prerenderRoutes.push(route.path)
  }

  console.log(`✅ Prerendered ${prerenderRoutes.length} routes:`)
  prerenderRoutes.forEach((r) => console.log(` - ${r}`))

  // Generate sitemap in static/
  if (config.experimental?.ssg?.sitemap?.enable) {
    const baseURL = config.experimental.ssg.sitemap.baseURL
    const sitemap = generateSitemap(
      routes,
      baseURL,
      config.experimental.ssg.sitemap.settings,
    )
    fs.writeFileSync(path.join(buildDir, 'static', 'sitemap.xml'), sitemap)
    console.log('✅ Sitemap created')

    const robots = generateRobotsTxt(baseURL, config.experimental?.ssg?.robots)
    fs.writeFileSync(path.join(buildDir, 'static', 'robots.txt'), robots)
    console.log('✅ Robots.txt created')
  }
}

export {
  extractSSGRoutes,
  generateSitemap,
  generateRobotsTxt,
  generateMetaTags,
  prerenderRoute,
  buildSSG,
}
