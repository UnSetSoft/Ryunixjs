'use strict'

const styleConfig = require('./styleConfig.js')

module.exports = {
  normalizeStyleConfig: styleConfig.normalizeStyleConfig,
  buildStyleVarsCss: styleConfig.buildStyleVarsCss,
  buildFontHeadLinks: styleConfig.buildFontHeadLinks,
  DEFAULT_STYLE: styleConfig.DEFAULT_STYLE,
}
