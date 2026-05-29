import type {
  RyunixStyleConfig,
  RyunixStyleFontInput,
  RyunixStyleResolvedConfig,
} from '../config.d.ts'
import {
  FONT_PRESETS,
  normalizeFontConfig,
  buildFontHeadLinks,
} from './styleFonts.js'

export const DEFAULT_STYLE: RyunixStyleResolvedConfig = {
  enabled: false,
  padding: '1.5rem',
  maxWidth: '72rem',
  font: FONT_PRESETS.system,
}

export function normalizeStyleConfig(
  raw: boolean | RyunixStyleConfig | undefined | null,
): RyunixStyleResolvedConfig {
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

  let padding: string | null = DEFAULT_STYLE.padding
  if (raw.padding === false) padding = null
  else if (typeof raw.padding === 'string') padding = raw.padding

  let maxWidth: string | null = DEFAULT_STYLE.maxWidth
  if (raw.maxWidth === false) maxWidth = null
  else if (typeof raw.maxWidth === 'string') maxWidth = raw.maxWidth

  return {
    enabled,
    padding,
    maxWidth,
    font: normalizeFontConfig(raw.font as RyunixStyleFontInput | undefined),
  }
}

export function buildStyleVarsCss(style: RyunixStyleResolvedConfig): string {
  if (!style?.enabled) return ''

  const vars: string[] = []
  if (style.padding) vars.push(`--ryx-page-padding:${style.padding}`)
  if (style.maxWidth) vars.push(`--ryx-content-max-width:${style.maxWidth}`)
  if (style.font?.sans) vars.push(`--ryx-font-sans:${style.font.sans}`)
  if (style.font?.tracking) vars.push(`--ryx-tracking:${style.font.tracking}`)

  const parts: string[] = []
  if (style.font?.fontFace) parts.push(style.font.fontFace)
  if (vars.length) parts.push(`:root{${vars.join(';')}}`)
  return parts.join('')
}

export { buildFontHeadLinks }
