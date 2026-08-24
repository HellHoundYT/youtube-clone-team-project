import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import type {
  LiveChatClient,
  LiveChatClientFactory,
} from '../../application/liveChat/client'
import type {
  LiveChatClientOptions,
  LiveChatMessage,
} from '../../application/liveChat/types'

export const liveChatClientFactory:
LiveChatClientFactory = {
  create(
    streamId: string,
    options: LiveChatClientOptions,
  ): LiveChatClient {
    const connection =
      new HubConnectionBuilder()
        .withUrl(
          '/hubs/live-chat',
        )
        .withAutomaticReconnect([
          0,
          2000,
          5000,
          10000,
        ])
        .configureLogging(
          LogLevel.Warning,
        )
        .build()

    connection.on(
      'ReceiveMessage',
      (
        message:
          LiveChatMessage,
      ) => {
        options.onMessage(
          message,
        )
      },
    )

    connection.onreconnecting(
      () => {
        options.onStatusChange(
          'reconnecting',
        )
      },
    )

    connection.onreconnected(
      async () => {
        try {
          await connection.invoke(
            'JoinStream',
            streamId,
          )

          options.onStatusChange(
            'connected',
          )
        } catch (
          error
        ) {
          console.error(
            error,
          )

          options.onStatusChange(
            'disconnected',
          )

          options.onError?.(
            'Could not rejoin the live chat.',
          )
        }
      },
    )

    connection.onclose(
      () => {
        options.onStatusChange(
          'disconnected',
        )
      },
    )

    return {
      async start() {
        await connection.start()

        await connection.invoke(
          'JoinStream',
          streamId,
        )
      },

      async stop() {
        try {
          if (
            connection.state ===
            HubConnectionState.Connected
          ) {
            await connection.invoke(
              'LeaveStream',
              streamId,
            )
          }
        } catch (
          error
        ) {
          console.error(
            error,
          )
        }

        await connection.stop()
      },

      async send(
        userName: string,
        message: string,
      ) {
        if (
          connection.state !==
          HubConnectionState.Connected
        ) {
          throw new Error(
            'Live chat is not connected.',
          )
        }

        await connection.invoke(
          'SendMessage',
          streamId,
          userName,
          message,
        )
      },
    }
  },
}
