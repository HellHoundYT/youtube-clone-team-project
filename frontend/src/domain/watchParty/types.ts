export interface WatchPartyParticipant {
  userId: string | null
  userName: string
  isHost: boolean
  joinedAt: string
}

export interface WatchPartyMessage {
  id: string
  roomCode: string
  userId: string | null
  userName: string
  message: string
  sentAt: string
}

export interface WatchPartyPlayback {
  roomCode: string
  currentVideoId: string | null
  currentTime: number
  isPlaying: boolean
  updatedAt: string
}

export interface WatchPartyRoomState {
  roomId: string
  roomCode: string
  currentVideoId: string | null
  currentTime: number
  isPlaying: boolean
  updatedAt: string
  participants: WatchPartyParticipant[]
  messages: WatchPartyMessage[]
}
