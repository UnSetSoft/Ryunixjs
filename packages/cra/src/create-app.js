'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.createApp = createApp
const path_1 = __importDefault(require('path'))
const fs_1 = __importDefault(require('fs'))
const util_1 = require('util')
const child_process_1 = require('child_process')
const picocolors_1 = __importDefault(require('picocolors'))
const get_pkg_manager_1 = require('./helpers/get-pkg-manager')
const is_folder_empty_1 = require('./helpers/is-folder-empty')
const copy_1 = require('./helpers/copy')
const ensure_public_favicon_1 = require('./helpers/ensure-public-favicon')
const git_1 = require('./helpers/git')
const exec = (0, util_1.promisify)(child_process_1.exec)
async function createApp({
  appPath,
  appName,
  channel,
  compiler,
  tailwind,
  eslint,
  vscode,
}) {
  const root = path_1.default.resolve(appPath)
  if (fs_1.default.existsSync(root)) {
    if (!(0, is_folder_empty_1.isFolderEmpty)(root, appName)) {
      process.exit(1)
    }
  } else {
    fs_1.default.mkdirSync(root, { recursive: true })
  }
  console.log(
    `\nCreating a new Ryunix app in ${picocolors_1.default.green(root)}.\n`,
  )
  process.chdir(root)
  let templateName = 'ryunix-base'
  if (tailwind && eslint) templateName = 'ryunix-all'
  else if (tailwind) templateName = 'ryunix-tailwind'
  else if (eslint) templateName = 'ryunix-eslint'
  const templateDir = path_1.default.resolve(
    __dirname,
    '..',
    'templates',
    templateName,
  )
  if (!fs_1.default.existsSync(templateDir)) {
    console.error(
      picocolors_1.default.red(`Could not locate the template: ${templateDir}`),
    )
    process.exit(1)
  }
  console.log(`Copying files from template...\n`)
  ;(0, copy_1.copyRecursiveSync)(templateDir, root)
  ;(0, ensure_public_favicon_1.ensurePublicFavicon)(root)
  const gitignorePath = path_1.default.join(root, 'gitignore')
  if (fs_1.default.existsSync(gitignorePath)) {
    fs_1.default.renameSync(
      gitignorePath,
      path_1.default.join(root, '.gitignore'),
    )
  }
  const packageJsonPath = path_1.default.join(root, 'package.json')
  let packageJson = {}
  if (fs_1.default.existsSync(packageJsonPath)) {
    packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8'))
  }
  packageJson.name = appName
  packageJson.version = '0.1.0'
  packageJson.private = true
  const isCanary = channel === 'Canary'
  const versionTag = isCanary ? 'canary' : 'latest'
  let ryunixVersion = versionTag
  let presetsVersion = versionTag
  const pkgManager = (0, get_pkg_manager_1.getPkgManager)()
  let viewCmd = 'npm view'
  if (pkgManager === 'yarn') {
    viewCmd = 'yarn info'
  } else if (pkgManager === 'pnpm') {
    viewCmd = 'pnpm view'
  } else if (pkgManager === 'bun') {
    viewCmd = 'npm view'
  }
  try {
    const { stdout: ryunixStdout } = await exec(
      `${viewCmd} @unsetsoft/ryunixjs@${versionTag} version`,
    )
    const { stdout: presetsStdout } = await exec(
      `${viewCmd} @unsetsoft/ryunix-presets@${versionTag} version`,
    )
    ryunixVersion = '^' + ryunixStdout.trim()
    presetsVersion = '^' + presetsStdout.trim()
  } catch {
    console.warn(
      picocolors_1.default.yellow(
        `\nWarning: Could not fetch exact versions for ${versionTag}. Using tag instead.`,
      ),
    )
  }
  const dependencies = packageJson.dependencies ?? {}
  const devDependencies = packageJson.devDependencies ?? {}
  dependencies['@unsetsoft/ryunixjs'] = ryunixVersion
  devDependencies['@unsetsoft/ryunix-presets'] = presetsVersion
  if (tailwind) {
    devDependencies['tailwindcss'] = '^4.0.0'
    devDependencies['@tailwindcss/postcss'] = '^4.0.0'
    devDependencies['postcss'] = '^8.4.35'
  }
  if (eslint) {
    devDependencies['eslint'] = '^8.57.0'
    devDependencies['eslint-plugin-react'] = '^7.34.0'
    devDependencies['eslint-plugin-react-hooks'] = '^4.6.0'
  }
  packageJson.dependencies = dependencies
  packageJson.devDependencies = devDependencies
  fs_1.default.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2),
  )
  const configPath = path_1.default.join(root, 'ryunix.config.js')
  if (fs_1.default.existsSync(configPath)) {
    let configContent = fs_1.default.readFileSync(configPath, 'utf8')
    if (configContent.includes('const RyunixSettings = {')) {
      configContent = configContent.replace(
        'const RyunixSettings = {',
        `const RyunixSettings = {\n  compiler: '${compiler}',`,
      )
    }
    fs_1.default.writeFileSync(configPath, configContent)
  }
  if (vscode) {
    const vscodeDir = path_1.default.join(root, '.vscode')
    if (!fs_1.default.existsSync(vscodeDir)) fs_1.default.mkdirSync(vscodeDir)
    const extensionsJson = {
      recommendations: ['unsetsoft.ryunixjs', 'dbaeumer.vscode-eslint'],
    }
    const settingsJson = {
      'ryunix.languageServer.enable': true,
      'files.associations': {
        '*.ryx': 'ryunix',
      },
      'emmet.includeLanguages': {
        ryunix: 'html',
      },
      'javascript.validate.enable': true,
      'editor.quickSuggestions': {
        strings: true,
      },
      'eslint.validate': ['javascript', 'javascriptreact', 'ryunix'],
      'eslint.probe': [
        'javascript',
        'javascriptreact',
        'typescript',
        'typescriptreact',
        'ryunix',
      ],
      'explorer.fileNesting.patterns': {
        'index.ryx': 'layout.ryx, loading.ryx, error.ryx, errors.ryx',
      },
    }
    if (tailwind) {
      extensionsJson.recommendations.push('bradlc.vscode-tailwindcss')
      settingsJson['tailwindCSS.includeLanguages'] = { ryunix: 'html' }
      settingsJson['tailwindCSS.experimental.classRegex'] = [
        ['className\\s*=\\s*["\'`]([^"\'`]*)["\'`]', '([^\\s]+)'],
      ]
    }
    if (eslint) {
      extensionsJson.recommendations.push('esbenp.prettier-vscode')
      settingsJson['[ryunix]'] = {
        'editor.defaultFormatter': 'esbenp.prettier-vscode',
      }
      settingsJson['prettier.documentSelectors'] = ['**/*.ryx']
    }
    fs_1.default.writeFileSync(
      path_1.default.join(vscodeDir, 'extensions.json'),
      JSON.stringify(extensionsJson, null, 2),
    )
    fs_1.default.writeFileSync(
      path_1.default.join(vscodeDir, 'settings.json'),
      JSON.stringify(settingsJson, null, 2),
    )
  }
  if ((0, git_1.tryGitInit)(root)) {
    console.log(
      `\n${picocolors_1.default.green('Initialized a git repository.')}`,
    )
  }
  console.log(`\n${picocolors_1.default.green('Success!')} Created ${appName}`)
  console.log('Inside that directory, you can run several commands:\n')
  console.log(picocolors_1.default.cyan(`  ${pkgManager} run dev`))
  console.log('    Starts the development server.\n')
  console.log(picocolors_1.default.cyan(`  ${pkgManager} run build`))
  console.log('    Builds the app for production.\n')
  console.log(picocolors_1.default.cyan(`  ${pkgManager} start`))
  console.log('    Runs the built app in production mode.\n')
  console.log('We suggest that you begin by typing:\n')
  console.log(picocolors_1.default.cyan('  cd'), appName)
  console.log(picocolors_1.default.cyan(`  ${pkgManager} install`))
  console.log(picocolors_1.default.cyan(`  ${pkgManager} run dev\n`))
}
