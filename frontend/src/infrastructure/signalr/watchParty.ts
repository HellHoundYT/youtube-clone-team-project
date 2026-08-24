import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import type {
  WatchPartyClient,
  WatchPartyClientFactory,
} from '../../application/watchParty/client'
import type {
  WatchPartyClientOptions,
} from '../../application/watchParty/types'
import type {
  WatchPartyMessage,
  WatchPartyParticipant,
  WatchPartyPlayback,
  WatchPartyRoomState,
} from '../../domain/watchParty/types'

export const watchPartyClientFactory:
WatchPartyClientFactory = {
  create(
    options: WatchPartyClientOptions,
  ): WatchPartyClient {
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

    return {
      async start() {
        if (
          connection.state !==
          HubConnectionState.Disconnected
        ) {
          return
        }

        await connection.start()
      },

      async stop() {
        if (
          connection.state ===
          HubConnectionState.Disconnected
        ) {
          return
        }

        await connection.stop()
      },

      async createRoom(
        hostSessionId,
        hostName,
        initialVideoId,
      ) {
        return connection.invoke<
          WatchPartyRoomState
        >(
          'CreateRoom',
          hostSessionId,
          hostName,
          initialVideoId ?? null,
        )
      },

      async joinRoom(
        roomCode,
        sessionId,
        userName,
      ) {
        return connection.invoke<
          WatchPartyRoomState
        >(
          'JoinRoom',
          roomCode,
          sessionId,
          userName,
        )
      },

      async getRoomState(
        roomCode,
      ) {
        return connection.invoke<
          WatchPartyRoomState
        >(
          'GetRoomState',
          roomCode,
        )
      },

      async leaveRoom(
        roomCode,
        sessionId,
      ) {
        await connection.invoke(
          'LeaveRoom',
          roomCode,
          sessionId,
        )
      },

      async closeRoom(
        roomCode,
        hostSessionId,
      ) {
        await connection.invoke(
          'CloseRoom',
          roomCode,
          hostSessionId,
        )
      },

      async setVideo(
        roomCode,
        hostSessionId,
        videoId,
      ) {
        return connection.invoke<
          WatchPartyPlayback
        >(
          'SetVideo',
          roomCode,
          hostSessionId,
          videoId,
        )
      },

      async setPlayback(
        roomCode,
        hostSessionId,
        currentTime,
        isPlaying,
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
      },

      async sendMessage(
        roomCode,
        sessionId,
        message,
      ) {
        return connection.invoke<
          WatchPartyMessage
        >(
          'SendMessage',
          roomCode,
          sessionId,
          message,
        )
      },
    }
  },
}
