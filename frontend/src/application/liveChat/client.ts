import type {
  LiveChatClientOptions,
} from './types'

export interface LiveChatClient {
  start(): Promise<void>

  stop(): Promise<void>

  send(
    userName: string,
    message: string,
  ): Promise<void>

  edit(
    messageId: string,
    message: string,
  ): Promise<void>

  delete(
    messageId: string,
  ): Promise<void>

  reply(
    parentMessageId: string,
    userName: string,
    message: string,
  ): Promise<void>

  toggleReaction(
    messageId: string,
    emoji: string,
  ): Promise<void>
}

export interface LiveChatClientFactory {
  create(
    streamId: string,
    sessionId: string,
    options: LiveChatClientOptions,
  ): LiveChatClient
}