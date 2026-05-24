declare module 'yargs/helpers' {
  export function hideBin(argv: string[]): string[]
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
    [key: string]: unknown
  }
  export default function boxen(text: string, options?: BoxenOptions): string
}

export {}
