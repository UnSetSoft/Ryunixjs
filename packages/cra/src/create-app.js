const path = require('path')
const fs = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const pc = require('picocolors')
const { getPkgManager } = require('./helpers/get-pkg-manager')
const { isFolderEmpty } = require('./helpers/is-folder-empty')
const { copyRecursiveSync } = require('./helpers/copy')
const { install } = require('./helpers/install')
const { tryGitInit } = require('./helpers/git')

async function createApp({ appPath, appName, channel, compiler, tailwind, eslint, vscode }) {
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

  // 1. Copy Template
  let templateName = 'ryunix-base'
  if (tailwind && eslint) templateName = 'ryunix-all'
  else if (tailwind) templateName = 'ryunix-tailwind'
  else if (eslint) templateName = 'ryunix-eslint'

  const templateDir = path.resolve(__dirname, '..', 'templates', templateName)
  if (!fs.existsSync(templateDir)) {
    console.error(pc.red(`Could not locate the template: ${templateDir}`))
    process.exit(1)
  }

  console.log(`Copying files from template...\n`)
  copyRecursiveSync(templateDir, root)

  // Rename gitignore to .gitignore (NPM strips out .gitignore when publishing the template)
  const gitignorePath = path.join(root, 'gitignore')
  if (fs.existsSync(gitignorePath)) {
    fs.renameSync(gitignorePath, path.join(root, '.gitignore'))
  }

  // 2. Adjust package.json
  const packageJsonPath = path.join(root, 'package.json')
  let packageJson = {}
  if (fs.existsSync(packageJsonPath)) {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  }

  packageJson.name = appName
  packageJson.version = '0.1.0'
  packageJson.private = true

  // Adjust versions based on channel
  const isCanary = channel === 'Canary'
  const versionTag = isCanary ? 'canary' : 'latest'

  let ryunixVersion = versionTag
  let presetsVersion = versionTag

  const pkgManager = getPkgManager()

  let viewCmd = 'npm view'
  if (pkgManager === 'yarn') {
    viewCmd = 'yarn info'
  } else if (pkgManager === 'pnpm') {
    viewCmd = 'pnpm view'
  } else if (pkgManager === 'bun') {
    // bun doesn't natively have a view command that returns just the version easily, fallback to npm view 
    viewCmd = 'npm view'
  }

  try {
    const { stdout: ryunixStdout } = await exec(`${viewCmd} @unsetsoft/ryunixjs@${versionTag} version`)
    const { stdout: presetsStdout } = await exec(`${viewCmd} @unsetsoft/ryunix-presets@${versionTag} version`)
    ryunixVersion = '^' + ryunixStdout.trim()
    presetsVersion = '^' + presetsStdout.trim()
  } catch (error) {
    // Fallback to the tag if npm view fails
    console.warn(pc.yellow(`\nWarning: Could not fetch exact versions for ${versionTag}. Using tag instead.`))
  }

  packageJson.dependencies = packageJson.dependencies || {}
  packageJson.devDependencies = packageJson.devDependencies || {}

  packageJson.dependencies['@unsetsoft/ryunixjs'] = ryunixVersion
  packageJson.devDependencies['@unsetsoft/ryunix-presets'] = presetsVersion

  if (tailwind) {
    packageJson.devDependencies['tailwindcss'] = '^4.0.0'
    packageJson.devDependencies['@tailwindcss/postcss'] = '^4.0.0'
    packageJson.devDependencies['postcss'] = '^8.4.35'
  }

  if (eslint) {
    packageJson.devDependencies['eslint'] = '^8.57.0'
    packageJson.devDependencies['eslint-plugin-react'] = '^7.34.0'
    packageJson.devDependencies['eslint-plugin-react-hooks'] = '^4.6.0'
  }


  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

  // 3. Apply Optional Features
  // Features are already pre-applied in the specialized templates


  // 4. Update ryunix.config.js with the selected compiler
  const configPath = path.join(root, 'ryunix.config.js')
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8')
    // Add compiler to the config object
    if (configContent.includes('const RyunixSettings = {')) {
      configContent = configContent.replace('const RyunixSettings = {', `const RyunixSettings = {\n  compiler: '${compiler}',`)
    }
    fs.writeFileSync(configPath, configContent)
  }

  // Create vscode workspace settings if requested
  if (vscode) {
    const vscodeDir = path.join(root, '.vscode')
    if (!fs.existsSync(vscodeDir)) fs.mkdirSync(vscodeDir)
    const extensionsJson = { recommendations: ["unsetsoft.ryunixjs"] }
    fs.writeFileSync(path.join(vscodeDir, 'extensions.json'), JSON.stringify(extensionsJson, null, 2))
  }

  // 4. Install Dependencies


  // 5. Initialize Git
  if (tryGitInit(root)) {
    console.log(`\n${pc.green('Initialized a git repository.')}`)
  }

  // 6. Print Success Message
  console.log(`\n${pc.green('Success!')} Created ${appName}`)
  console.log('Inside that directory, you can run several commands:\\n')
  console.log(pc.cyan(`  ${pkgManager} run dev`))
  console.log('    Starts the development server.\\n')
  console.log(pc.cyan(`  ${pkgManager} run build`))
  console.log('    Builds the app for production.\\n')
  console.log(pc.cyan(`  ${pkgManager} start`))
  console.log('    Runs the built app in production mode.\\n')
  console.log('We suggest that you begin by typing:\\n')
  console.log(pc.cyan('  cd'), appName)
  console.log(pc.cyan(`  ${pkgManager} install`))
  console.log(pc.cyan(`  ${pkgManager} run dev\n`))
}

module.exports = { createApp }
