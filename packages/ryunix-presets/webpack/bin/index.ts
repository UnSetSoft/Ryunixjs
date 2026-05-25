#! /usr/bin/env node
import yargs from 'yargs'

const hideBin = (argv: string[]) => argv.slice(2)
import { StartDevServer } from './dev.server.js'
import { compiler } from './compiler.js'
import logger from 'terminal-log'
import chalk from 'chalk'
import boxen from 'boxen'
import defaultSettings from '../utils/config.cjs'
import Prerender from './prerender.js'
import {
  cleanBuildDirectory,
  convertFlatToClassic,
  resolveApp,
  getPackageVersion,
} from '../utils/index.js'
import { ESLint } from 'eslint'
import eslintConfig from '../eslint.config.js'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import server from './prod.server.js'
import config from '../utils/config.cjs'
const __filename = fileURLToPath(import.meta.url)

const __dirname = dirname(__filename)

const lint = {
  command: 'lint',
  describe: 'Lint code',
  builder: {
    fix: {
      alias: 'f',
      type: 'boolean',
      default: false,
      describe: 'Automatically fix problems',
    },
  },
  handler: async (arg) => {
    const classicConfig = eslintConfig[0]

    const fix = arg.fix
    const eslint = new ESLint({
      cwd: process.cwd(),
      overrideConfigFile: true,
      overrideConfig: classicConfig,
      fix,
    })

    const results = await eslint.lintFiles(defaultSettings.eslint.files)

    await ESLint.outputFixes(results)

    const formatter = await eslint.loadFormatter('stylish')
    const report = formatter.format(results)
    console.log(report)
  },
}

const dev = {
  command: 'dev',
  describe: 'Run server for developer mode.',
  handler: async (arg) => {
    process.env.RYUNIX_MODE = 'development'
    const open = Boolean(arg.browser) || false
    const settings = {
      open,
    }

    // add message to say the server is starting with chalk
    console.log(chalk.cyan('Starting development server, please wait...'))
    console.log(
      `${chalk.cyan('○')}  Compiler: ${chalk.bold(config.compiler.toUpperCase())}`,
    )
    try {
      await StartDevServer(settings)
    } catch (error) {
      logger.error(chalk.red('Error starting development server:'), error)
      process.exit(1)
    }
  },
}

const prod = {
  command: 'start',
  describe: 'Run server for production mode. Requiere .ryunix/static',
  handler: async (arg) => {
    process.env.RYUNIX_MODE = 'production'
    if (!fs.existsSync(join(process.cwd(), config.buildDir, 'static'))) {
      logger.error('You need build first!')
      return
    }

    const { version } = await getPackageVersion()

    server.listen(config.port, () => {
      const content = [
        `${chalk.bold(chalk.cyanBright('<Ryunix/>'))} ${chalk.gray(`v${version}`)}`,
        '',
        `${chalk.white('Ready at:')} ${chalk.underline(chalk.cyan(`http://localhost:${config.port}/`))}`,
        `${chalk.white('Mode:')}     ${chalk.bold(chalk.magenta('production'))}`,
      ]

      console.log(
        boxen(content.join('\n'), {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'magenta',
          title: chalk.bold('Production Server'),
          titleAlignment: 'center',
          minimumWidth: 50,
        }),
      )
    })
  },
}

const build = {
  command: 'build',
  describe: 'Run builder',
  handler: async (arg) => {
    process.env.RYUNIX_MODE = 'production'

    // ── Clean build output before each production build ───────────────────
    // Clears static/ and server/ (except server/api/) but keeps cache/ intact.
    const buildRoot = resolveApp(process.cwd(), defaultSettings.buildDir)
    const clean = (dir) => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    }
    clean(join(buildRoot, 'static'))
    clean(join(buildRoot, 'server', 'app'))
    clean(join(buildRoot, 'server', 'app-router-server.bundle.js'))
    // Note: server/api/ is cleaned by ApiRouterPlugin on its own (incremental recompile)

    console.log(
      `${chalk.cyan('○')}  Compiling using ${chalk.bold(config.compiler.toUpperCase())}...`,
    )
    const buildStart = Date.now()

    compiler.run(async (err, stats) => {
      if (err || stats.hasErrors()) {
        logger.error(chalk.red('✘ Error during compilation:'))
        if (err) {
          logger.error(err)
        } else {
          // MultiStats or Stats — toString works on both
          const output = stats.toString('errors-only')
          const lines = output.split('\n').filter(Boolean)
          lines.forEach((line) => logger.error(line))
        }
        compiler.close(() => process.exit(1))
        return
      }

      // ── Build time ─────────────────────────────────────────────────────────
      const buildTimeMs = Date.now() - buildStart
      const minutes = Math.floor(buildTimeMs / 60000)
      const seconds = ((buildTimeMs % 60000) / 1000).toFixed(1)
      const formattedTime =
        minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

      // ── SSG Prerender ──────────────────────────────────────────────────────
      if (defaultSettings.webpack.production) {
        await Prerender(defaultSettings.buildDir)
      }

      // ── API Routes log ─────────────────────────────────────────────────────
      const apiOutputDir = join(buildRoot, 'server', 'api')
      if (fs.existsSync(apiOutputDir)) {
        const collectRoutes = (dir, base = '') => {
          const routes = []
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = join(dir, entry.name)
            if (entry.isDirectory()) {
              routes.push(...collectRoutes(fullPath, `${base}/${entry.name}`))
            } else if (/^(route|router|endpoint)\.(mjs|js)$/.test(entry.name)) {
              routes.push(base || '/')
            }
          }
          return routes
        }
        const apiRoutes = collectRoutes(apiOutputDir)
        if (apiRoutes.length > 0) {
          console.log(
            `${chalk.cyan('○')}  API routes (${chalk.bold(apiRoutes.length)}):`,
          )
          apiRoutes.forEach((r) =>
            console.log(`   ${chalk.green('✔')} ${chalk.gray(`/api${r}`)}`),
          )
          console.log('')
        }
      }

      logger.info(
        `${chalk.green('✔')} ${chalk.bold('Compilation successful! 🎉')}`,
      )
      logger.info(`${chalk.gray('Done in')} ${chalk.bold(formattedTime)}`)

      compiler.close((closeErr) => {
        if (closeErr) {
          logger.error(chalk.red('Error closing the compiler:'), closeErr)
        }
        process.exit(0)
      })
    })
  },
}

const extractHTML = {
  command: 'customHtml',
  describe: 'Extract HTML for customization',
  handler: async (arg) => {
    const runPath = process.cwd()

    fs.copyFile(
      join(__dirname, '..', 'template/index.html'),
      join(runPath, 'public/index.html'),
      (err) => {
        if (err) {
          console.error('Error extracting HTML: ', err.message)
          return
        }
        console.log(
          'File extracted successfully. Now you can enable the template with legacy.template inside ryunix.config.js',
        )
      },
    )
  },
}

yargs(hideBin(process.argv))
  .command(dev)
  .command(build)
  .command(prod)
  .command(lint)
  .command(extractHTML)
  .parse()
