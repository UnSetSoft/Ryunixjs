import Webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import webpackConfig from '../webpack.config.mjs'
import logger from 'terminal-log'
const StartServer = async (cliSettings) => {
  webpackConfig.mode = 'development'
  const compiler = Webpack(webpackConfig)
  const devServerOptions = { ...webpackConfig.devServer, ...cliSettings }
  const server = new WebpackDevServer(devServerOptions, compiler)

  await server.startCallback((err) => {
    if (err) {
      return logger.error(`[error] ${err.message}`)
    }

    if (webpackConfig.mode === 'development') {
      logger.info(
        `[info] Dev Server is runing at: http://localhost:${webpackConfig.devServer.port}`,
      )
    }
  })
}

export { StartServer }
