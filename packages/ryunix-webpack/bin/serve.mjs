import Webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import webpackConfig from '../webpack.config.mjs'
import configFile from '../utils/settingfile.cjs'
import envPath from "../utils/envExist.cjs"

import logger from 'terminal-log'

const StartServer = async (cliSettings) => {
  webpackConfig.mode = 'development'
  const compiler = Webpack(webpackConfig)
  const devServerOptions = { ...webpackConfig.devServer, ...cliSettings }
  const server = new WebpackDevServer(devServerOptions, compiler)

  let port = webpackConfig.devServer.port || 3000;

  const startServer = async () => {
    try {
      await server.start(port);
      logger.info("<<RyunixJS>>");
      logger.info(`
          - Runing at: http://localhost:${port}
          ${configFile ? `- Config file loaded` : null}
          ${envPath() ? `- Enviroment: .env`: null}
      `)
      logger.info(`🚀 Launched in ${Date.now() - startTime}ms`)
    } catch (err) {
      logger.error(`[error] ${err.message}`);
      if (err.code === 'EADDRINUSE') {
        port += 1;
        logger.warn(`Port ${port - 1} is in use, trying ${port} instead.`);
        await startServer();  // Intenta de nuevo con un puerto diferente
      }
    }
  }

  const startTime = Date.now();
  await startServer();
}

export { StartServer }