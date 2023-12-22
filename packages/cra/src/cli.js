#!/usr/bin/env node

const { resolve } = require('path')
const { create } = require('create-create-app')
const cmd = require('command-exists-promise')
const templateRoot = resolve(__dirname, '..', 'templates')

create('create-cra', {
  templateRoot,
  defaultTemplate: 'ryunix-webpack',
  promptForAuthor: false,
  promptForDescription: false,
  promptForEmail: false,
  promptForTemplate: true,
  promptForLicense: false,
  extra: {
    channel: {
      type: 'list',
      describe: 'Which Ryunix channel do you want to use?',
      choices: ['Latest', 'Nightly'],
      prompt: 'if-no-arg',
    },
    vscode: {
      type: 'confirm',
      default: false,
      describe: 'Do you whant to add Ryunix VScode addon? (Experimental)',
      prompt: 'if-no-arg',
    },
  },
  after: async ({ answers, template, installNpmPackage }) => {
    // Project
    if (template === 'ryunix-rspack') {
      if (answers.channel === 'Latest') {
        await installNpmPackage('@unsetsoft/ryunixjs@latest')
      } else if (answers.channel === 'Nightly') {
        await installNpmPackage('@unsetsoft/ryunixjs@nightly')
      }
      await installNpmPackage(
        ['@rspack/cli', '@rspack/core', 'cross-env'],
        true,
      )
    } else if (template === 'ryunix-webpack') {
      if (answers.channel === 'Latest') {
        await installNpmPackage('@unsetsoft/ryunixjs@latest')
        await installNpmPackage('@unsetsoft/ryunix-webpack@latest', true)
      } else if (answers.channel === 'Nightly') {
        await installNpmPackage('@unsetsoft/ryunixjs@nightly')
        await installNpmPackage('@unsetsoft/ryunix-webpack@nightly', true)
      }
    }

    // Extras

    if (answers.vscode) {
    }
  },
  caveat: 'Happy Coding!',
})
