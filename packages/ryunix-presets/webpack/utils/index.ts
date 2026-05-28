import { createHash } from 'node:crypto'
import { resolve } from 'path'

import { promises as fs } from 'fs'
import logger from 'terminal-log'
import chalk from 'chalk'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'

const resolveApp = (appDirectory: string, relativePath: string): string =>
  resolve(appDirectory, relativePath)

function getPackageManager() {
  const agent = process.env.npm_config_user_agent

  if (!agent) {
    const parent = process.env._

    if (!parent) {
      return 'npm'
    }

    if (parent.endsWith('pnpx') || parent.endsWith('pnpm')) return 'pnpm'
    if (parent.endsWith('bunx') || parent.endsWith('bun')) return 'bun'
    if (parent.endsWith('yarn')) return 'yarn'

    return 'npm'
  }

  const [program] = agent.split('/')

  if (program === 'yarn') return 'yarn'
  if (program === 'pnpm') return 'pnpm'
  if (program === 'bun') return 'bun'

  return 'npm'
}

const ENV_HASH = (env: Record<string, unknown>): string => {
  const hash = createHash('md5')
  hash.update(JSON.stringify(env))

  return hash.digest('hex')
}

const RYUNIX_APP = /^RYUNIX_APP_/i

const getEnviroment = (): Record<string, string | undefined> =>
  Object.keys(process.env)
    .filter((key) => RYUNIX_APP.test(key))
    .reduce<Record<string, string | undefined>>(
      (env, key) => {
        env[key] = process.env[key]
        return env
      },
      {
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
    )

const require = createRequire(import.meta.url)

const getPackageVersion = async () => {
  const packageJsonPath = require.resolve('@unsetsoft/ryunixjs/package.json')
  const data = await readFile(packageJsonPath, 'utf-8')
  return JSON.parse(data)
}

async function cleanCacheDir(dirPath: string) {
  try {
    await fs.access(dirPath)
    await fs.rm(dirPath, { recursive: true, force: true })
    logger.info(
      `webpack cache cleaned ${chalk.bold(chalk.green('successfully'))}`,
    )
  } catch (err: unknown) {
    // Directory does not exist or some error occurred
    const nodeErr = err as NodeJS.ErrnoException
    if (nodeErr.code === 'ENOENT') {
      logger.info(`webpack cache cleaned ${chalk.red('failed')}`)
    } else {
      throw err // or handle error accordingly
    }
  }
}

async function cleanBuildDirectory(dirPath: string) {
  try {
    await fs.access(dirPath)
    await fs.rm(dirPath, { recursive: true, force: true })
    logger.info(
      `static folder cleaned ${chalk.bold(chalk.green('successfully'))}`,
    )
  } catch (err: unknown) {
    // Directory does not exist or some error occurred

    const nodeErr = err as NodeJS.ErrnoException
    if (nodeErr.code === 'ENOENT') {
      logger.info(`static folder cleaned ${chalk.red('failed')}`)
    } else {
      throw err // or handle error accordingly
    }
  }
}

// utils/convertFlatToClassic.js
export function convertFlatToClassic(configArray: Record<string, unknown>[]) {
  interface CombinedEslintConfig {
    env: Record<string, unknown>
    globals: Record<string, unknown>
    parserOptions: Record<string, unknown>
    plugins: Set<unknown>
    extends: Set<unknown>
    rules: Record<string, unknown>
    parser: unknown
  }

  const combined: CombinedEslintConfig = {
    env: {},
    globals: {},
    parserOptions: {},
    plugins: new Set(),
    extends: new Set(),
    rules: {},
    parser: undefined,
  }

  const invalidKeys = new Set()

  for (const rawCfg of configArray) {
    const cfg = rawCfg as {
      env?: Record<string, unknown>
      globals?: Record<string, unknown>
      parserOptions?: Record<string, unknown>
      languageOptions?: {
        parserOptions?: Record<string, unknown>
        parser?: unknown
      }
      plugins?: unknown[] | Record<string, unknown>
      extends?: unknown[] | string
      rules?: Record<string, unknown>
      parser?: unknown
    }

    // Detectar keys inválidas
    for (const key of Object.keys(cfg)) {
      if (
        ![
          'env',
          'globals',
          'parserOptions',
          'plugins',
          'extends',
          'rules',
          'parser',
          'languageOptions',
        ].includes(key)
      ) {
        invalidKeys.add(key)
      }
    }

    // Combinar env
    if (cfg.env) Object.assign(combined.env, cfg.env)

    // Combinar globals
    if (cfg.globals) Object.assign(combined.globals, cfg.globals)

    // Combinar parserOptions
    if (cfg.languageOptions?.parserOptions) {
      Object.assign(combined.parserOptions, cfg.languageOptions.parserOptions)
    } else if (cfg.parserOptions) {
      Object.assign(combined.parserOptions, cfg.parserOptions)
    }

    // Combinar plugins
    if (cfg.plugins) {
      if (Array.isArray(cfg.plugins)) {
        cfg.plugins.forEach((p: unknown) => combined.plugins.add(p))
      } else if (typeof cfg.plugins === 'object' && cfg.plugins !== null) {
        Object.keys(cfg.plugins).forEach((p) => combined.plugins.add(p))
      }
    }

    // Combinar extends
    if (cfg.extends) {
      if (Array.isArray(cfg.extends)) {
        cfg.extends.forEach((e: unknown) => combined.extends.add(e))
      } else if (typeof cfg.extends === 'string') {
        combined.extends.add(cfg.extends)
      }
    }

    // Combinar reglas
    if (cfg.rules) Object.assign(combined.rules, cfg.rules)

    // Parser
    if (cfg.languageOptions?.parser) {
      combined.parser = cfg.languageOptions.parser
    } else if (cfg.parser) {
      combined.parser = cfg.parser
    }
  }

  return {
    env: Object.keys(combined.env).length ? combined.env : undefined,
    globals: Object.keys(combined.globals).length
      ? combined.globals
      : undefined,
    parserOptions: Object.keys(combined.parserOptions).length
      ? combined.parserOptions
      : undefined,
    plugins: combined.plugins.size ? Array.from(combined.plugins) : undefined,
    extends: combined.extends.size ? Array.from(combined.extends) : undefined,
    rules: combined.rules,
    parser: combined.parser,
  }
}

export {
  getPackageManager,
  ENV_HASH,
  getEnviroment,
  resolveApp,
  RYUNIX_APP,
  getPackageVersion,
  cleanCacheDir,
  cleanBuildDirectory,
}
