import fs from 'fs'
import path from 'path'

export type RouteMetadataKind =
  | 'favicon'
  | 'icon'
  | 'apple-icon'
  | 'opengraph-image'
  | 'twitter-image'
  | 'opengraph-image-alt'
  | 'twitter-image-alt'

export interface RouteMetadataAsset {
  kind: RouteMetadataKind
  filename: string
  sourcePath: string
  publicPath: string
}

const ICON_EXTENSIONS = new Set(['.ico', '.jpg', '.jpeg', '.png', '.svg'])
const APPLE_ICON_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png'])
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])

const METADATA_FILE_RULES: Array<{
  kind: RouteMetadataKind
  basename: string
  extensions: Set<string> | null
}> = [
  { kind: 'favicon', basename: 'favicon', extensions: new Set(['.ico']) },
  { kind: 'icon', basename: 'icon', extensions: ICON_EXTENSIONS },
  {
    kind: 'apple-icon',
    basename: 'apple-icon',
    extensions: APPLE_ICON_EXTENSIONS,
  },
  {
    kind: 'opengraph-image',
    basename: 'opengraph-image',
    extensions: IMAGE_EXTENSIONS,
  },
  {
    kind: 'twitter-image',
    basename: 'twitter-image',
    extensions: IMAGE_EXTENSIONS,
  },
]

export const parseRouteMetadataFile = (
  filename: string,
): { kind: RouteMetadataKind; filename: string } | null => {
  if (filename === 'opengraph-image.alt.txt') {
    return { kind: 'opengraph-image-alt', filename }
  }
  if (filename === 'twitter-image.alt.txt') {
    return { kind: 'twitter-image-alt', filename }
  }

  const ext = path.extname(filename).toLowerCase()
  const base = path.basename(filename, ext)

  for (const rule of METADATA_FILE_RULES) {
    if (base !== rule.basename) continue
    if (rule.extensions && !rule.extensions.has(ext)) continue
    return { kind: rule.kind, filename }
  }

  return null
}

export const buildMetadataPublicPath = (
  routePath: string,
  filename: string,
): string => {
  const normalizedRoute =
    routePath === '/'
      ? ''
      : `/${routePath.replace(/^\/+/, '').replace(/\/+$/, '')}`
  return `${normalizedRoute}/${filename}`.replace(/\/+/g, '/')
}

export const scanSegmentMetadataFiles = (
  dir: string,
  routePath: string,
): RouteMetadataAsset[] => {
  if (!fs.existsSync(dir)) return []

  const assets: RouteMetadataAsset[] = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    const parsed = parseRouteMetadataFile(entry.name)
    if (!parsed) continue

    assets.push({
      kind: parsed.kind,
      filename: parsed.filename,
      sourcePath: path.join(dir, entry.name),
      publicPath: buildMetadataPublicPath(routePath, parsed.filename),
    })
  }

  return assets
}

export const mergeMetadataAssets = (
  parentAssets: RouteMetadataAsset[],
  segmentAssets: RouteMetadataAsset[],
): RouteMetadataAsset[] => {
  const merged = new Map<RouteMetadataKind, RouteMetadataAsset>()

  for (const asset of parentAssets) {
    merged.set(asset.kind, asset)
  }
  for (const asset of segmentAssets) {
    merged.set(asset.kind, asset)
  }

  return Array.from(merged.values())
}

const readAltText = (sourcePath: string): string | undefined => {
  try {
    const value = fs.readFileSync(sourcePath, 'utf8').trim()
    return value || undefined
  } catch {
    return undefined
  }
}

export const metadataAssetsToMeta = (
  assets: RouteMetadataAsset[],
  baseURL = '',
): Record<string, unknown> => {
  const meta: Record<string, unknown> = {}
  const prefix = baseURL.replace(/\/+$/, '')

  for (const asset of assets) {
    if (asset.kind.endsWith('-alt')) {
      const alt = readAltText(asset.sourcePath)
      if (!alt) continue
      if (asset.kind === 'opengraph-image-alt') {
        meta['og:image:alt'] = alt
      } else if (asset.kind === 'twitter-image-alt') {
        meta['twitter:image:alt'] = alt
      }
      continue
    }

    const url = `${prefix}${asset.publicPath}`
    switch (asset.kind) {
      case 'favicon':
      case 'icon':
        meta.icon = url
        break
      case 'apple-icon':
        meta.appleTouchIcon = url
        break
      case 'opengraph-image':
        meta['og:image'] = url
        break
      case 'twitter-image':
        meta['twitter:image'] = url
        break
      default:
        break
    }
  }

  return meta
}

export const copyRouteMetadataAssets = (
  assets: RouteMetadataAsset[],
  staticRoot: string,
): void => {
  for (const asset of assets) {
    const destination = path.join(
      staticRoot,
      asset.publicPath.replace(/^\//, ''),
    )
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(asset.sourcePath, destination)
  }
}

export interface RouteMetadataAssetManifest {
  kind: RouteMetadataKind
  filename: string
  sourcePath: string
  publicPath: string
}

export const toMetadataAssetManifest = (
  assets: RouteMetadataAsset[],
): RouteMetadataAssetManifest[] =>
  assets.map(({ kind, filename, sourcePath, publicPath }) => ({
    kind,
    filename,
    sourcePath,
    publicPath,
  }))

export const fromMetadataAssetManifest = (
  manifest: RouteMetadataAssetManifest[],
): RouteMetadataAsset[] => manifest.map((entry) => ({ ...entry }))
