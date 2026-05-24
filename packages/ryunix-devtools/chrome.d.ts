/** Minimal Chrome extension APIs used by Ryunix DevTools. */
declare const chrome: {
  runtime: {
    onMessage: {
      addListener(
        callback: (
          message: Record<string, unknown>,
          sender: unknown,
          sendResponse: (response?: unknown) => void,
        ) => boolean | void,
      ): void
    }
  }
  tabs: {
    query(
      queryInfo: { active?: boolean; currentWindow?: boolean },
      callback: (tabs: Array<{ id?: number }>) => void,
    ): void
    sendMessage(tabId: number, message: unknown): void
  }
}
