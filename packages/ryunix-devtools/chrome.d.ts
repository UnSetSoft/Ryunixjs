/** Minimal Chrome extension APIs used by Ryunix DevTools. */

interface RyunixDevtoolsRuntimeMessage {
  source?: string
  payload?: {
    event?: string
    data?: unknown
  }
  [key: string]: unknown
}

declare const chrome: {
  runtime: {
    onMessage: {
      addListener(
        callback: (
          message: RyunixDevtoolsRuntimeMessage,
          sender: unknown,
          sendResponse: (response?: unknown) => void,
        ) => boolean | void,
      ): void
    }
    sendMessage(message: unknown): Promise<void>
    getURL(path: string): string
  }
  tabs: {
    query(
      queryInfo: { active?: boolean; currentWindow?: boolean },
      callback: (tabs: Array<{ id?: number }>) => void,
    ): void
    sendMessage(tabId: number, message: unknown): void
  }
  devtools: {
    panels: {
      create(
        title: string,
        iconPath: string,
        pagePath: string,
        callback: (panel: unknown) => void,
      ): void
    }
  }
}
