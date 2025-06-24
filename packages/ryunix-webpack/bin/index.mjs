#! /usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { StartServer } from './serve.mjs'
import { compiler } from './compiler.mjs'
import logger from 'terminal-log'
import chalk from 'chalk'
import defaultSettings from '../utils/config.cjs'

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

    compiler.run((err, stats) => {
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

yargs(hideBin(process.argv)).command(serv).command(build).parse()
