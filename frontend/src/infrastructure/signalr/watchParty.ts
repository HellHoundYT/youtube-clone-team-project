import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr'

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

export type WatchPartyConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'

interface WatchPartyConnectionOptions {
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

export function createWatchPartyConnection(
  options: WatchPartyConnectionOptions,
): HubConnection {
  const connection =
    new HubConnectionBuilder()
      .withUrl(
        '/hubs/watch-party',
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
    'ParticipantsChanged',
    (
      participants:
        WatchPartyParticipant[],
    ) => {
      options.onParticipantsChanged?.(
        participants,
      )
    },
  )

  connection.on(
    'VideoChanged',
    (
      playback:
        WatchPartyPlayback,
    ) => {
      options.onVideoChanged?.(
        playback,
      )
    },
  )

  connection.on(
    'PlaybackChanged',
    (
      playback:
        WatchPartyPlayback,
    ) => {
      options.onPlaybackChanged?.(
        playback,
      )
    },
  )

  connection.on(
    'ReceiveWatchPartyMessage',
    (
      message:
        WatchPartyMessage,
    ) => {
      options.onMessage?.(
        message,
      )
    },
  )

  connection.on(
    'RoomClosed',
    (
      roomCode: string,
    ) => {
      options.onRoomClosed?.(
        roomCode,
      )
    },
  )

  connection.onreconnecting(
    () => {
      options.onStatusChange?.(
        'reconnecting',
      )
    },
  )

  connection.onreconnected(
    async () => {
      try {
        await options.onReconnected?.()

        options.onStatusChange?.(
          'connected',
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        options.onError?.(
          'Could not rejoin the Watch Party room.',
        )
      }
    },
  )

  connection.onclose(
    () => {
      options.onStatusChange?.(
        'disconnected',
      )
    },
  )

  return connection
}

export async function startWatchPartyConnection(
  connection: HubConnection,
) {
  if (
    connection.state !==
    HubConnectionState.Disconnected
  ) {
    return
  }

  await connection.start()
}

export async function stopWatchPartyConnection(
  connection: HubConnection,
) {
  if (
    connection.state ===
    HubConnectionState.Disconnected
  ) {
    return
  }

  await connection.stop()
}

export async function createWatchPartyRoom(
  connection: HubConnection,
  hostSessionId: string,
  hostName: string,
  initialVideoId?: string | null,
) {
  return connection.invoke<
    WatchPartyRoomState
  >(
    'CreateRoom',
    hostSessionId,
    hostName,
    initialVideoId ?? null,
  )
}

export async function joinWatchPartyRoom(
  connection: HubConnection,
  roomCode: string,
  sessionId: string,
  userName: string,
) {
  return connection.invoke<
    WatchPartyRoomState
  >(
    'JoinRoom',
    roomCode,
    sessionId,
    userName,
  )
}

export async function getWatchPartyRoomState(
  connection: HubConnection,
  roomCode: string,
) {
  return connection.invoke<
    WatchPartyRoomState
  >(
    'GetRoomState',
    roomCode,
  )
}

export async function leaveWatchPartyRoom(
  connection: HubConnection,
  roomCode: string,
  sessionId: string,
) {
  await connection.invoke(
    'LeaveRoom',
    roomCode,
    sessionId,
  )
}

export async function closeWatchPartyRoom(
  connection: HubConnection,
  roomCode: string,
  hostSessionId: string,
) {
  await connection.invoke(
    'CloseRoom',
    roomCode,
    hostSessionId,
  )
}

export async function setWatchPartyVideo(
  connection: HubConnection,
  roomCode: string,
  hostSessionId: string,
  videoId: string,
) {
  return connection.invoke<
    WatchPartyPlayback
  >(
    'SetVideo',
    roomCode,
    hostSessionId,
    videoId,
  )
}

export async function setWatchPartyPlayback(
  connection: HubConnection,
  roomCode: string,
  hostSessionId: string,
  currentTime: number,
  isPlaying: boolean,
) {
  return connection.invoke<
    WatchPartyPlayback
  >(
    'SetPlaybackState',
    roomCode,
    hostSessionId,
    currentTime,
    isPlaying,
  )
}

export async function sendWatchPartyMessage(
  connection: HubConnection,
  roomCode: string,
  sessionId: string,
  message: string,
) {
  return connection.invoke<
    WatchPartyMessage
  >(
    'SendMessage',
    roomCode,
    sessionId,
    message,
  )
}