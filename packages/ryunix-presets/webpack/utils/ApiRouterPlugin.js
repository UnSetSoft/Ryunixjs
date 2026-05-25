import fs from 'fs'
import path from 'path'
import { transformSync } from '@swc/core'
/**
 * Valid API route file names
 */
const API_FILE_NAMES = [
  'route.js',
  'route.ts',
  'route.ryx',
  'router.js',
  'router.ts',
  'router.ryx',
  'endpoint.js',
  'endpoint.ts',
]
class ApiRouterPlugin {
  appDir
  outputPath
  debug
  constructor(options = {}) {
    this.appDir = options.appDir || 'src/app'
    this.outputPath = options.outputPath || '.ryunix/server/api'
    this.debug = options.debug || false
  }
  apply(compiler) {
    let lastScanTime = 0
    let isWatching = false
    let watcher = null
    compiler.hooks.watchRun.tapAsync('ApiRouterPlugin', (comp, callback) => {
      isWatching = true
      callback()
    })
    compiler.hooks.beforeCompile.tapAsync(
      'ApiRouterPlugin',
      (params, callback) => {
        const appDirPath = path.resolve(process.cwd(), this.appDir)
        const apiDirPath = path.join(appDirPath, 'api')
        if (!fs.existsSync(apiDirPath)) {
          if (this.debug)
            console.log(`[ApiRouter] No api directory found at ${apiDirPath}`)
          callback()
          return
        }
        // Add api directory to webpack's context dependencies so it detects new files/folders
        if (params && params.compilationDependencies) {
          params.contextDependencies.add(apiDirPath)
        }
        try {
          this.compileApiRoutes(
            apiDirPath,
            path.resolve(process.cwd(), this.outputPath),
          )
        } catch (error) {
          console.error('[ApiRouter] ❌ ERROR compiling api routes:', error)
        }
        callback()
      },
    )
    compiler.hooks.afterCompile.tapAsync(
      'ApiRouterPlugin',
      (compilation, callback) => {
        const appDirPath = path.resolve(process.cwd(), this.appDir)
        const apiDirPath = path.join(appDirPath, 'api')
        if (fs.existsSync(apiDirPath)) {
          compilation.contextDependencies.add(apiDirPath)
        }
        callback()
      },
    )
  }
  compileApiRoutes(sourceDir, outDir) {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true })
    }
    const compileDirectory = (currentDir, currentOutDir) => {
      if (!fs.existsSync(currentOutDir)) {
        fs.mkdirSync(currentOutDir, { recursive: true })
      }
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        const sourcePath = path.join(currentDir, entry.name)
        if (entry.isDirectory()) {
          compileDirectory(sourcePath, path.join(currentOutDir, entry.name))
        } else if (entry.isFile() && API_FILE_NAMES.includes(entry.name)) {
          this.compileFile(sourcePath, currentOutDir, entry.name)
        }
      }
    }
    compileDirectory(sourceDir, outDir)
  }
  compileFile(sourcePath, currentOutDir, fileName) {
    try {
      const content = fs.readFileSync(sourcePath, 'utf8')
      const isTs = fileName.endsWith('.ts')
      const isRyx = fileName.endsWith('.ryx')
      const { code } = transformSync(content, {
        filename: fileName,
        jsc: {
          parser: {
            syntax: isTs ? 'typescript' : 'ecmascript',
            jsx: isRyx || true,
          },
          target: 'es2022',
          transform: {
            react: {
              pragma: 'Ryunix.createElement',
              pragmaFrag: 'Ryunix.Fragment',
            },
          },
        },
        module: {
          type: 'es6',
        },
      })
      // Always output as .mjs for native Node ESM support
      const outFileName = fileName.replace(/\.(ts|ryx|js)$/, '.js')
      const outFilePath = path.join(currentOutDir, outFileName)
      // Only write if changed to avoid unnecessary reloads
      let shouldWrite = true
      if (fs.existsSync(outFilePath)) {
        const existing = fs.readFileSync(outFilePath, 'utf8')
        if (existing === code) shouldWrite = false
      }
      if (shouldWrite) {
        if (this.debug)
          console.log(`[ApiRouter] Compiled: ${sourcePath} -> ${outFilePath}`)
        fs.writeFileSync(outFilePath, code)
      }
    } catch (e) {
      console.error(`[ApiRouter] Error compiling ${sourcePath}:`, e.message)
    }
  }
}
export default ApiRouterPlugin
