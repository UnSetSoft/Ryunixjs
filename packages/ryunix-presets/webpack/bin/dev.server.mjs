import Webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import webpackConfig from '../webpack.config.mjs'
import { configFileExist } from '../utils/settingfile.cjs'
import envPath from '../utils/envExist.cjs'
import {
  getPackageVersion,
  resolveApp,
  cleanCacheDir,
} from '../utils/index.mjs'
import logger from 'terminal-log'
import chalk from 'chalk'
import net from 'net' // Para verificar si el puerto está disponible
import defaultSettings from '../utils/config.cjs'

const checkPortInUse = (port) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true) // Puerto en uso
      } else {
        reject(err)
      }
    })
    server.once('listening', () => {
      server.close()
      resolve(false) // Puerto libre
    })
    server.listen(port)
  })
}

const findAvailablePort = async (port) => {
  let isPortInUse = await checkPortInUse(port)
  while (isPortInUse) {
    logger.warn(
      chalk.yellow(`Port ${port} is in use, trying port ${port + 1}...`),
    )
    port += 1
    isPortInUse = await checkPortInUse(port)
  }
  return port
}

const StartServer = async (cliSettings) => {
  const cacheDir = resolveApp(
    process.cwd(),
    `${defaultSettings.webpack.output.buildDirectory}/cache`,
  )

  const mode =
    cliSettings.production || defaultSettings.webpack.production ? true : false

  if (!mode) {
    cleanCacheDir(cacheDir)
  }

  webpackConfig.mode = mode ? 'production' : 'development'
  const compiler = Webpack(webpackConfig)
  let port = webpackConfig.devServer.port || 3000

  // Encontrar un puerto disponible
  port = await findAvailablePort(port)

  // Modificamos el puerto en la configuración
  webpackConfig.devServer.port = port
  const devServerOptions = { ...webpackConfig.devServer, ...cliSettings }
  const server = new WebpackDevServer(devServerOptions, compiler)

  const devMode = Boolean(!mode)

  const { version } = await getPackageVersion()

  const startServer = async () => {
    try {
      await server.start() // Iniciar el servidor con el nuevo puerto

      // Mejor formato de información para el servidor
      const url = `http://localhost:${port}`
      const cfgStatus = configFileExist()
        ? chalk.green('loaded')
        : chalk.red('not found')
      const envStatus = envPath()
        ? chalk.green('loaded')
        : chalk.yellow('not found')
      const modeLabel = mode
        ? chalk.green('production')
        : chalk.yellow('development')

      const lines = []
      lines.push(chalk.bold(chalk.cyanBright(`<Ryunix/> ${version}`)))
      lines.push('')
      lines.push(`${chalk.gray('-')} Running at: ${chalk.underline(url)}`)
      lines.push(`${chalk.gray('-')} Config file: ${cfgStatus}`)
      lines.push(`${chalk.gray('-')} Environment file: ${envStatus}`)
      lines.push(`${chalk.gray('-')} Mode: ${modeLabel}`)
      if (devMode)
        lines.push(
          chalk.yellow(
            '⚠️  You are in development mode — update ryunix.config.js for production',
          ),
        )

      lines.push('---------------------------')
      logger.info(lines.join('\n'))
    } catch (err) {
      logger.error(`[error] ${err.message}`)
    }
  }

  await startServer()
}

export { StartServer as StartDevServer }
