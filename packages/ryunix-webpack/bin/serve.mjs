import Webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import webpackConfig from '../webpack.config.mjs'
import configFile from '../utils/settingfile.cjs'
import envPath from '../utils/envExist.cjs'
import { getPackageVersion } from '../utils/index.mjs'
import logger from 'terminal-log'
import chalk from 'chalk'

const StartServer = async (cliSettings) => {
  webpackConfig.mode = 'development'
  const compiler = Webpack(webpackConfig)
  const devServerOptions = { ...webpackConfig.devServer, ...cliSettings }
  const server = new WebpackDevServer(devServerOptions, compiler)

  let port = webpackConfig.devServer.port || 3000

  const { version } = await getPackageVersion()

  const startServer = async () => {
    try {
      await server.start(port)
      logger.info(`
        ${chalk.bold(chalk.cyanBright(`<Ryunix/> ${version}`))}

          - Runing at: http://localhost:${port}
          ${configFile ? `- Config file loaded` : null}
          ${envPath() ? `- Environments: .env` : null}
          - Launched in: 🚀 ${Date.now() - startTime}ms
      `)
    } catch (err) {
      logger.error(`[error] ${err.message}`)
      if (err.code === 'EADDRINUSE') {
        port += 1
        logger.warn(
          `${chalk.yellow('⚠️')} Port ${
            port - 1
          } is in use, trying ${port} instead.`,
        )
        await startServer() // Intenta de nuevo con un puerto diferente
      }
    }
  }

  const startTime = Date.now()
  await startServer()
}

export { StartServer }
