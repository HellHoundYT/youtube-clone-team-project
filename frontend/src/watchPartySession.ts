const watchPartySessionStorageKey =
  'amtlis.watchParty.sessionId'

const watchPartyNameStorageKey =
  'amtlis.watchParty.userName'

const watchPartyHostRoomsStorageKey =
  'amtlis.watchParty.hostRooms'

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

function getHostRooms() {
  const raw =
    window.localStorage.getItem(
      watchPartyHostRoomsStorageKey,
    )

  if (!raw) {
    return new Set<string>()
  }

  try {
    const parsed =
      JSON.parse(
        raw,
      )

    if (!Array.isArray(parsed)) {
      return new Set<string>()
    }

    return new Set(
      parsed
        .filter(
          (
            value,
          ): value is string =>
            typeof value ===
            'string',
        )
        .map(
          (value) =>
            value
              .trim()
              .toUpperCase(),
        ),
    )
  } catch {
    return new Set<string>()
  }
}

function saveHostRooms(
  rooms: Set<string>,
) {
  window.localStorage.setItem(
    watchPartyHostRoomsStorageKey,
    JSON.stringify(
      Array.from(rooms),
    ),
  )
}

export function markWatchPartyHostRoom(
  roomCode: string,
) {
  const normalized =
    roomCode
      .trim()
      .toUpperCase()

  if (!normalized) {
    return
  }

  const rooms =
    getHostRooms()

  rooms.add(
    normalized,
  )

  saveHostRooms(
    rooms,
  )
}

export function isWatchPartyHostRoom(
  roomCode: string,
) {
  return getHostRooms()
    .has(
      roomCode
        .trim()
        .toUpperCase(),
    )
}

export function removeWatchPartyHostRoom(
  roomCode: string,
) {
  const rooms =
    getHostRooms()

  rooms.delete(
    roomCode
      .trim()
      .toUpperCase(),
  )

  saveHostRooms(
    rooms,
  )
}