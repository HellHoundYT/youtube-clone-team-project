import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr'

export type LiveChatConnection = HubConnection

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

interface LiveChatConnectionOptions {
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

export function createLiveChatConnection(
  streamId: string,
  options: LiveChatConnectionOptions,
): HubConnection {
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

  return connection
}

export async function startLiveChatConnection(
  connection: HubConnection,
  streamId: string,
) {
  await connection.start()

  await connection.invoke(
    'JoinStream',
    streamId,
  )
}

export async function stopLiveChatConnection(
  connection: HubConnection,
  streamId: string,
) {
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
}

export async function sendLiveChatMessage(
  connection: HubConnection,
  streamId: string,
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
}