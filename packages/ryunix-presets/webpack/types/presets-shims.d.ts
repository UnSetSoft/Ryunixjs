declare module 'yargs' {
  interface Argv {
    command(
      command: string | Record<string, unknown>,
      description?: string,
      builder?: Record<string, unknown>,
      handler?: (args: Record<string, unknown>) => void | Promise<void>,
    ): Argv
    option(key: string, options?: Record<string, unknown>): Argv
    parse(): Promise<Record<string, unknown>>
    [key: string]: unknown
  }

  function yargs(args?: readonly string[]): Argv
  export default yargs
}

declare module 'yargs/helpers' {
  export function hideBin(argv: string[]): string[]
}

declare module '@babel/core' {
  export interface TransformResult {
    code: string | null
    map: unknown
    ast: unknown
  }

  export interface TransformOptions {
    filename?: string
    plugins?: unknown[]
    [key: string]: unknown
  }

  export function transformAsync(
    code: string,
    opts?: TransformOptions,
  ): Promise<TransformResult | null>
}

declare module 'dotenv-webpack' {
  import type { WebpackPluginInstance } from 'webpack'

  interface DotenvOptions {
    path?: string
    prefix?: string
    systemvars?: boolean
    ignoreStub?: boolean
    [key: string]: unknown
  }

  export default class Dotenv implements WebpackPluginInstance {
    constructor(options?: DotenvOptions)
    apply(compiler: import('webpack').Compiler): void
  }
}

declare module 'terminal-log' {
  const logger: {
    error: (...args: unknown[]) => void
    info: (...args: unknown[]) => void
    warn: (...args: unknown[]) => void
  }
  export default logger
}

declare module 'boxen' {
  interface BoxenOptions {
    padding?: number
    margin?: number
    borderStyle?: string
    borderColor?: string
    minimumWidth?: number
    title?: string
    titleAlignment?: string
    [key: string]: unknown
  }
  export default function boxen(text: string, options?: BoxenOptions): string
}
