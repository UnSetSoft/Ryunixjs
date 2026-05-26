'use strict'

const fs = require('fs')
const path = require('path')
const createJiti = require('jiti')

const configCandidates = [
  path.join(process.cwd(), 'ryunix.config.ts'),
  path.join(process.cwd(), 'ryunix.config.mts'),
  path.join(process.cwd(), 'ryunix.config.js'),
  path.join(process.cwd(), 'ryunix.config.cjs'),
]

const jiti = createJiti(__filename, { interopDefault: true })

const isTypeScriptConfig = (filePath) =>
  filePath.endsWith('.ts') || filePath.endsWith('.mts')

const getConfigPath = () =>
  configCandidates.find((candidate) => fs.existsSync(candidate)) || null

const configFileExist = () => {
  return Boolean(getConfigPath())
}

const normalizeLoadedConfig = (raw) => {
  if (raw && typeof raw === 'object' && 'default' in raw) {
    return raw.default
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

    return normalizeLoadedConfig(require(selectedConfigPath))
  } catch (error) {
    const detail =
      error && typeof error === 'object' && 'message' in error
        ? error.message
        : String(error)
    console.error(
      `[Ryunix Config] Could not load ${selectedConfigPath}: ${detail}`,
    )
    throw error
  }
}

module.exports = {
  getConfig,
  configFileExist,
}
