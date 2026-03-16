const path = require('path')
const fs = require('fs')
const pc = require('picocolors')
const { getPkgManager } = require('./helpers/get-pkg-manager')
const { isFolderEmpty } = require('./helpers/is-folder-empty')
const { copyRecursiveSync } = require('./helpers/copy')
const { install } = require('./helpers/install')
const { tryGitInit } = require('./helpers/git')
const { enableTailwind } = require('./features/tailwind')
const { enableEslint } = require('./features/eslint')

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
  const templateDir = path.resolve(__dirname, '..', 'templates', 'Webpack')
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

  packageJson.dependencies = packageJson.dependencies || {}
  packageJson.devDependencies = packageJson.devDependencies || {}

  packageJson.dependencies['@unsetsoft/ryunixjs'] = versionTag
  packageJson.devDependencies['@unsetsoft/ryunix-presets'] = versionTag

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
  if (tailwind) enableTailwind(root)
  if (eslint) enableEslint(root)

  // 4. Update ryunix.config.js with the selected compiler
  const configPath = path.join(root, 'ryunix.config.js')
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8')
    // Add compiler to the config object
    if (configContent.includes('module.exports = {')) {
      configContent = configContent.replace('module.exports = {', `module.exports = {\n  compiler: '${compiler}',`)
    } else if (configContent.includes('export default {')) {
      configContent = configContent.replace('export default {', `export default {\n  compiler: '${compiler}',`)
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
  const pkgManager = getPkgManager()
  console.log(`Installing dependencies using ${pkgManager}...`)
  try {
    await install(pkgManager, root)
  } catch (err) {
    console.error(pc.red(`\nFailed to install dependencies.\n`))
    console.error(err)
    process.exit(1)
  }

  // 5. Initialize Git
  if (tryGitInit(root)) {
    console.log(`\n${pc.green('Initialized a git repository.')}`)
  }

  // 6. Print Success Message
  console.log(`\n${pc.green('Success!')} Created ${appName} at ${appPath}`)
  console.log('Inside that directory, you can run several commands:\\n')
  console.log(pc.cyan(`  ${pkgManager} run dev`))
  console.log('    Starts the development server.\\n')
  console.log(pc.cyan(`  ${pkgManager} run build`))
  console.log('    Builds the app for production.\\n')
  console.log(pc.cyan(`  ${pkgManager} start`))
  console.log('    Runs the built app in production mode.\\n')
  console.log('We suggest that you begin by typing:\\n')
  console.log(pc.cyan('  cd'), appName)
  console.log(pc.cyan(`  ${pkgManager} run dev\n`))
}

module.exports = { createApp }
