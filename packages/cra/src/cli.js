#!/usr/bin/env node

const { resolve } = require('path')
const { create } = require('create-create-app')
const { hasVscode, InstallVsocodeAddon } = require('./commands')
const templateRoot = resolve(__dirname, '..', 'templates')

create('create-cra', {
  templateRoot,
  defaultTemplate: 'Webpack',
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
      prompt: hasVscode ? 'if-no-arg' : 'never',
    },
  },
  after: async ({ answers, template, installNpmPackage }) => {
    if (answers.vscode) {
      await InstallVsocodeAddon()
    }

    if (template === 'Rspack') {
      if (answers.channel === 'Latest') {
        await installNpmPackage('@unsetsoft/ryunixjs@latest')
      } else if (answers.channel === 'Nightly') {
        await installNpmPackage('@unsetsoft/ryunixjs@nightly')
      }
      await installNpmPackage(
        ['@rspack/cli', '@rspack/core', 'cross-env'],
        true,
      )
    } else if (template === 'Webpack') {
      if (answers.channel === 'Latest') {
        await installNpmPackage('@unsetsoft/ryunixjs@latest')
        await installNpmPackage('@unsetsoft/ryunix-webpack@latest', true)
      } else if (answers.channel === 'Nightly') {
        await installNpmPackage('@unsetsoft/ryunixjs@nightly')
        await installNpmPackage('@unsetsoft/ryunix-webpack@nightly', true)
      }
    } else {
      throw new Error('Missing template')
    }
  },
  caveat: 'Happy Coding!',
})
