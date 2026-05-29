/**
 * Client proxy for a compiled server action.
 */
export function createActionProxy(actionId: string) {
  return async function (...args: unknown[]): Promise<unknown> {
    const response = await fetch('/_ryunix/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ryunix-Action': 'true',
      },
      body: JSON.stringify({ actionId, args }),
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: string
      }
      throw new Error(errorData.error || 'Server Action failed')
    }

    return response.json()
  }
}
