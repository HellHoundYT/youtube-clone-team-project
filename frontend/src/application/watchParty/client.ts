import type {
  WatchPartyMessage,
  WatchPartyPlayback,
  WatchPartyRoomState,
} from '../../domain/watchParty/types'
import type {
  WatchPartyClientOptions,
} from './types'

export interface WatchPartyClient {
  start(): Promise<void>

  stop(): Promise<void>

  createRoom(
    hostSessionId: string,
    hostName: string,
    initialVideoId?: string | null,
  ): Promise<WatchPartyRoomState>

  joinRoom(
    roomCode: string,
    sessionId: string,
    userName: string,
  ): Promise<WatchPartyRoomState>

  getRoomState(
    roomCode: string,
  ): Promise<WatchPartyRoomState>

  leaveRoom(
    roomCode: string,
    sessionId: string,
  ): Promise<void>

  closeRoom(
    roomCode: string,
    hostSessionId: string,
  ): Promise<void>

  setVideo(
    roomCode: string,
    hostSessionId: string,
    videoId: string,
  ): Promise<WatchPartyPlayback>

  setPlayback(
    roomCode: string,
    hostSessionId: string,
    currentTime: number,
    isPlaying: boolean,
  ): Promise<WatchPartyPlayback>

  sendMessage(
    roomCode: string,
    sessionId: string,
    message: string,
  ): Promise<WatchPartyMessage>
}

export interface WatchPartyClientFactory {
  create(
    options: WatchPartyClientOptions,
  ): WatchPartyClient
}
