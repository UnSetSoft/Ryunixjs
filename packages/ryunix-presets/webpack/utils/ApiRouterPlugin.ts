import fs from 'fs'
import path from 'path'
import { transformSync } from '@swc/core'
import type { Compiler, Compilation } from 'webpack'

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
  appDir: string
  outputPath: string
  debug: boolean

  constructor(
    options: { appDir?: string; outputPath?: string; debug?: boolean } = {},
  ) {
    this.appDir = options.appDir || 'src/app'
    this.outputPath = options.outputPath || '.ryunix/server/api'
    this.debug = options.debug || false
  }

  apply(compiler: Compiler) {
    compiler.hooks.watchRun.tapAsync('ApiRouterPlugin', (_comp, callback) => {
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
        const compileParams = params as {
          contextDependencies?: { add: (path: string) => void }
        }
        if (compileParams.contextDependencies) {
          compileParams.contextDependencies.add(apiDirPath)
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
      (compilation: Compilation, callback) => {
        const appDirPath = path.resolve(process.cwd(), this.appDir)
        const apiDirPath = path.join(appDirPath, 'api')
        if (fs.existsSync(apiDirPath)) {
          compilation.contextDependencies.add(apiDirPath)
        }
        callback()
      },
    )
  }

  compileApiRoutes(sourceDir: string, outDir: string) {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true })
    }

    const compileDirectory = (currentDir: string, currentOutDir: string) => {
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

  compileFile(sourcePath: string, currentOutDir: string, fileName: string) {
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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.error(`[ApiRouter] Error compiling ${sourcePath}:`, message)
    }
  }
}

export default ApiRouterPlugin
