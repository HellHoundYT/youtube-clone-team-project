export interface LiveChatMessage {
  id: string
  streamId: string
  userId: string | null
  userName: string
  message: string
  sentAt: string
}

export type LiveChatConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'

export interface LiveChatClientOptions {
  onMessage: (
    message: LiveChatMessage,
  ) => void

  onStatusChange: (
    status: LiveChatConnectionStatus,
  ) => void

  onError?: (
    message: string,
  ) => void
}
