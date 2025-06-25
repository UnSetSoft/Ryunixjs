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
      const regex = new RegExp(
        `<meta name=["']${name}["'] content=".*?"\\s*\/?>`,
        'i',
      )
      const tag = `<meta name="${name}" content="${value}">`
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
}

export default Prerender
