import { is } from '../../utils/index.js'

const INTERNAL_META_KEYS = new Set([
  'title',
  'pageTitle',
  'canonical',
  'titleTemplate',
  'titleDefault',
  'lastmod',
  'changefreq',
  'priority',
  'custom',
  'icon',
  'appleTouchIcon',
])

type TitleConfig = {
  default?: string
  template?: string
}

const isTitleConfig = (value: unknown): value is TitleConfig =>
  is.object(value) &&
  value !== null &&
  ('default' in value || 'template' in value)

const pickString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

/**
 * Normalize App Router metadata (Metatags / generateMetadata) into a document title
 * and flat string tags suitable for <title> and <meta> injection.
 *
 * Supports Next-style `title: { default, template }` plus legacy `titleTemplate`.
 */
export function resolvePageMetadata(
  meta: Record<string, unknown> = {},
  options: { title?: { template?: string; prefix?: string } } = {},
): { title: string; tags: Record<string, string | string[]> } {
  const template =
    pickString(options.title?.template) ||
    pickString(meta.titleTemplate) ||
    (isTitleConfig(meta.title) ? pickString(meta.title.template) : undefined)

  const defaultTitle =
    pickString(options.title?.prefix) ||
    pickString(meta.titleDefault) ||
    (isTitleConfig(meta.title) ? pickString(meta.title.default) : undefined) ||
    'Ryunix App'

  const pageTitle =
    pickString(meta.pageTitle) ||
    (typeof meta.title === 'string' ? pickString(meta.title) : undefined)

  let title = defaultTitle
  if (pageTitle) {
    title =
      template && template.includes('%s')
        ? template.replace('%s', pageTitle)
        : pageTitle
  }

  const tags: Record<string, string | string[]> = {}

  for (const [key, value] of Object.entries(meta)) {
    if (INTERNAL_META_KEYS.has(key)) continue
    if (key === 'title' && isTitleConfig(value)) continue

    if (Array.isArray(value)) {
      const items = value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
      if (items.length > 0) tags[key] = items
      continue
    }

    if (typeof value === 'string' && value.trim()) {
      tags[key] = value.trim()
    }
  }

  if (pickString(meta.canonical)) {
    tags.canonical = meta.canonical as string
  }

  if (pickString(meta.icon)) {
    tags.icon = meta.icon as string
  }

  if (pickString(meta.appleTouchIcon)) {
    tags.appleTouchIcon = meta.appleTouchIcon as string
  }

  return { title, tags }
}

/**
 * Deep-enough merge for layout → page metadata.
 * Preserves `title.template` / `title.default` when a child overrides `title` with a string.
 */
export function mergeRouteMetadata(
  base: Record<string, unknown> = {},
  next: Record<string, unknown> = {},
): Record<string, unknown> {
  const merged = { ...base, ...next }

  if (typeof next.title === 'string' && isTitleConfig(base.title)) {
    if (!pickString(merged.titleTemplate) && pickString(base.title.template)) {
      merged.titleTemplate = base.title.template
    }
    if (!pickString(merged.titleDefault) && pickString(base.title.default)) {
      merged.titleDefault = base.title.default
    }
  }

  return merged
}

export { INTERNAL_META_KEYS }
