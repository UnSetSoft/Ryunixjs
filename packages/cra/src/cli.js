#!/usr/bin/env node

const { resolve } = require('path')
const { create } = require('create-create-app')

const templateRoot = resolve(__dirname, '..', 'templates')

const caveat = `
This is a caveat!
You can change this in \`src/cli.js\`.
`

// See https://github.com/uetchy/create-create-app/blob/master/README.md for other options.

create('create-cra', {
  templateRoot,
  defaultTemplate: 'ryunix-webpack',
  promptForAuthor: false,
  promptForDescription: false,
  promptForEmail: false,
  promptForTemplate: false,
  promptForLicense: false,
  extra: {
    channel: {
      type: 'list',
      describe: 'Which Ryunix channel do you want to use?',
      choices: ['Latest', 'Nightly'],
      prompt: 'if-no-arg',
    },
  },
  after: async ({ answers, template, installNpmPackage }) => {
    if (template === 'ryunix-rspack') {
      // if (answers.channel === 'Latest') {
      //   await installNpmPackage('@unsetsoft/ryunixjs@latest')
      //   await installNpmPackage(
      //     ['@rspack/cli', '@rspack/core', 'cross-env'],
      //     true,
      //   )
      // }
    } else if (template === 'ryunix-webpack') {
      if (answers.channel === 'Latest') {
        await installNpmPackage('@unsetsoft/ryunixjs@latest')
        await installNpmPackage('@unsetsoft/ryunix-webpack@latest', true)
      } else if (answers.channel === 'Nightly') {
        await installNpmPackage('@unsetsoft/ryunixjs@nightly')
        await installNpmPackage('@unsetsoft/ryunix-webpack@nightly', true)
      }
    }
  },
  caveat: ({ packageDir, packageManager }) =>
    `cd ${packageDir} && ${packageManager} start`,
})
