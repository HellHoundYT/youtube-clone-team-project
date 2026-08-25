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
  LiveChatDeleteResult,
  LiveChatMessage,
  LiveChatReactionUpdate,
} from '../../application/liveChat/types'

function retryDelay(
  previousRetryCount: number,
) {
  const exponent =
    Math.min(
      previousRetryCount,
      3,
    )

  return Math.min(
    10000,
    1000 * (2 ** exponent),
  )
}

export const liveChatClientFactory:
LiveChatClientFactory = {
  create(
    streamId: string,
    sessionId: string,
    options: LiveChatClientOptions,
  ): LiveChatClient {
    const connection =
      new HubConnectionBuilder()
        .withUrl(
          '/hubs/live-chat',
        )
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds:
            (context) =>
              retryDelay(
                context.previousRetryCount,
              ),
        })
        .configureLogging(
          LogLevel.Warning,
        )
        .build()

    const joinStream =
      async () => {
        const snapshot =
          await connection.invoke<
            LiveChatMessage[]
          >(
            'JoinStream',
            streamId,
            sessionId,
          )

        options.onSnapshot(
          snapshot,
        )
      }

    connection.on(
      'MessageAdded',
      (
        message:
          LiveChatMessage,
      ) => {
        options.onMessageAdded(
          message,
        )
      },
    )

    connection.on(
      'MessageUpdated',
      (
        message:
          LiveChatMessage,
      ) => {
        options.onMessageUpdated(
          message,
        )
      },
    )

    connection.on(
      'MessagesDeleted',
      (
        result:
          LiveChatDeleteResult,
      ) => {
        options.onMessagesDeleted(
          result.messageIds,
        )
      },
    )

    connection.on(
      'ReactionUpdated',
      (
        update:
          LiveChatReactionUpdate,
      ) => {
        options.onReactionUpdated(
          update,
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
          await joinStream()

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

        await joinStream()
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

        const created =
          await connection.invoke<
            LiveChatMessage
          >(
            'SendMessage',
            streamId,
            sessionId,
            userName,
            message,
          )

        options.onMessageAdded(
          created,
        )
      },

      async edit(
        messageId: string,
        message: string,
      ) {
        const updated =
          await connection.invoke<
            LiveChatMessage
          >(
            'EditMessage',
            streamId,
            sessionId,
            messageId,
            message,
          )

        options.onMessageUpdated(
          updated,
        )
      },

      async delete(
        messageId: string,
      ) {
        const result =
          await connection.invoke<
            LiveChatDeleteResult
          >(
            'DeleteMessage',
            streamId,
            sessionId,
            messageId,
          )

        options.onMessagesDeleted(
          result.messageIds,
        )
      },

      async reply(
        parentMessageId: string,
        userName: string,
        message: string,
      ) {
        const created =
          await connection.invoke<
            LiveChatMessage
          >(
            'ReplyToMessage',
            streamId,
            sessionId,
            userName,
            parentMessageId,
            message,
          )

        options.onMessageAdded(
          created,
        )
      },

      async toggleReaction(
        messageId: string,
        emoji: string,
      ) {
        const update =
          await connection.invoke<
            LiveChatReactionUpdate
          >(
            'ToggleReaction',
            streamId,
            sessionId,
            messageId,
            emoji,
          )

        options.onReactionUpdated(
          update,
        )
      },
    }
  },
}