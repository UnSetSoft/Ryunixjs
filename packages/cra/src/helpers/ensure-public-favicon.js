const fs = require('fs')
const path = require('path')

/** 1×1 PNG — satisfies HtmlWebpackPlugin default favicon path */
const MINIMAL_FAVICON_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAD0lEQVQ42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

function ensurePublicFavicon(appRoot) {
  const faviconPath = path.join(appRoot, 'public', 'favicon.png')
  if (fs.existsSync(faviconPath)) return
  fs.mkdirSync(path.dirname(faviconPath), { recursive: true })
  fs.writeFileSync(faviconPath, MINIMAL_FAVICON_PNG)
}

module.exports = { ensurePublicFavicon }
