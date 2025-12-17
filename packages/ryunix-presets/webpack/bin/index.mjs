#! /usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { StartServer } from './serve.mjs'
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

const serv = {
  command: 'server',
  describe: 'Run server',
  handler: async (arg) => {
    const open = Boolean(arg.browser) || false
    const settings = {
      open,
    }

    StartServer(settings)
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

    if (fs.existsSync(resolveApp(process.cwd(), 'src/pages/routes.ryx'))) {
      await cleanBuildDirectory(
        resolveApp(
          process.cwd(),
          `${defaultSettings.webpack.output.buildDirectory}/static`,
        ),
      )
    }

    compiler.run(async (err, stats) => {
      if (err || stats.hasErrors()) {
        logger.error(chalk.red('Error during compilation:'))
        logger.error(err || stats.toString('errors-only'))
        return
      }

      const buildTimeMs = stats.endTime - stats.startTime

      const minutes = Math.floor(buildTimeMs / 60000)
      const seconds = ((buildTimeMs % 60000) / 1000).toFixed(1)

      const formattedTime =
        minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

      if (defaultSettings.webpack.production) {


        await Prerender(defaultSettings.webpack.output.buildDirectory)
      }

      logger.info(chalk.green('Compilation successful! 🎉'))
      logger.info(`Done in ${formattedTime}`)

      compiler.close((closeErr) => {
        if (closeErr) {
          logger.error(chalk.red('Error closing the compiler:'), closeErr)
        }
      })
    })
  },
}

const extractHTML = {
  command: 'customHtml',
  describe: 'Extract HTML for customization',
  handler: async (arg) => {
    const runPath = process.cwd()

    fs.copyFile(join(__dirname, "..", "template/index.html"), join(runPath, "public/index.html"), (err) => {
      if (err) {
        console.error("Error extracting HTML: ", err.message);
        return;
      }
      console.log("File extracted successfully. Now you can enable the template with static.customTemplate inside ryunix.config.js");
    });
  },
}


yargs(hideBin(process.argv)).command(serv).command(build).command(lint).command(extractHTML).parse()
