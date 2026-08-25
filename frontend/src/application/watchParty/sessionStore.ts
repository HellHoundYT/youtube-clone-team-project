export interface WatchPartySessionStore {
  getSessionId(): string

  getUserName(): string

  saveUserName(
    userName: string,
  ): void

  markHostRoom(
    roomCode: string,
  ): void

  isHostRoom(
    roomCode: string,
  ): boolean

  removeHostRoom(
    roomCode: string,
  ): void
}
