import Webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import webpackConfig from '../webpack.config.mjs'
import { configFileExist } from '../utils/settingfile.cjs'
import envPath from '../utils/envExist.cjs'
import { getPackageVersion } from '../utils/index.mjs'
import logger from 'terminal-log'
import chalk from 'chalk'
import net from 'net' // Para verificar si el puerto está disponible

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
  webpackConfig.mode = 'development'
  const compiler = Webpack(webpackConfig)
  let port = webpackConfig.devServer.port || 3000

  // Encontrar un puerto disponible
  port = await findAvailablePort(port)

  // Modificamos el puerto en la configuración
  webpackConfig.devServer.port = port
  const devServerOptions = { ...webpackConfig.devServer, ...cliSettings }
  const server = new WebpackDevServer(devServerOptions, compiler)

  const { version } = await getPackageVersion()

  const startServer = async () => {
    try {
      await server.start() // Iniciar el servidor con el nuevo puerto

      const launchTime = Date.now() - startTime
      let speedIndicator = ''

      if (launchTime < 500) {
        speedIndicator = chalk.green(`🚀 ${launchTime}ms`)
      } else if (launchTime >= 500 && launchTime < 900) {
        speedIndicator = chalk.yellow(`🐢 ${launchTime}ms`)
      } else {
        speedIndicator = chalk.red(`🚨 ${launchTime}ms`)
      }

      logger.info(`\n
        ${chalk.bold(chalk.cyanBright(`<Ryunix/> ${version}`))}

          - Running at: http://localhost:${port}
          - Config file: ${
            configFileExist()
              ? chalk.green(`loaded`)
              : chalk.red(`404 Not Found`)
          }
          - Environment file: ${
            envPath() ? chalk.green(`loaded`) : chalk.red(`404 Not Found`)
          }
          - Launched in: ${speedIndicator}
      `)
    } catch (err) {
      logger.error(`[error] ${err.message}`)
    }
  }

  const startTime = Date.now()
  await startServer()
}

export { StartServer }
