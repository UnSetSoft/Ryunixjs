declare module 'prompts' {
  type PromptObject = Record<string, unknown>
  type PromptsOptions = {
    onSubmit?: (...args: unknown[]) => void
    onCancel?: () => void
  }
  type PromptsFunction = (
    questions: PromptObject | PromptObject[],
    options?: PromptsOptions,
  ) => Promise<Record<string, unknown>>
  const prompts: PromptsFunction
  export default prompts
}

declare module 'cross-spawn' {
  import type { ChildProcess, SpawnOptions } from 'node:child_process'
  function spawn(
    command: string,
    args?: readonly string[],
    options?: SpawnOptions,
  ): ChildProcess
  export default spawn
}
