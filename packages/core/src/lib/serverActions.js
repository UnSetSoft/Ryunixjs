/**
 * Client proxy for a compiled server action.
 * @param {string} actionId - Build-time action identifier
 * @returns {(...args: unknown[]) => Promise<unknown>}
 */
export function createActionProxy(actionId) {
  return async function (...args) {
    const response = await fetch('/_ryunix/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ryunix-Action': 'true',
      },
      body: JSON.stringify({ actionId, args }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Server Action failed')
    }

    return response.json()
  }
}
