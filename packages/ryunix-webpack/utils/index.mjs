import { createHash } from 'node:crypto'
import { resolve } from 'path'

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import logger from 'terminal-log'
import chalk from 'chalk'

const resolveApp = (appDirectory, relativePath) =>
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

const ENV_HASH = (env) => {
  const hash = createHash('md5')
  hash.update(JSON.stringify(env))

  return hash.digest('hex')
}

const RYUNIX_APP = /^RYUNIX_APP_/i

const getEnviroment = () =>
  Object.keys(process.env)
    .filter((key) => RYUNIX_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = process.env[key]
        return env
      },
      {
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
    )

const getPackageVersion = async () => {
  const __dirname = dirname(fileURLToPath(import.meta.url)) // Para obtener el directorio actual
  const packageJsonPath = join(__dirname, '../package.json')
  const data = await fs.readFile(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(data)
  return packageJson
}

async function cleanCacheDir(dirPath) {
  try {
    await fs.access(dirPath)
    await fs.rm(dirPath, { recursive: true, force: true })
    logger.info(
      `webpack cache cleaned ${chalk.bold(chalk.green('successfully'))}`,
    )
  } catch (err) {
    // Directory does not exist or some error occurred
    if (err.code === 'ENOENT') {
      logger.info(`webpack cache cleaned ${chalk.red('failed')}`)
    } else {
      throw err // or handle error accordingly
    }
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
}
