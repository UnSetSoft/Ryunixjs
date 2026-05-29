export type MessageTree = string | MessageTreeRecord
export type MessageTreeRecord = { [key: string]: MessageTree }
export type MessagesByLocale = Record<string, MessageTreeRecord>

/** Identity helper for message dictionaries (IDE autocomplete friendly). */
export function defineMessages<T extends MessagesByLocale>(messages: T): T {
  return messages
}

export function resolveMessageKey(
  tree: MessageTreeRecord | undefined,
  key: string,
): string | undefined {
  if (!tree) return undefined
  const parts = key.split('.')
  let node: MessageTree | undefined = tree
  for (const part of parts) {
    if (node == null || typeof node === 'string') return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

export function formatMessage(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template
  return Object.entries(params).reduce(
    (value, [name, replacement]) =>
      value.replace(
        new RegExp(`\\{${escapeRegExp(name)}\\}`, 'g'),
        String(replacement),
      ),
    template,
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
