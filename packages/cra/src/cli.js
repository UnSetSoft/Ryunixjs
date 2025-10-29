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
      choices: ['Latest', 'Canary'],
      prompt: 'if-no-arg',
    },

  },
  after: async ({ answers, template, installNpmPackage }) => {

    if (template === 'Rspack') {
      if (answers.channel === 'Latest') {
        await installNpmPackage('@unsetsoft/ryunixjs@latest')
      } else if (answers.channel === 'Canary') {
        await installNpmPackage('@unsetsoft/ryunixjs@canary')
      }

      await installNpmPackage(
        [
          '@rspack/cli',
          '@rspack/core',
          'cross-env',
          'css-loader',
          '@unsetsoft/ryunix-presets',
        ],
        true,
      )
    } else if (template === 'Webpack') {
      // Ryunix

      if (answers.channel === 'Latest') {
        await installNpmPackage('@unsetsoft/ryunixjs@latest')
        await installNpmPackage('@unsetsoft/ryunix-webpack@latest', true)
      } else if (answers.channel === 'Canary') {
        await installNpmPackage('@unsetsoft/ryunixjs@canary')
        await installNpmPackage('@unsetsoft/ryunix-webpack@canary', true)
      }
    } else if (template === 'Vite') {
      // Ryunix
      if (answers.channel === 'Latest') {
        await installNpmPackage('@unsetsoft/ryunixjs@latest')
      } else if (answers.channel === 'Canary') {
        await installNpmPackage('@unsetsoft/ryunixjs@canary')
      }

      await installNpmPackage(
        ['vite@latest', '@unsetsoft/ryunix-presets'],
        true,
      )
    } else {
      throw new Error('Missing template')
    }
  },
  caveat: 'Happy Coding!',
})
