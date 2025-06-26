/**
 * prerender metadata
 *
 */
import { configFileExist } from '../utils/settingfile.cjs'
import defaultSettings from '../utils/config.cjs'
import { resolveApp } from '../utils/index.mjs'
import fs from 'fs'
import path from 'path'

// proyect/.ryunix/static
const buildDirectory = resolveApp(process.cwd(), '.ryunix/static')
const indexFile = path.join(buildDirectory, 'index.html')

const siteMap = async (routes) => {
  if (!defaultSettings.experimental.ssg.baseURL) {
    console.error(
      '❌ Base URL is not defined in the configuration file. Please set `experimental.ssg.baseURL`.',
    )
    process.exit(1)
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((route) => {
    const url = `${defaultSettings.experimental.ssg.baseURL}${route.path === '/' ? '' : route.path}`
    return `<url><loc>${url}</loc></url>`
  })
  .join('\n')}
</urlset>`

  await fs.writeFileSync(
    path.resolve(buildDirectory, 'sitemap.xml'),
    sitemap,
    'utf-8',
  )

  console.log('✅ Sitemap created')
}

const Prerender = async () => {
  if (!configFileExist()) {
    console.error('❌ No configuration file found.')
    process.exit(1)
  }

  const template = fs.readFileSync(indexFile, 'utf-8')

  for (const route of defaultSettings.experimental.ssg.prerender) {
    if (route.path === '/') continue // Exclude root path, handled by defaultSettings.static.seo.meta
    let html = template
    const meta = route?.meta || defaultSettings.static.seo.meta

    // title
    if (meta.title) {
      html = html.replace(/<title>.*<\/title>/, `<title>${meta.title}</title>`)
    }

    // Helper to add or replace metatag
    function upsertMetaTag(html, name, value) {
      if (value === undefined || value === null) return html

      const isProperty = name.startsWith('og:') || name.startsWith('twitter:')
      const attr = isProperty ? 'property' : 'name'
      const regex = new RegExp(
        `<meta ${attr}=["']${name}["'] content=".*?"\\s*\/?>`,
        'i',
      )
      const tag = `<meta ${attr}="${name}" content="${value}">`

      if (regex.test(html)) {
        return html.replace(regex, tag)
      } else {
        return html.replace(/<\/head>/i, `${tag}\n</head>`)
      }
    }

    // Description
    html = upsertMetaTag(html, 'description', meta.description)
    // Keywords
    html = upsertMetaTag(html, 'keywords', meta.keywords)

    // dynamic metatags (excluding title, description, keywords, framework, mode)
    for (const [key, value] of Object.entries(meta)) {
      if (
        [
          'title',
          'description',
          'keywords',
          'framework',
          'mode',
          'viewport',
        ].includes(key)
      )
        continue
      html = upsertMetaTag(html, key, value)
    }

    const outputDir =
      route.path === '/'
        ? buildDirectory
        : path.join(buildDirectory, route.path)

    if (!fs.existsSync(outputDir)) {
      await fs.mkdirSync(outputDir, { recursive: true, force: true })
    }

    await fs.writeFileSync(path.join(outputDir, 'index.html'), html)
    console.log(`✅ Prerendered ${route.path}`)
  }
  if (defaultSettings.experimental.ssg.sitemap) {
    await siteMap(defaultSettings.experimental.ssg.prerender)
  }
}

export default Prerender
