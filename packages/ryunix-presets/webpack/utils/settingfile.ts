import fs from 'node:fs'
import path from 'node:path'
import createJiti from 'jiti'

const configCandidates = [
  path.join(process.cwd(), 'ryunix.config.ts'),
  path.join(process.cwd(), 'ryunix.config.mts'),
  path.join(process.cwd(), 'ryunix.config.js'),
  path.join(process.cwd(), 'ryunix.config.cjs'),
]

const jiti = createJiti(import.meta.url, { interopDefault: true })

const isTypeScriptConfig = (filePath: string) =>
  filePath.endsWith('.ts') || filePath.endsWith('.mts')

const getConfigPath = () =>
  configCandidates.find((candidate) => fs.existsSync(candidate)) || null

const configFileExist = () => {
  return Boolean(getConfigPath())
}

const normalizeLoadedConfig = (raw: unknown) => {
  if (raw && typeof raw === 'object' && 'default' in raw) {
    return (raw as { default: unknown }).default
  }
  return raw
}

const getConfig = () => {
  const selectedConfigPath = getConfigPath()
  if (!selectedConfigPath) {
    return {}
  }

  try {
    if (isTypeScriptConfig(selectedConfigPath)) {
      return normalizeLoadedConfig(jiti(selectedConfigPath))
    }

    return normalizeLoadedConfig(jiti(selectedConfigPath))
  } catch (error) {
    const detail =
      error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    console.error(
      `[Ryunix Config] Could not load ${selectedConfigPath}: ${detail}`,
    )
    throw error
  }
}

export { getConfig, configFileExist }
