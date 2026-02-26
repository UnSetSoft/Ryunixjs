#! /usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { StartDevServer } from './dev.server.mjs'
import { compiler } from './compiler.mjs'
import logger from 'terminal-log'
import chalk from 'chalk'
import defaultSettings from '../utils/config.cjs'
import Prerender from './prerender.mjs'
import {
  cleanBuildDirectory,
  convertFlatToClassic,
  resolveApp,
} from '../utils/index.mjs'
import { ESLint } from 'eslint'
import eslintConfig from '../eslint.config.mjs'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import server from './prod.server.mjs'
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
    if (defaultSettings.webpack.production) {
      logger.error(
        'You need use development mode! change webpack.production to false in ryunix.config.js.',
      )
      return
    }
    const open = Boolean(arg.browser) || false
    const settings = {
      open,
    }

    StartDevServer(settings)
  },
}

const prod = {
  command: 'start',
  describe: 'Run server for production mode. Requiere .ryunix/static',
  handler: async (arg) => {
    if (!defaultSettings.webpack.production) {
      logger.error('You need use production mode!')
      return
    }

    if (
      !fs.existsSync(
        join(process.cwd(), config.webpack.output.buildDirectory, 'static'),
      )
    ) {
      logger.error('You need build first!')
      return
    }

    server.listen(config.webpack.devServer.port, () => {
      console.log(
        `Server running at http://localhost:${config.webpack.devServer.port}/`,
      )
    })
  },
}

const build = {
  command: 'build',
  describe: 'Run builder',
  handler: async (arg) => {
    if (!defaultSettings.webpack.production) {
      logger.error(
        chalk.red(
          'The compilation cannot complete because you are trying to compile in developer mode. remember update ryunix.config.js.',
        ),
      )
      return
    }

    // ── Clean build output before each production build ───────────────────
    // Clears static/ and server/ (except server/api/) but keeps cache/ intact.
    const buildRoot = resolveApp(process.cwd(), defaultSettings.webpack.output.buildDirectory)
    const clean = (dir) => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    }
    clean(join(buildRoot, 'static'))
    clean(join(buildRoot, 'server', 'app'))
    clean(join(buildRoot, 'server', 'app-router-server.bundle.mjs'))
    // Note: server/api/ is cleaned by ApiRouterPlugin on its own (incremental recompile)

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
      const formattedTime = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

      // ── SSG Prerender ──────────────────────────────────────────────────────
      if (defaultSettings.webpack.production) {
        await Prerender(defaultSettings.webpack.output.buildDirectory)
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
          console.log(`✅ API routes (${apiRoutes.length}):`)
          apiRoutes.forEach((r) => console.log(` - /api${r}`))
        }
      }

      logger.info(chalk.green('Compilation successful! 🎉'))
      logger.info(`Done in ${formattedTime}`)

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
          'File extracted successfully. Now you can enable the template with static.customTemplate inside ryunix.config.js',
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
