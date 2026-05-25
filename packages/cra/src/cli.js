#!/usr/bin/env node
'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const commander_1 = require('commander')
const prompts_1 = __importDefault(require('prompts'))
const picocolors_1 = __importDefault(require('picocolors'))
const path_1 = __importDefault(require('path'))
const create_app_1 = require('./create-app')
const package_json_1 = __importDefault(require('../package.json'))
let projectPath = ''
const program = new commander_1.Command(package_json_1.default.name)
  .version(
    package_json_1.default.version,
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
  .action((name) => {
    if (name) projectPath = name
  })
  .allowUnknownOption()
  .parse(process.argv)
const opts = program.opts()
async function run() {
  console.log(
    `\n${picocolors_1.default.bold(picocolors_1.default.cyan('Welcome to Ryunix!'))} 🚀\n`,
  )
  if (typeof projectPath === 'string') {
    projectPath = projectPath.trim()
  }
  if (!projectPath) {
    const res = await (0, prompts_1.default)(
      {
        type: 'text',
        name: 'path',
        message: 'What is your project named?',
        initial: 'my-ryunix-app',
        validate: (name) => {
          if (name.trim().length === 0) return 'Project name cannot be empty'
          return true
        },
      },
      {
        onCancel: () => {
          console.error(picocolors_1.default.red('Exiting.'))
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
        `  ${picocolors_1.default.cyan(program.name())} ${picocolors_1.default.green('<project-directory>')}\n` +
        'For example:\n' +
        `  ${picocolors_1.default.cyan(program.name())} ${picocolors_1.default.green('my-ryunix-app')}\n\n` +
        `Run ${picocolors_1.default.cyan(`${program.name()} --help`)} to see all options.`,
    )
    process.exit(1)
  }
  let channel = 'Latest'
  if (opts.canary) channel = 'Canary'
  else if (!opts.latest) {
    const { channelChoice } = await (0, prompts_1.default)(
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
    channel = channelChoice
  }
  let compiler = opts.compiler || 'swc'
  if (!opts.compiler) {
    const { compilerChoice } = await (0, prompts_1.default)(
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
    compiler = compilerChoice
  }
  let tailwind = opts.tailwind || false
  if (!opts.tailwind && !process.argv.includes('--no-tailwind')) {
    const { useTailwind } = await (0, prompts_1.default)(
      {
        type: 'toggle',
        name: 'useTailwind',
        message: `Would you like to use ${picocolors_1.default.blue('Tailwind CSS')}?`,
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
    const { useEslint } = await (0, prompts_1.default)(
      {
        type: 'toggle',
        name: 'useEslint',
        message: `Would you like to use ${picocolors_1.default.blue('ESLint')}?`,
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
    const { useVscode } = await (0, prompts_1.default)(
      {
        type: 'toggle',
        name: 'useVscode',
        message: `Would you like to configure the ${picocolors_1.default.blue('Ryunix VS Code Extension')} workspace?`,
        initial: true,
        active: 'Yes',
        inactive: 'No',
      },
      { onCancel: () => process.exit(1) },
    )
    vscode = Boolean(useVscode)
  }
  const appName = path_1.default.basename(path_1.default.resolve(projectPath))
  try {
    await (0, create_app_1.createApp)({
      appPath: projectPath,
      appName,
      channel,
      compiler,
      tailwind,
      eslint,
      vscode,
    })
  } catch (error) {
    console.error(
      picocolors_1.default.red('\nUnexpected error occurred:\n'),
      error,
    )
    process.exit(1)
  }
}
void run()
