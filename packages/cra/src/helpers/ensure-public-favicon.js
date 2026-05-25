'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.ensurePublicFavicon = ensurePublicFavicon
const fs_1 = __importDefault(require('fs'))
const path_1 = __importDefault(require('path'))
/** 1×1 PNG — satisfies HtmlWebpackPlugin default favicon path */
const MINIMAL_FAVICON_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAD0lEQVQ42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)
function ensurePublicFavicon(appRoot) {
  const faviconPath = path_1.default.join(appRoot, 'public', 'favicon.png')
  if (fs_1.default.existsSync(faviconPath)) return
  fs_1.default.mkdirSync(path_1.default.dirname(faviconPath), {
    recursive: true,
  })
  fs_1.default.writeFileSync(faviconPath, MINIMAL_FAVICON_PNG)
}
