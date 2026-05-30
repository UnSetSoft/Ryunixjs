import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { exec as execCb } from 'child_process'
import pc from 'picocolors'
import { getPkgManager } from './helpers/get-pkg-manager'
import { isFolderEmpty } from './helpers/is-folder-empty'
import { copyRecursiveSync } from './helpers/copy'
import { ensurePublicFavicon } from './helpers/ensure-public-favicon'
import { tryGitInit } from './helpers/git'

const exec = promisify(execCb)

export type RyunixChannel = 'Latest' | 'Canary'
export type RyunixCompiler = 'swc' | 'babel'

export interface CreateAppOptions {
  appPath: string
  appName: string
  channel: RyunixChannel
  compiler: RyunixCompiler
  tailwind: boolean
  eslint: boolean
  vscode: boolean
  /** When true, scaffold the JavaScript-only template variant (`*-js`). */
  useJs: boolean
}

export async function createApp({
  appPath,
  appName,
  channel,
  compiler,
  tailwind,
  eslint,
  vscode,
  useJs,
}: CreateAppOptions): Promise<void> {
  const root = path.resolve(appPath)

  if (fs.existsSync(root)) {
    if (!isFolderEmpty(root, appName)) {
      process.exit(1)
    }
  } else {
    fs.mkdirSync(root, { recursive: true })
  }

  console.log(`\nCreating a new Ryunix app in ${pc.green(root)}.\n`)
  process.chdir(root)

  let templateName = 'ryunix-base'
  if (tailwind && eslint) templateName = 'ryunix-all'
  else if (tailwind) templateName = 'ryunix-tailwind'
  else if (eslint) templateName = 'ryunix-eslint'

  if (useJs) templateName = `${templateName}-js`

  const templateDir = path.resolve(__dirname, '..', 'templates', templateName)
  if (!fs.existsSync(templateDir)) {
    console.error(pc.red(`Could not locate the template: ${templateDir}`))
    process.exit(1)
  }

  console.log(`Copying files from template...\n`)
  copyRecursiveSync(templateDir, root)
  ensurePublicFavicon(root)

  const gitignorePath = path.join(root, 'gitignore')
  if (fs.existsSync(gitignorePath)) {
    fs.renameSync(gitignorePath, path.join(root, '.gitignore'))
  }

  const packageJsonPath = path.join(root, 'package.json')
  let packageJson: Record<string, unknown> = {}
  if (fs.existsSync(packageJsonPath)) {
    packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf8'),
    ) as Record<string, unknown>
  }

  packageJson.name = appName
  packageJson.version = '0.1.0'
  packageJson.private = true

  const isCanary = channel === 'Canary'
  const versionTag = isCanary ? 'canary' : 'latest'

  let ryunixVersion: string = versionTag
  let presetsVersion: string = versionTag

  const pkgManager = getPkgManager()

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
      pc.yellow(
        `\nWarning: Could not fetch exact versions for ${versionTag}. Using tag instead.`,
      ),
    )
  }

  const dependencies =
    (packageJson.dependencies as Record<string, string> | undefined) ?? {}
  const devDependencies =
    (packageJson.devDependencies as Record<string, string> | undefined) ?? {}

  dependencies['@unsetsoft/ryunixjs'] = ryunixVersion
  devDependencies['@unsetsoft/ryunix-presets'] = presetsVersion

  if (tailwind) {
    devDependencies['tailwindcss'] = '^4.0.0'
    devDependencies['@tailwindcss/postcss'] = '^4.0.0'
    devDependencies['postcss'] = '^8.4.35'
    devDependencies['autoprefixer'] = '^10.4.20'
  }

  if (eslint) {
    devDependencies['eslint'] = '^9.39.0'
    devDependencies['eslint-plugin-react'] = '^7.37.0'
    devDependencies['eslint-plugin-react-hooks'] = '^4.6.0'
  }

  if (!useJs) {
    devDependencies['typescript'] = '^5.9.3'
  }

  packageJson.dependencies = dependencies
  packageJson.devDependencies = devDependencies

  const scripts =
    (packageJson.scripts as Record<string, string> | undefined) ?? {}
  if (!scripts.dev || scripts.dev === 'dev') scripts.dev = 'ryunix dev'
  if (!scripts.start) scripts.start = 'ryunix start'
  if (!scripts.build) scripts.build = 'ryunix build'
  if (eslint && !scripts.lint) scripts.lint = 'ryunix lint'
  if (eslint && !scripts['lint:fix']) scripts['lint:fix'] = 'ryunix lint --fix'
  packageJson.scripts = scripts

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

  const configPath = path.join(root, 'ryunix.config.js')
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8')
    if (configContent.includes('const RyunixSettings = {')) {
      configContent = configContent.replace(
        'const RyunixSettings = {',
        `const RyunixSettings = {\n  compiler: '${compiler}',`,
      )
    }
    fs.writeFileSync(configPath, configContent)
  }

  if (vscode) {
    const vscodeDir = path.join(root, '.vscode')
    if (!fs.existsSync(vscodeDir)) fs.mkdirSync(vscodeDir)
    const extensionsJson: { recommendations: string[] } = {
      recommendations: ['unsetsoft.ryunixjs', 'dbaeumer.vscode-eslint'],
    }
    const settingsJson: Record<string, unknown> = {
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
    fs.writeFileSync(
      path.join(vscodeDir, 'extensions.json'),
      JSON.stringify(extensionsJson, null, 2),
    )
    fs.writeFileSync(
      path.join(vscodeDir, 'settings.json'),
      JSON.stringify(settingsJson, null, 2),
    )
  }

  if (tryGitInit(root)) {
    console.log(`\n${pc.green('Initialized a git repository.')}`)
  }

  console.log(`\n${pc.green('Success!')} Created ${appName}`)
  console.log('Inside that directory, you can run several commands:\n')
  console.log(pc.cyan(`  ${pkgManager} run dev`))
  console.log('    Starts the development server.\n')
  console.log(pc.cyan(`  ${pkgManager} run build`))
  console.log('    Builds the app for production.\n')
  console.log(pc.cyan(`  ${pkgManager} start`))
  console.log('    Runs the built app in production mode.\n')
  console.log('We suggest that you begin by typing:\n')
  console.log(pc.cyan('  cd'), appName)
  console.log(pc.cyan(`  ${pkgManager} install`))
  console.log(pc.cyan(`  ${pkgManager} run dev\n`))
}
