#! /usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { StartServer } from './serve.mjs'
import { compiler } from './compiler.mjs'
import { execSync }  from 'child_process'
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
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        // ...
        console.error(err)
      }

      console.log('Deployment completed')

      compiler.close((closeErr) => {
        if (closeErr) {
          // ...
          console.error(closeErr)
        }
      })
    })
  },
}

const lint = {
  command: 'lint',
  describe: 'Run lint',
  handler: async (arg) => {
    compiler.run((err, stats) => {
      try {
        const output = execSync('eslint');
        console.log(output);
      } catch (error) {
        console.error(error);
      }
    })
  },
}

const lintFix = {
  command: 'lint-fix',
  describe: 'Run fix',
  handler: async (arg) => {
    compiler.run((err, stats) => {
      try {
        const output = execSync('eslint --fix');
        console.log(output);
      } catch (error) {
        console.error(error);
      }
    })
  },
}

yargs(hideBin(process.argv)).command(serv).command(build).command(lint).command(lintFix).parse()
