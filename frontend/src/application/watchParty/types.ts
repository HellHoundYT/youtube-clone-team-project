import type {
  WatchPartyMessage,
  WatchPartyParticipant,
  WatchPartyPlayback,
} from '../../domain/watchParty/types'

export type WatchPartyConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'

export interface WatchPartyClientOptions {
  onParticipantsChanged?: (
    participants: WatchPartyParticipant[],
  ) => void

  onVideoChanged?: (
    playback: WatchPartyPlayback,
  ) => void

  onPlaybackChanged?: (
    playback: WatchPartyPlayback,
  ) => void

  onMessage?: (
    message: WatchPartyMessage,
  ) => void

  onRoomClosed?: (
    roomCode: string,
  ) => void

  onStatusChange?: (
    status: WatchPartyConnectionStatus,
  ) => void

  onError?: (
    message: string,
  ) => void

  onReconnected?: (
  ) => void | Promise<void>
}
