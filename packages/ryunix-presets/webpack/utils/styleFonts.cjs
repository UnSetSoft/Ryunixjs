'use strict'

/** @typedef {import('../config.d.ts').RyunixStyleFontInput} RyunixStyleFontInput */
/** @typedef {import('../config.d.ts').RyunixStyleFontResolved} RyunixStyleFontResolved */

const SYSTEM_SANS =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

/** Curated presets — loaded from fonts.bunny.net (privacy-friendly CDN, no Google tracking). */
const FONT_PRESETS = {
  system: {
    id: 'system',
    family: null,
    links: [],
    sans: SYSTEM_SANS,
    tracking: '0.012em',
    fontFace: '',
  },
  inter: {
    id: 'inter',
    family: 'Inter',
    links: [
      '<link rel="preconnect" href="https://fonts.bunny.net" crossorigin>',
      '<link rel="stylesheet" href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap">',
    ],
    sans: `'Inter', ${SYSTEM_SANS}`,
    tracking: '0.011em',
    fontFace: '',
  },
  'source-sans': {
    id: 'source-sans',
    family: 'Source Sans 3',
    links: [
      '<link rel="preconnect" href="https://fonts.bunny.net" crossorigin>',
      '<link rel="stylesheet" href="https://fonts.bunny.net/css?family=source-sans-3:400,500,600,700&display=swap">',
    ],
    sans: `'Source Sans 3', ${SYSTEM_SANS}`,
    tracking: '0.012em',
    fontFace: '',
  },
  nunito: {
    id: 'nunito',
    family: 'Nunito Sans',
    links: [
      '<link rel="preconnect" href="https://fonts.bunny.net" crossorigin>',
      '<link rel="stylesheet" href="https://fonts.bunny.net/css?family=nunito-sans:400,500,600,700&display=swap">',
    ],
    sans: `'Nunito Sans', ${SYSTEM_SANS}`,
    tracking: '0.015em',
    fontFace: '',
  },
}

/**
 * @param {RyunixStyleFontInput | undefined} raw
 * @returns {RyunixStyleFontResolved}
 */
function normalizeFontConfig(raw) {
  if (!raw || raw === 'system') {
    return { ...FONT_PRESETS.system }
  }

  if (typeof raw === 'string') {
    if (FONT_PRESETS[raw]) {
      return { ...FONT_PRESETS[raw] }
    }
    return { ...FONT_PRESETS.system }
  }

  if (typeof raw !== 'object') {
    return { ...FONT_PRESETS.system }
  }

  const fallback = raw.fallback || SYSTEM_SANS
  const tracking =
    typeof raw.tracking === 'string'
      ? raw.tracking
      : FONT_PRESETS.system.tracking

  if (typeof raw.google === 'string' && raw.google.trim()) {
    const family =
      raw.family ||
      raw.google.split(':')[0].replace(/\+/g, ' ').trim() ||
      'Custom Font'
    const query = encodeURIComponent(raw.google.trim()).replace(/%20/g, '+')
    return {
      id: 'google',
      family,
      links: [
        '<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${query}&display=swap">`,
      ],
      sans: `'${family}', ${fallback}`,
      tracking,
      fontFace: '',
    }
  }

  if (typeof raw.family === 'string' && raw.family.trim()) {
    const family = raw.family.trim()
    let fontFace = ''

    if (raw.src) {
      const sources = (Array.isArray(raw.src) ? raw.src : [raw.src])
        .filter(Boolean)
        .map((entry) => {
          if (typeof entry === 'string') {
            return `url('${entry}') format('woff2')`
          }
          const url = entry.url || entry.src
          const format = entry.format || 'woff2'
          return url ? `url('${url}') format('${format}')` : null
        })
        .filter(Boolean)

      if (sources.length > 0) {
        const weight = raw.weight != null ? String(raw.weight) : '400 700'
        const style = raw.style === 'italic' ? 'italic' : 'normal'
        fontFace = `@font-face{font-family:'${family}';src:${sources.join(',')};font-display:swap;font-weight:${weight};font-style:${style};}`
      }
    }

    return {
      id: 'custom',
      family,
      links: [],
      sans: `'${family}', ${fallback}`,
      tracking,
      fontFace,
    }
  }

  return { ...FONT_PRESETS.system }
}

/**
 * @param {RyunixStyleFontResolved | undefined} font
 * @returns {string}
 */
function buildFontHeadLinks(font) {
  if (!font?.links?.length) return ''
  return font.links.join('\n    ')
}

/**
 * @param {RyunixStyleFontResolved | undefined} font
 * @returns {string}
 */
function buildFontCss(font) {
  if (!font || font.id === 'system') {
    return `--ryx-font-sans:${SYSTEM_SANS};--ryx-tracking:${FONT_PRESETS.system.tracking}`
  }

  const vars = [
    `--ryx-font-sans:${font.sans}`,
    `--ryx-tracking:${font.tracking}`,
  ]

  return `${font.fontFace || ''}:root{${vars.join(';')}}`
}

module.exports = {
  FONT_PRESETS,
  SYSTEM_SANS,
  normalizeFontConfig,
  buildFontHeadLinks,
  buildFontCss,
}
