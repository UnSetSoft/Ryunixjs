'use strict'

const {
  normalizeFontConfig,
  buildFontHeadLinks,
  FONT_PRESETS,
} = require('./styleFonts.cjs')

const DEFAULT_STYLE = {
  enabled: false,
  padding: '1.5rem',
  maxWidth: '72rem',
  font: FONT_PRESETS.system,
}

/**
 * @param {boolean | import('../config.d.ts').RyunixStyleConfig | undefined | null} raw
 * @returns {typeof DEFAULT_STYLE}
 */
function normalizeStyleConfig(raw) {
  if (raw === false || raw == null) {
    return {
      ...DEFAULT_STYLE,
      enabled: false,
      font: { ...FONT_PRESETS.system },
    }
  }

  if (raw === true) {
    return { ...DEFAULT_STYLE, enabled: true, font: { ...FONT_PRESETS.system } }
  }

  if (typeof raw !== 'object') {
    return {
      ...DEFAULT_STYLE,
      enabled: false,
      font: { ...FONT_PRESETS.system },
    }
  }

  const hasStyleOptions =
    raw.font !== undefined ||
    raw.padding !== undefined ||
    raw.maxWidth !== undefined
  const enabled =
    raw.enabled === true || (raw.enabled !== false && hasStyleOptions)

  let padding = DEFAULT_STYLE.padding
  if (raw.padding === false) padding = null
  else if (typeof raw.padding === 'string') padding = raw.padding

  let maxWidth = DEFAULT_STYLE.maxWidth
  if (raw.maxWidth === false) maxWidth = null
  else if (typeof raw.maxWidth === 'string') maxWidth = raw.maxWidth

  return {
    enabled,
    padding,
    maxWidth,
    font: normalizeFontConfig(raw.font),
  }
}

/**
 * @param {ReturnType<typeof normalizeStyleConfig>} style
 * @returns {string}
 */
function buildStyleVarsCss(style) {
  if (!style?.enabled) return ''

  const vars = []
  if (style.padding) vars.push(`--ryx-page-padding:${style.padding}`)
  if (style.maxWidth) vars.push(`--ryx-content-max-width:${style.maxWidth}`)

  const font = style.font
  if (font?.sans) vars.push(`--ryx-font-sans:${font.sans}`)
  if (font?.tracking) vars.push(`--ryx-tracking:${font.tracking}`)

  const parts = []
  if (font?.fontFace) parts.push(font.fontFace)
  if (vars.length) parts.push(`:root{${vars.join(';')}}`)
  return parts.join('')
}

module.exports = {
  normalizeStyleConfig,
  buildStyleVarsCss,
  buildFontHeadLinks,
  DEFAULT_STYLE,
}
