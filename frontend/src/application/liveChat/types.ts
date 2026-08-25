export interface LiveChatReaction {
  emoji: string
  count: number
  reactedByCurrentSession:
    | boolean
    | null
}

export interface LiveChatMessage {
  id: string
  streamId: string
  userId: string | null
  userName: string
  message: string
  parentMessageId: string | null
  sentAt: string
  editedAt: string | null
  isOwn: boolean
  reactions: LiveChatReaction[]
}

export interface LiveChatReactionUpdate {
  messageId: string
  emoji: string
  count: number
  reactedByCurrentSession:
    | boolean
    | null
}

export interface LiveChatDeleteResult {
  messageIds: string[]
}

export type LiveChatConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'

export interface LiveChatClientOptions {
  onSnapshot: (
    messages: LiveChatMessage[],
  ) => void

  onMessageAdded: (
    message: LiveChatMessage,
  ) => void

  onMessageUpdated: (
    message: LiveChatMessage,
  ) => void

  onMessagesDeleted: (
    messageIds: string[],
  ) => void

  onReactionUpdated: (
    update: LiveChatReactionUpdate,
  ) => void

  onStatusChange: (
    status: LiveChatConnectionStatus,
  ) => void

  onError?: (
    message: string,
  ) => void
}