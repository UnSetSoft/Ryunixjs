import Webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import webpackConfig from '../webpack.config.mjs'
import configFile from '../utils/settingfile.cjs'
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

      logger.info(`
        ${chalk.bold(chalk.cyanBright(`<Ryunix/> ${version}`))}

          - Running at: http://localhost:${port}
          - Config file: ${configFile ? `loaded` : '404'}
          - Environment file: ${envPath() ? `loaded` : '404'}
          - Launched in: ${
            Date.now() - startTime > 1 && Date.now() - startTime < 89
              ? chalk.green(`🚀 ${Date.now() - startTime}ms`)
              : chalk.yellow(`🐢 ${Date.now() - startTime}ms`)
          }
      `)
    } catch (err) {
      logger.error(`[error] ${err.message}`)
    }
  }

  const startTime = Date.now()
  await startServer()
}

export { StartServer }
