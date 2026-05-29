'use strict'

const styleFonts = require('./styleFonts.js')

module.exports = {
  FONT_PRESETS: styleFonts.FONT_PRESETS,
  SYSTEM_SANS: styleFonts.SYSTEM_SANS,
  normalizeFontConfig: styleFonts.normalizeFontConfig,
  buildFontHeadLinks: styleFonts.buildFontHeadLinks,
  buildFontCss: styleFonts.buildFontCss,
}
