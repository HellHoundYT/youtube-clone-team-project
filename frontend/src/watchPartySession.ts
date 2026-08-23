const watchPartySessionStorageKey =
  'amtlis.watchParty.sessionId'

const watchPartyNameStorageKey =
  'amtlis.watchParty.userName'

export function getWatchPartySessionId() {
  const existing =
    window.localStorage.getItem(
      watchPartySessionStorageKey,
    )

  if (existing) {
    return existing
  }

  const sessionId =
    crypto.randomUUID()

  window.localStorage.setItem(
    watchPartySessionStorageKey,
    sessionId,
  )

  return sessionId
}

export function getWatchPartyUserName() {
  return (
    window.localStorage.getItem(
      watchPartyNameStorageKey,
    ) ?? ''
  )
}

export function saveWatchPartyUserName(
  userName: string,
) {
  const normalized =
    userName.trim()

  if (!normalized) {
    window.localStorage.removeItem(
      watchPartyNameStorageKey,
    )

    return
  }

  window.localStorage.setItem(
    watchPartyNameStorageKey,
    normalized,
  )
}