import {
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from 'react'
import {
  getVideoById,
  getVideos,
} from '../../infrastructure/api/videos'
import type {
  VideoDetails,
  VideoListItem,
} from '../../domain/video/types'
import {
  getWatchPartyRoomState,
  setWatchPartyPlayback,
  setWatchPartyVideo,
  type WatchPartyConnection,
  type WatchPartyConnectionStatus,
  type WatchPartyPlayback,
  type WatchPartyRoomState,
} from '../../infrastructure/signalr/watchParty'
import VideoPlayer, {
  type VideoPlaybackAction,
  type VideoPlaybackCommand,
} from '../video/VideoPlayer'
import {
  useAppTranslation,
} from '../../shared/i18n'
import './WatchPartyVideoStage.css'

interface WatchPartyVideoStageProps {
  room: WatchPartyRoomState
  isHost: boolean
  connectionRef: RefObject<WatchPartyConnection | null>
  hostSessionId: string
  connectionStatus: WatchPartyConnectionStatus

  onPlaybackStateChange: (
    playback: WatchPartyPlayback,
  ) => void
}

function formatDuration(
  seconds: number,
) {
  const safeSeconds =
    Math.max(
      0,
      Math.floor(seconds),
    )

  const hours =
    Math.floor(
      safeSeconds / 3600,
    )

  const minutes =
    Math.floor(
      (safeSeconds % 3600) / 60,
    )

  const remainingSeconds =
    safeSeconds % 60

  if (hours > 0) {
    return [
      hours,
      minutes
        .toString()
        .padStart(2, '0'),
      remainingSeconds
        .toString()
        .padStart(2, '0'),
    ].join(':')
  }

  return [
    minutes,
    remainingSeconds
      .toString()
      .padStart(2, '0'),
  ].join(':')
}

function createPlaybackRevision(
  room: WatchPartyRoomState,
) {
  const source = [
    room.currentVideoId ?? '',
    room.currentTime.toString(),
    room.isPlaying
      ? '1'
      : '0',
    room.updatedAt,
  ].join('|')

  let hash =
    2166136261

  for (
    let index = 0;
    index < source.length;
    index += 1
  ) {
    hash ^=
      source.charCodeAt(
        index,
      )

    hash =
      Math.imul(
        hash,
        16777619,
      )
  }

  return hash >>> 0
}
function WatchPartyVideoStage({
  room,
  isHost,
  connectionRef,
  hostSessionId,
  connectionStatus,
  onPlaybackStateChange,
}: WatchPartyVideoStageProps) {
  const {
    t,
  } =
    useAppTranslation()

  const [
    videos,
    setVideos,
  ] =
    useState<VideoListItem[]>([])

  const [
    isLoadingVideos,
    setIsLoadingVideos,
  ] =
    useState(false)

  const [
    videosFailed,
    setVideosFailed,
  ] =
    useState(false)

  const [
    currentVideo,
    setCurrentVideo,
  ] =
    useState<VideoDetails | null>(
      null,
    )

  const [
    isLoadingCurrentVideo,
    setIsLoadingCurrentVideo,
  ] =
    useState(false)

  const [
    currentVideoFailed,
    setCurrentVideoFailed,
  ] =
    useState(false)

  const [
    selectingVideoId,
    setSelectingVideoId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    actionError,
    setActionError,
  ] =
    useState<string | null>(
      null,
    )


  useEffect(() => {
    if (!isHost) {
      return
    }

    const controller =
      new AbortController()

    const loadVideos =
      async () => {
        try {
          setIsLoadingVideos(
            true,
          )

          setVideosFailed(
            false,
          )

          const data =
            await getVideos(
              {
                page: 1,
                pageSize: 30,
              },
              controller.signal,
            )

          if (
            controller.signal
              .aborted
          ) {
            return
          }

          setVideos(
            data,
          )
        } catch (
          error
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          console.error(
            error,
          )

          setVideosFailed(
            true,
          )
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setIsLoadingVideos(
              false,
            )
          }
        }
      }

    void loadVideos()

    return () => {
      controller.abort()
    }
  }, [
    isHost,
  ])

  useEffect(() => {
    if (
      !room.currentVideoId
    ) {
      return
    }

    const videoId =
      room.currentVideoId

    const controller =
      new AbortController()

    const loadCurrentVideo =
      async () => {
        try {
          setIsLoadingCurrentVideo(
            true,
          )

          setCurrentVideoFailed(
            false,
          )

          const data =
            await getVideoById(
              videoId,
              controller.signal,
            )

          if (
            controller.signal
              .aborted
          ) {
            return
          }

          setCurrentVideo(
            data,
          )
        } catch (
          error
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          console.error(
            error,
          )

          setCurrentVideo(
            null,
          )

          setCurrentVideoFailed(
            true,
          )
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setIsLoadingCurrentVideo(
              false,
            )
          }
        }
      }

    void loadCurrentVideo()

    return () => {
      controller.abort()
    }
  }, [
    room.currentVideoId,
  ])


  const playbackRevision =
    createPlaybackRevision(
      room,
    )

  const playbackCommand =
    useMemo<
      VideoPlaybackCommand | null
    >(
      () => {
        if (
          !currentVideo ||
          !room.currentVideoId ||
          currentVideo.id !==
            room.currentVideoId
        ) {
          return null
        }

        return {
          revision:
            playbackRevision,

          currentTime:
            room.currentTime,

          isPlaying:
            room.isPlaying,
        }
      },
      [
        currentVideo,
        playbackRevision,
        room.currentTime,
        room.currentVideoId,
        room.isPlaying,
      ],
    )

  const handleSelectVideo =
    async (
      videoId: string,
    ) => {
      const connection =
        connectionRef.current

      if (
        !isHost ||
        !connection ||
        connectionStatus !==
          'connected'
      ) {
        return
      }

      try {
        setSelectingVideoId(
          videoId,
        )

        setActionError(
          null,
        )

        const playback =
          await setWatchPartyVideo(
            connection,
            room.roomCode,
            hostSessionId,
            videoId,
          )

        onPlaybackStateChange(
          playback,
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        setActionError(
          t(
            'watchParty.errors.videoChangeFailed',
          ),
        )
      } finally {
        setSelectingVideoId(
          null,
        )
      }
    }

  const handlePlaybackHeartbeat =
    async (
      currentTime: number,
      isPlaying: boolean,
    ) => {
      const connection =
        connectionRef.current

      if (
        !isHost ||
        !connection ||
        connectionStatus !==
          'connected'
      ) {
        return
      }

      try {
        await setWatchPartyPlayback(
          connection,
          room.roomCode,
          hostSessionId,
          currentTime,
          isPlaying,
        )
      } catch (error) {
        console.error(
          error,
        )
      }
    }

  const handlePlaybackAction =
    async (
      action:
        VideoPlaybackAction,
    ) => {
      const connection =
        connectionRef.current

      if (
        !isHost ||
        !connection ||
        connectionStatus !==
          'connected'
      ) {
        return
      }

      try {
        setActionError(
          null,
        )

        const playback =
          await setWatchPartyPlayback(
            connection,
            room.roomCode,
            hostSessionId,
            action.currentTime,
            action.isPlaying,
          )

        onPlaybackStateChange(
          playback,
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        setActionError(
          t(
            'watchParty.errors.playbackUpdateFailed',
          ),
        )
      }
    }

  const handlePlaybackResumedByUser =
    async () => {
      const connection =
        connectionRef.current

      if (
        !connection ||
        connectionStatus !==
          'connected'
      ) {
        return
      }

      try {
        const refreshed =
          await getWatchPartyRoomState(
            connection,
            room.roomCode,
          )

        onPlaybackStateChange({
          roomCode:
            refreshed.roomCode,

          currentVideoId:
            refreshed.currentVideoId,

          currentTime:
            refreshed.currentTime,

          isPlaying:
            refreshed.isPlaying,

          updatedAt:
            refreshed.updatedAt,
        })
      } catch (
        error
      ) {
        console.error(
          error,
        )
      }
    }

  return (
    <main className="watch-party-stage">
      {actionError && (
        <div className="watch-party-video-error">
          {actionError}
        </div>
      )}

      {!room.currentVideoId && (
        <div className="watch-party-stage-empty">
          <div className="watch-party-stage-symbol">
            ▶
          </div>

          <span>
            {t(
              'watchParty.noVideo',
            )}
          </span>

          <h2>
            {isHost
              ? t(
                  'watchParty.chooseVideo',
                )
              : t(
                  'watchParty.waitingForVideo',
                )}
          </h2>

          <p>
            {isHost
              ? t(
                  'watchParty.chooseVideoHint',
                )
              : t(
                  'watchParty.waitingForVideoHint',
                )}
          </p>
        </div>
      )}

      {room.currentVideoId &&
        isLoadingCurrentVideo && (
        <div className="watch-party-stage-empty">
          <div className="watch-party-loading-spinner" />

          <h2>
            {t(
              'watchParty.loadingVideo',
            )}
          </h2>
        </div>
      )}

      {room.currentVideoId &&
        currentVideoFailed && (
        <div className="watch-party-stage-empty">
          <h2>
            {t(
              'watchParty.videoLoadFailed',
            )}
          </h2>
        </div>
      )}

      {currentVideo &&
        room.currentVideoId ===
          currentVideo.id && (
        <div className="watch-party-current-video">
          <div className="watch-party-video-player">
            <VideoPlayer
              src={
                currentVideo.videoPath
              }
              title={
                currentVideo.title
              }
              poster={
                currentVideo.thumbnailPath
              }
              initialTime={
                room.currentTime
              }
              controlsEnabled={
                isHost
              }
              playbackCommand={
                playbackCommand
              }
              onPlaybackHeartbeat={(
                currentTime,
                isPlaying,
              ) => {
                void handlePlaybackHeartbeat(
                  currentTime,
                  isPlaying,
                )
              }}
              onPlaybackAction={(
                action,
              ) => {
                void handlePlaybackAction(
                  action,
                )
              }}
              blockedPlaybackTitle={
                t(
                  'watchParty.playbackBlocked',
                )
              }
              blockedPlaybackHint={
                t(
                  'watchParty.playbackBlockedHint',
                )
              }
              blockedPlaybackAction={
                t(
                  'watchParty.resumePlayback',
                )
              }
              onPlaybackResumedByUser={() => {
                void handlePlaybackResumedByUser()
              }}
            />
          </div>

          <div className="watch-party-current-video-info">
            <div>
              <span>
                {t(
                  'watchParty.currentVideo',
                )}
              </span>

              <h2>
                {
                  currentVideo.title
                }
              </h2>

              <p>
                {
                  currentVideo.channelName
                }
              </p>
            </div>

            <div className="watch-party-control-note">
              {isHost
                ? t(
                    'watchParty.hostControls',
                  )
                : t(
                    'watchParty.guestControls',
                  )}
            </div>
          </div>
        </div>
      )}

      {isHost && (
        <section className="watch-party-video-library">
          <header>
            <span>
              {t(
                'watchParty.videoLibrary',
              )}
            </span>

            <h2>
              {t(
                'watchParty.availableVideos',
              )}
            </h2>
          </header>

          {isLoadingVideos && (
            <div className="watch-party-library-state">
              {t(
                'watchParty.loadingVideos',
              )}
            </div>
          )}

          {videosFailed && (
            <div className="watch-party-library-state">
              {t(
                'watchParty.videosLoadFailed',
              )}
            </div>
          )}

          {!isLoadingVideos &&
            !videosFailed &&
            videos.length ===
              0 && (
            <div className="watch-party-library-state">
              {t(
                'watchParty.noVideos',
              )}
            </div>
          )}

          {videos.length > 0 && (
            <div className="watch-party-video-grid">
              {videos.map(
                (video) => {
                  const selected =
                    room.currentVideoId ===
                    video.id

                  const selecting =
                    selectingVideoId ===
                    video.id

                  return (
                    <button
                      type="button"
                      key={
                        video.id
                      }
                      className={
                        `watch-party-video-card${selected ? ' is-selected' : ''}`
                      }
                      disabled={
                        selectingVideoId !==
                          null ||
                        connectionStatus !==
                          'connected'
                      }
                      onClick={() => {
                        void handleSelectVideo(
                          video.id,
                        )
                      }}
                    >
                      <div className="watch-party-video-thumbnail">
                        {video.thumbnailPath ? (
                          <img
                            src={
                              video.thumbnailPath
                            }
                            alt=""
                          />
                        ) : (
                          <div className="watch-party-video-thumbnail-placeholder">
                            ▶
                          </div>
                        )}

                        <span>
                          {formatDuration(
                            video.durationSeconds,
                          )}
                        </span>
                      </div>

                      <div className="watch-party-video-card-info">
                        <strong>
                          {
                            video.title
                          }
                        </strong>

                        <span>
                          {
                            video.channelName
                          }
                        </span>

                        {selected && (
                          <em>
                            {t(
                              'watchParty.selectedVideo',
                            )}
                          </em>
                        )}

                        {selecting && (
                          <em>
                            {t(
                              'watchParty.selectingVideo',
                            )}
                          </em>
                        )}
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          )}
        </section>
      )}
    </main>
  )
}

export default WatchPartyVideoStage