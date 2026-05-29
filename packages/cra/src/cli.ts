#!/usr/bin/env node

import { Command } from 'commander'
import prompts from 'prompts'
import pc from 'picocolors'
import path from 'path'
import { createApp } from './create-app'
import type { RyunixChannel, RyunixCompiler } from './create-app'
import packageJson from '../package.json'

let projectPath = ''

const program = new Command(packageJson.name)
  .version(
    packageJson.version,
    '-v, --version',
    'Output the current version of create-ryunix-app.',
  )
  .argument('[directory]')
  .usage('[directory] [options]')
  .helpOption('-h, --help', 'Display this help message.')
  .option('--canary', 'Use the Canary channel for Ryunix dependencies.')
  .option(
    '--latest',
    'Use the Latest channel for Ryunix dependencies. (default)',
  )
  .option('--tailwind', 'Initialize with Tailwind CSS config.')
  .option('--eslint', 'Initialize with ESLint config.')
  .option('--vscode', 'Add VS Code settings for Ryunix extension.')
  .option('--compiler <type>', 'Choose compiler: swc or babel. (default: swc)')
  .option(
    '--js',
    'Scaffold a JavaScript-only project (jsconfig, .js helpers). TypeScript is the default.',
  )
  .action((name: string | undefined) => {
    if (name) projectPath = name
  })
  .allowUnknownOption()
  .parse(process.argv)

const opts = program.opts<{
  canary?: boolean
  latest?: boolean
  tailwind?: boolean
  eslint?: boolean
  vscode?: boolean
  compiler?: RyunixCompiler
  js?: boolean
}>()

async function run(): Promise<void> {
  console.log(`\n${pc.bold(pc.cyan('Welcome to Ryunix!'))} 🚀\n`)

  if (typeof projectPath === 'string') {
    projectPath = projectPath.trim()
  }

  if (!projectPath) {
    const res = await prompts(
      {
        type: 'text',
        name: 'path',
        message: 'What is your project named?',
        initial: 'my-ryunix-app',
        validate: (name: string) => {
          if (name.trim().length === 0) return 'Project name cannot be empty'
          return true
        },
      },
      {
        onCancel: () => {
          console.error(pc.red('Exiting.'))
          process.exit(1)
        },
      },
    )

    if (typeof res.path === 'string') {
      projectPath = res.path.trim()
    }
  }

  if (!projectPath) {
    console.log(
      '\nPlease specify the project directory:\n' +
        `  ${pc.cyan(program.name())} ${pc.green('<project-directory>')}\n` +
        'For example:\n' +
        `  ${pc.cyan(program.name())} ${pc.green('my-ryunix-app')}\n\n` +
        `Run ${pc.cyan(`${program.name()} --help`)} to see all options.`,
    )
    process.exit(1)
  }

  let channel: RyunixChannel = 'Latest'
  if (opts.canary) channel = 'Canary'
  else if (!opts.latest) {
    const { channelChoice } = await prompts(
      {
        type: 'select',
        name: 'channelChoice',
        message: 'Which Ryunix channel do you want to use?',
        choices: [
          { title: 'Latest', value: 'Latest', description: 'Stable release' },
          {
            title: 'Canary',
            value: 'Canary',
            description: 'Cutting edge features (unstable)',
          },
        ],
        initial: 0,
      },
      { onCancel: () => process.exit(1) },
    )
    channel = channelChoice as RyunixChannel
  }

  let compiler: RyunixCompiler = opts.compiler || 'swc'
  if (!opts.compiler) {
    const { compilerChoice } = await prompts(
      {
        type: 'select',
        name: 'compilerChoice',
        message: 'Which compiler do you want to use?',
        choices: [
          {
            title: 'SWC (Fastest)',
            value: 'swc',
            description: 'Modern Rust-based compiler (recommended)',
          },
          {
            title: 'Babel',
            value: 'babel',
            description: 'Standard JavaScript-based compiler',
          },
        ],
        initial: 0,
      },
      { onCancel: () => process.exit(1) },
    )
    compiler = compilerChoice as RyunixCompiler
  }

  let tailwind = opts.tailwind || false
  if (!opts.tailwind && !process.argv.includes('--no-tailwind')) {
    const { useTailwind } = await prompts(
      {
        type: 'toggle',
        name: 'useTailwind',
        message: `Would you like to use ${pc.blue('Tailwind CSS')}?`,
        initial: true,
        active: 'Yes',
        inactive: 'No',
      },
      { onCancel: () => process.exit(1) },
    )
    tailwind = Boolean(useTailwind)
  }

  let eslint = opts.eslint || false
  if (!opts.eslint && !process.argv.includes('--no-eslint')) {
    const { useEslint } = await prompts(
      {
        type: 'toggle',
        name: 'useEslint',
        message: `Would you like to use ${pc.blue('ESLint')}?`,
        initial: false,
        active: 'Yes',
        inactive: 'No',
      },
      { onCancel: () => process.exit(1) },
    )
    eslint = Boolean(useEslint)
  }

  let vscode = opts.vscode || false
  if (!opts.vscode && !process.argv.includes('--no-vscode')) {
    const { useVscode } = await prompts(
      {
        type: 'toggle',
        name: 'useVscode',
        message: `Would you like to configure the ${pc.blue('Ryunix VS Code Extension')} workspace?`,
        initial: true,
        active: 'Yes',
        inactive: 'No',
      },
      { onCancel: () => process.exit(1) },
    )
    vscode = Boolean(useVscode)
  }

  const appName = path.basename(path.resolve(projectPath))

  try {
    await createApp({
      appPath: projectPath,
      appName,
      channel,
      compiler,
      tailwind,
      eslint,
      vscode,
      useJs: Boolean(opts.js),
    })
  } catch (error) {
    console.error(pc.red('\nUnexpected error occurred:\n'), error)
    process.exit(1)
  }
}

void run()
