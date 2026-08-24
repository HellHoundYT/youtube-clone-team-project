import type {
  WatchPartySessionStore,
} from '../../application/watchParty/sessionStore'

const watchPartySessionStorageKey =
  'amtlis.watchParty.sessionId'

const watchPartyNameStorageKey =
  'amtlis.watchParty.userName'

const watchPartyHostRoomsStorageKey =
  'amtlis.watchParty.hostRooms'

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
      Array.from(
        rooms,
      ),
    ),
  )
}

export const watchPartySessionStore:
WatchPartySessionStore = {
  getSessionId() {
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
  },

  getUserName() {
    return (
      window.localStorage.getItem(
        watchPartyNameStorageKey,
      ) ?? ''
    )
  },

  saveUserName(
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
  },

  markHostRoom(
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
  },

  isHostRoom(
    roomCode: string,
  ) {
    return getHostRooms()
      .has(
        roomCode
          .trim()
          .toUpperCase(),
      )
  },

  removeHostRoom(
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
  },
}
