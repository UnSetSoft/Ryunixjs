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
import boxen from 'boxen'
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
    `${defaultSettings.buildDir}/cache`,
  )

  const mode =
    cliSettings.production || defaultSettings.webpack.production ? true : false

  if (!mode) {
    cleanCacheDir(cacheDir)
  }

  const clientConfig = Array.isArray(webpackConfig)
    ? webpackConfig.find((c) => c.name === 'client') || webpackConfig[0]
    : webpackConfig

  if (Array.isArray(webpackConfig)) {
    webpackConfig.forEach((c) => (c.mode = mode ? 'production' : 'development'))
  } else {
    webpackConfig.mode = mode ? 'production' : 'development'
  }

  const compiler = Webpack(webpackConfig)
  let port = clientConfig.devServer?.port || 3000

  // Encontrar un puerto disponible
  port = await findAvailablePort(port)

  // Modificamos el puerto en la configuración
  if (clientConfig.devServer) {
    clientConfig.devServer.port = port
  }
  const devServerOptions = { ...(clientConfig.devServer || {}), ...cliSettings }
  const server = new WebpackDevServer(devServerOptions, compiler)

  const devMode = Boolean(!mode)

  const { version } = await getPackageVersion()

  const startServer = async () => {
    try {
      await server.start() // Iniciar el servidor con el nuevo puerto

      const url = `http://localhost:${port}`
      const cfgStatus = configFileExist()
        ? chalk.green('✔ Loaded')
        : chalk.red('✘ Not found')
      const envStatus = envPath()
        ? chalk.green('✔ Loaded')
        : chalk.yellow('✘ Not found')
      const modeLabel = mode
        ? chalk.bold(chalk.magenta('production'))
        : chalk.bold(chalk.cyan('development'))

      const { version } = await getPackageVersion()

      const content = [
        `${chalk.bold(chalk.cyanBright('<Ryunix/>'))} ${chalk.gray(`v${version}`)}`,
        '',
        `${chalk.white('Ready at:')} ${chalk.underline(chalk.cyan(url))}`,
        `${chalk.white('Config:')}   ${cfgStatus}`,
        `${chalk.white('Env:')}      ${envStatus}`,
        `${chalk.white('Mode:')}     ${modeLabel}`,
      ]

      if (devMode) {
        content.push('')
        content.push(
          `${chalk.yellow('⚠️')}  ${chalk.yellow('Development mode active')}`,
        )
        content.push(chalk.gray('Build for production to optimize performance'))
      }

      console.log(
        boxen(content.join('\n'), {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
          title: chalk.bold('Dev Server'),
          titleAlignment: 'center',
          minimumWidth: 50,
        }),
      )
    } catch (err) {
      logger.error(`[error] ${err.message}`)
    }
  }

  await startServer()
}

export { StartServer as StartDevServer }
