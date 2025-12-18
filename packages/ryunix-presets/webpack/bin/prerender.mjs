/**
 * Automatic Prerender - reads routes from manifest
 */
import { buildSSG } from '../utils/ssg.mjs'
import { configFileExist } from '../utils/settingfile.cjs'
import defaultSettings from '../utils/config.cjs'
import { resolveApp } from '../utils/index.mjs'
import fs from 'fs'
import path from 'path'

const Prerender = async (directory) => {
  const buildDirectory = resolveApp(process.cwd(), directory)

  if (!configFileExist()) {
    console.error('❌ No configuration file found.')
    process.exit(1)
  }

  const manifestPath = path.join(process.cwd(), directory, 'ssg', 'routes.json')
  let routes = []

  if (fs.existsSync(manifestPath)) {
    try {
      routes = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    } catch (error) {
      console.error('[SSG] Error reading routes manifest:', error)
    }
  }

  const metaExist = routes.some((route) => route.meta)
  if (metaExist && defaultSettings.static.seo.meta.length > 0) {

    console.error("[Ryunix Error] You are mixing static and dynamic meta tags; you can only use one of the two. Remove static.seo.meta from ryunix.config.js.")
    process.exit(1)

  }

  if (routes.length === 0) {
    routes = defaultSettings.experimental?.ssg?.prerender || []
    if (routes.length > 0) {
      console.log(`[SSG] Using ${routes.length} routes from config`)
    }
  }

  if (routes.length === 0) {
    console.log('[SSG] No routes to prerender, skipping SSG generation.')
    return
  }

  await buildSSG(routes, defaultSettings, buildDirectory)
  console.log('✅ SSG build complete')
}

export default Prerender
