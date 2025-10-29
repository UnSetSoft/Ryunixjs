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

  if (!defaultSettings.webpack.production) {
    cleanCacheDir(cacheDir)
  }

  webpackConfig.mode = 'development'
  const compiler = Webpack(webpackConfig)
  let port = webpackConfig.devServer.port || 3000

  // Encontrar un puerto disponible
  port = await findAvailablePort(port)

  // Modificamos el puerto en la configuración
  webpackConfig.devServer.port = port
  const devServerOptions = { ...webpackConfig.devServer, ...cliSettings }
  const server = new WebpackDevServer(devServerOptions, compiler)

  const devMode = Boolean(!defaultSettings.webpack.production)

  const { version } = await getPackageVersion()

  const startServer = async () => {
    try {
      await server.start() // Iniciar el servidor con el nuevo puerto

      logger.info(`\n
        ${chalk.bold(chalk.cyanBright(`<Ryunix/> ${version}`))}\n
          - Running at: http://localhost:${port}\n
          - Config file: ${
            configFileExist()
              ? chalk.green(`loaded`)
              : chalk.red(`404 Not Found`)
          }\n
          - Environment file: ${
            envPath() ? chalk.green(`loaded`) : chalk.red(`404 Not Found`)
          }\n
          - Mode: ${
            defaultSettings.webpack.production
              ? chalk.green(`production`)
              : chalk.yellow(`development`)
          }\n
        ${
          devMode
            ? chalk.yellow(
                `⚠️ You are in development mode, remember update ryunix.config.js for production!`,
              )
            : '' // prevent false in the terminal
        }\n      `)
    } catch (err) {
      logger.error(`[error] ${err.message}`)
    }
  }

  await startServer()
}

export { StartServer }
