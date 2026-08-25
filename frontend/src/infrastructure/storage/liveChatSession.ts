import type {
  LiveChatSessionStore,
} from '../../application/liveChat/sessionStore'

const storageKey =
  'amtlis.liveChat.sessionId'

export const liveChatSessionStore:
LiveChatSessionStore = {
  getSessionId() {
    const existing =
      window.localStorage.getItem(
        storageKey,
      )

    if (existing) {
      return existing
    }

    const sessionId =
      crypto.randomUUID()

    window.localStorage.setItem(
      storageKey,
      sessionId,
    )

    return sessionId
  },
}