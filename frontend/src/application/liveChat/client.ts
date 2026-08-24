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
}

export interface LiveChatClientFactory {
  create(
    streamId: string,
    options: LiveChatClientOptions,
  ): LiveChatClient
}
