import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import type {
  WatchPartyClient,
  WatchPartyClientFactory,
} from '../../application/watchParty/client'
import type {
  WatchPartyConnectionStatus,
} from '../../application/watchParty/types'
import type {
  WatchPartySessionStore,
} from '../../application/watchParty/sessionStore'
import type {
  VideoService,
} from '../../application/video/service'
import type {
  SocialService,
} from '../../application/social/service'
import type {
  SocialUser,
} from '../../domain/social/types'
import type {
  WatchPartyMessage,
  WatchPartyRoomState,
} from '../../domain/watchParty/types'
import WatchPartyVideoStage from '../components/watchParty/WatchPartyVideoStage'
import {
  useAppTranslation,
} from '../../shared/i18n'
import {
  useAuthStore,
} from '../features/auth/authStore'
import './WatchPartyPage.css'

function normalizeRoomCode(
  value: string,
) {
  return value
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9]/g,
      '',
    )
    .slice(
      0,
      6,
    )
}

interface WatchPartyPageProps {
  videoService: VideoService
  socialService: SocialService
  watchPartyClientFactory: WatchPartyClientFactory
  watchPartySessionStore: WatchPartySessionStore
}

function WatchPartyPage({
  videoService,
  socialService,
  watchPartyClientFactory,
  watchPartySessionStore,
}: WatchPartyPageProps) {
  const {
    roomCode: roomCodeParam,
  } =
    useParams<{
      roomCode?: string
    }>()

  const navigate =
    useNavigate()

  const [
    searchParams,
  ] =
    useSearchParams()

  const initialVideoId =
    searchParams
      .get(
        'videoId',
      )
      ?.trim() ||
    null

  const {
    t,
    i18n,
  } =
    useAppTranslation()

  const profile =
    useAuthStore(
      (state) =>
        state.profile,
    )

  const sessionId =
    useMemo(
      () =>
        watchPartySessionStore.getSessionId(),
      [
        watchPartySessionStore,
      ],
    )

  const normalizedRoomCode =
    roomCodeParam
      ? normalizeRoomCode(
          roomCodeParam,
        )
      : ''

  const [nameDraft, setNameDraft] =
    useState(
      () =>
        watchPartySessionStore.getUserName(),
    )

  const [
    activeUserName,
    setActiveUserName,
  ] =
    useState(
      () =>
        watchPartySessionStore.getUserName(),
    )

  const [
    joinCode,
    setJoinCode,
  ] =
    useState('')

  const [
    room,
    setRoom,
  ] =
    useState<
      WatchPartyRoomState | null
    >(null)

  const [
    status,
    setStatus,
  ] =
    useState<
      WatchPartyConnectionStatus
    >('disconnected')

  const [
    errorKey,
    setErrorKey,
  ] =
    useState<
      string | null
    >(null)

  const [
    isBusy,
    setIsBusy,
  ] =
    useState(false)

  const [
    chatDraft,
    setChatDraft,
  ] =
    useState('')

  const [
    isSending,
    setIsSending,
  ] =
    useState(false)

  const [
    roomClosed,
    setRoomClosed,
  ] =
    useState(false)

  const [
    copied,
    setCopied,
  ] =
    useState(false)

  const [
    inviteOpen,
    setInviteOpen,
  ] =
    useState(false)

  const [
    inviteCopied,
    setInviteCopied,
  ] =
    useState(false)

  const [
    inviteFriends,
    setInviteFriends,
  ] =
    useState<
      SocialUser[]
    >([])

  const [
    inviteFriendsLoading,
    setInviteFriendsLoading,
  ] =
    useState(false)

  const [
    friendInviteStates,
    setFriendInviteStates,
  ] =
    useState<
      Record<
        string,
        'sending' |
        'sent' |
        'error'
      >
    >({})

  useEffect(
    () => {
      if (
        !inviteOpen ||
        !profile
      ) {
        return
      }

      let disposed =
        false

      const loadFriends =
        async () => {
          try {
            setInviteFriendsLoading(
              true,
            )

            const overview =
              await socialService
                .getOverview()

            if (!disposed) {
              setInviteFriends(
                overview.friends,
              )
            }
          } catch (
            loadError
          ) {
            console.error(
              loadError,
            )

            if (!disposed) {
              setInviteFriends(
                [],
              )
            }
          } finally {
            if (!disposed) {
              setInviteFriendsLoading(
                false,
              )
            }
          }
        }

      void loadFriends()

      return () => {
        disposed =
          true
      }
    },
    [
      inviteOpen,
      profile,
      socialService,
    ],
  )

  const connectionRef =
    useRef<
      WatchPartyClient | null
    >(null)

  const messagesRef =
    useRef<
      HTMLDivElement | null
    >(null)

  const isHost =
    normalizedRoomCode
      ? watchPartySessionStore.isHostRoom(
          normalizedRoomCode,
        )
      : false

  const locale =
    i18n.resolvedLanguage
      ?.toLowerCase()
      .startsWith(
        'uk',
      )
      ? 'uk-UA'
      : 'en-US'

  const formatTime = (
    value: string,
  ) =>
    new Intl.DateTimeFormat(
      locale,
      {
        hour:
          '2-digit',

        minute:
          '2-digit',
      },
    ).format(
      new Date(
        value,
      ),
    )

  const getStatusLabel = () => {
    return t(
      `watchParty.connection.${status}`,
    )
  }

  useEffect(() => {
    if (
      !normalizedRoomCode ||
      !activeUserName
    ) {
      return
    }

    let disposed =
      false

    const applyJoinedRoom = (
      joinedRoom:
        WatchPartyRoomState,
    ) => {
      if (disposed) {
        return
      }

      setRoom(
        joinedRoom,
      )

      setRoomClosed(
        false,
      )

      setErrorKey(
        null,
      )
    }

    const connection =
      watchPartyClientFactory.create(
        {
          onParticipantsChanged: (
            participants,
          ) => {
            if (disposed) {
              return
            }

            setRoom(
              (current) =>
                current
                  ? {
                      ...current,
                      participants,
                    }
                  : current,
            )
          },

          onVideoChanged: (
            playback,
          ) => {
            if (disposed) {
              return
            }

            setRoom(
              (current) =>
                current
                  ? {
                      ...current,
                      currentVideoId:
                        playback.currentVideoId,
                      currentTime:
                        playback.currentTime,
                      isPlaying:
                        playback.isPlaying,
                      updatedAt:
                        playback.updatedAt,
                    }
                  : current,
            )
          },

          onPlaybackChanged: (
            playback,
          ) => {
            if (disposed) {
              return
            }

            setRoom(
              (current) =>
                current
                  ? {
                      ...current,
                      currentTime:
                        playback.currentTime,
                      isPlaying:
                        playback.isPlaying,
                      updatedAt:
                        playback.updatedAt,
                    }
                  : current,
            )
          },

          onMessage: (
            message,
          ) => {
            if (disposed) {
              return
            }

            setRoom(
              (current) => {
                if (!current) {
                  return current
                }

                if (
                  current.messages.some(
                    (item) =>
                      item.id ===
                      message.id,
                  )
                ) {
                  return current
                }

                return {
                  ...current,
                  messages: [
                    ...current.messages,
                    message,
                  ].slice(
                    -100,
                  ),
                }
              },
            )
          },

          onRoomClosed: () => {
            if (disposed) {
              return
            }

            watchPartySessionStore.removeHostRoom(
              normalizedRoomCode,
            )

            setRoomClosed(
              true,
            )

            setRoom(
              null,
            )
          },

          onStatusChange: (
            nextStatus,
          ) => {
            if (!disposed) {
              setStatus(
                nextStatus,
              )
            }
          },

          onReconnected:
            async () => {
              const joined =
                await connection.joinRoom(normalizedRoomCode,
                  sessionId,
                  activeUserName,
                )

              applyJoinedRoom(
                joined,
              )
            },

          onError: () => {
            if (!disposed) {
              setErrorKey(
                'watchParty.errors.connectionFailed',
              )
            }
          },
        },
      )

    connectionRef.current =
      connection

    const connect =
      async () => {
        try {
          setStatus(
            'connecting',
          )

          await connection.start()

          const joined =
            await connection.joinRoom(normalizedRoomCode,
              sessionId,
              activeUserName,
            )

          applyJoinedRoom(
            joined,
          )

          if (!disposed) {
            setStatus(
              'connected',
            )
          }
        } catch (
          connectionError
        ) {
          console.error(
            connectionError,
          )

          if (!disposed) {
            setStatus(
              'disconnected',
            )

            setErrorKey(
              'watchParty.errors.joinFailed',
            )
          }
        }
      }

    void connect()

    return () => {
      disposed =
        true

      if (
        connectionRef.current ===
        connection
      ) {
        connectionRef.current =
          null
      }

      void connection.stop()
    }
  }, [
    activeUserName,
    normalizedRoomCode,
    sessionId,
    watchPartyClientFactory,
    watchPartySessionStore,
  ])

  useEffect(() => {
    const container =
      messagesRef.current

    if (!container) {
      return
    }

    container.scrollTop =
      container.scrollHeight
  }, [
    room?.messages,
  ])

  const handleIdentity = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const normalizedName =
      nameDraft.trim()

    if (!normalizedName) {
      setErrorKey(
        'watchParty.errors.nameRequired',
      )

      return
    }

    watchPartySessionStore.saveUserName(
      normalizedName,
    )

    setActiveUserName(
      normalizedName,
    )

    setErrorKey(
      null,
    )
  }

  const handleCreateRoom =
    async () => {
      const normalizedName =
        nameDraft.trim()

      if (!normalizedName) {
        setErrorKey(
          'watchParty.errors.nameRequired',
        )

        return
      }

      const connection =
        watchPartyClientFactory.create(
          {},
        )

      try {
        setIsBusy(
          true,
        )

        setErrorKey(
          null,
        )

        watchPartySessionStore.saveUserName(
          normalizedName,
        )

        setActiveUserName(
          normalizedName,
        )

        await connection.start()

        const created =
          await connection.createRoom(sessionId,
            normalizedName,
            initialVideoId,
          )

        watchPartySessionStore.markHostRoom(
          created.roomCode,
        )

        navigate(
          `/watch-party/${created.roomCode}`,
        )
      } catch (
        createError
      ) {
        console.error(
          createError,
        )

        setErrorKey(
          'watchParty.errors.createFailed',
        )
      } finally {
        setIsBusy(
          false,
        )

        await connection.stop()
      }
    }

  const handleJoinRoom =
    () => {
      const normalizedName =
        nameDraft.trim()

      const normalizedCode =
        normalizeRoomCode(
          joinCode,
        )

      if (!normalizedName) {
        setErrorKey(
          'watchParty.errors.nameRequired',
        )

        return
      }

      if (
        normalizedCode.length !==
        6
      ) {
        setErrorKey(
          'watchParty.errors.invalidCode',
        )

        return
      }

      watchPartySessionStore.saveUserName(
        normalizedName,
      )

      setActiveUserName(
        normalizedName,
      )

      setErrorKey(
        null,
      )

      navigate(
        `/watch-party/${normalizedCode}`,
      )
    }

  const handleSendMessage =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      const connection =
        connectionRef.current

      const message =
        chatDraft.trim()

      if (
        !connection ||
        !room ||
        status !==
          'connected' ||
        !message ||
        isSending
      ) {
        return
      }

      try {
        setIsSending(
          true,
        )

        setErrorKey(
          null,
        )

        await connection.sendMessage(room.roomCode,
          sessionId,
          message,
        )

        setChatDraft(
          '',
        )
      } catch (
        sendError
      ) {
        console.error(
          sendError,
        )

        setErrorKey(
          'watchParty.errors.sendFailed',
        )
      } finally {
        setIsSending(
          false,
        )
      }
    }

  const handleCopyCode =
    async () => {
      if (!room) {
        return
      }

      try {
        await navigator.clipboard
          .writeText(
            room.roomCode,
          )

        setCopied(
          true,
        )

        window.setTimeout(
          () => {
            setCopied(
              false,
            )
          },
          1500,
        )
      } catch (
        copyError
      ) {
        console.error(
          copyError,
        )
      }
    }

  const getInviteUrl =
    () => {
      if (!room) {
        return ''
      }

      if (
        typeof window ===
        'undefined'
      ) {
        return `/watch-party/${room.roomCode}`
      }

      return new URL(
        `/watch-party/${room.roomCode}`,
        window.location.origin,
      ).toString()
    }

  const handleCopyInvite =
    async () => {
      const inviteUrl =
        getInviteUrl()

      if (!inviteUrl) {
        return
      }

      try {
        await navigator.clipboard
          .writeText(
            inviteUrl,
          )

        setInviteCopied(
          true,
        )

        window.setTimeout(
          () => {
            setInviteCopied(
              false,
            )
          },
          1800,
        )
      } catch (
        copyError
      ) {
        console.error(
          copyError,
        )
      }
    }

  const handleShareInvite =
    async () => {
      const inviteUrl =
        getInviteUrl()

      if (!inviteUrl) {
        return
      }

      try {
        if (
          typeof navigator.share ===
          'function'
        ) {
          await navigator.share(
            {
              title:
                'AMTLIS Watch Party',
              text: t(
                'watchParty.inviteShareText',
              ),
              url: inviteUrl,
            },
          )

          return
        }

        await handleCopyInvite()
      } catch (shareError) {
        if (
          shareError instanceof DOMException &&
          shareError.name ===
            'AbortError'
        ) {
          return
        }

        console.error(
          shareError,
        )
      }
    }

  const handleInviteFriend =
    async (
      friend: SocialUser,
    ) => {
      if (
        !room ||
        friendInviteStates[
          friend.id
        ] === 'sending' ||
        friendInviteStates[
          friend.id
        ] === 'sent'
      ) {
        return
      }

      try {
        setFriendInviteStates(
          (current) => ({
            ...current,
            [friend.id]:
              'sending',
          }),
        )

        await socialService
          .inviteToWatchParty(
            friend.id,
            room.roomCode,
          )

        setFriendInviteStates(
          (current) => ({
            ...current,
            [friend.id]:
              'sent',
          }),
        )
      } catch (
        inviteError
      ) {
        console.error(
          inviteError,
        )

        setFriendInviteStates(
          (current) => ({
            ...current,
            [friend.id]:
              'error',
          }),
        )
      }
    }

  const handleLeave =
    async () => {
      const connection =
        connectionRef.current

      if (
        !connection ||
        !room
      ) {
        navigate(
          '/watch-party',
        )

        return
      }

      try {
        setIsBusy(
          true,
        )

        if (isHost) {
          await connection.closeRoom(room.roomCode,
            sessionId,
          )

          watchPartySessionStore.removeHostRoom(
            room.roomCode,
          )
        } else {
          await connection.leaveRoom(room.roomCode,
            sessionId,
          )
        }

        navigate(
          '/watch-party',
        )
      } catch (
        leaveError
      ) {
        console.error(
          leaveError,
        )

        setErrorKey(
          'watchParty.errors.actionFailed',
        )
      } finally {
        setIsBusy(
          false,
        )
      }
    }

  if (!normalizedRoomCode) {
    return (
      <section className="watch-party-page">
        <header className="watch-party-hero">
          <span>
            {t(
              'watchParty.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'watchParty.title',
            )}
          </h1>

          <p>
            {t(
              'watchParty.description',
            )}
          </p>
        </header>

        {errorKey && (
          <div className="watch-party-error">
            {t(
              errorKey,
            )}
          </div>
        )}

        <div className="watch-party-entry-grid">
          <article className="watch-party-entry-card">
            <div className="watch-party-entry-icon">
              +
            </div>

            <h2>
              {t(
                'watchParty.createTitle',
              )}
            </h2>

            <p>
              {t(
                'watchParty.createDescription',
              )}
            </p>

            <label>
              {t(
                'watchParty.name',
              )}

              <input
                value={
                  nameDraft
                }
                onChange={(
                  event,
                ) => {
                  setNameDraft(
                    event.target.value,
                  )
                }}
                maxLength={
                  40
                }
                placeholder={t(
                  'watchParty.namePlaceholder',
                )}
              />
            </label>

            <button
              type="button"
              className="watch-party-primary-button"
              disabled={
                isBusy
              }
              onClick={() => {
                void handleCreateRoom()
              }}
            >
              {isBusy
                ? t(
                    'watchParty.creating',
                  )
                : t(
                    'watchParty.createRoom',
                  )}
            </button>
          </article>

          <article className="watch-party-entry-card">
            <div className="watch-party-entry-icon">
              #
            </div>

            <h2>
              {t(
                'watchParty.joinTitle',
              )}
            </h2>

            <p>
              {t(
                'watchParty.joinDescription',
              )}
            </p>

            <label>
              {t(
                'watchParty.name',
              )}

              <input
                value={
                  nameDraft
                }
                onChange={(
                  event,
                ) => {
                  setNameDraft(
                    event.target.value,
                  )
                }}
                maxLength={
                  40
                }
                placeholder={t(
                  'watchParty.namePlaceholder',
                )}
              />
            </label>

            <label>
              {t(
                'watchParty.roomCode',
              )}

              <input
                value={
                  joinCode
                }
                onChange={(
                  event,
                ) => {
                  setJoinCode(
                    normalizeRoomCode(
                      event.target.value,
                    ),
                  )
                }}
                maxLength={
                  6
                }
                className="watch-party-code-input"
                placeholder={t(
                  'watchParty.roomCodePlaceholder',
                )}
              />
            </label>

            <button
              type="button"
              className="watch-party-secondary-button"
              onClick={
                handleJoinRoom
              }
            >
              {t(
                'watchParty.joinRoom',
              )}
            </button>
          </article>
        </div>
      </section>
    )
  }

  if (
    !activeUserName
  ) {
    return (
      <section className="watch-party-page">
        <div className="watch-party-identity-card">
          <span>
            {t(
              'watchParty.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'watchParty.identityTitle',
            )}
          </h1>

          <p>
            {t(
              'watchParty.identityDescription',
            )}
          </p>

          {errorKey && (
            <div className="watch-party-error">
              {t(
                errorKey,
              )}
            </div>
          )}

          <form
            onSubmit={
              handleIdentity
            }
          >
            <input
              autoFocus
              value={
                nameDraft
              }
              onChange={(
                event,
              ) => {
                setNameDraft(
                  event.target.value,
                )
              }}
              maxLength={
                40
              }
              placeholder={t(
                'watchParty.namePlaceholder',
              )}
            />

            <button
              type="submit"
              className="watch-party-primary-button"
            >
              {t(
                'watchParty.continue',
              )}
            </button>
          </form>
        </div>
      </section>
    )
  }

  if (roomClosed) {
    return (
      <section className="watch-party-page">
        <div className="watch-party-identity-card">
          <span>
            {t(
              'watchParty.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'watchParty.closedTitle',
            )}
          </h1>

          <p>
            {t(
              'watchParty.closedDescription',
            )}
          </p>

          <Link
            className="watch-party-primary-link"
            to="/watch-party"
          >
            {t(
              'watchParty.back',
            )}
          </Link>
        </div>
      </section>
    )
  }

  if (!room) {
    return (
      <section className="watch-party-page">
        <div className="watch-party-loading-card">
          <span className={`watch-party-status-dot ${status}`} />

          <strong>
            {getStatusLabel()}
          </strong>

          {errorKey && (
            <>
              <p>
                {t(
                  errorKey,
                )}
              </p>

              <Link
                className="watch-party-primary-link"
                to="/watch-party"
              >
                {t(
                  'watchParty.back',
                )}
              </Link>
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="watch-party-room-page">
      <header className="watch-party-room-header">
        <div>
          <span className="watch-party-eyebrow">
            {t(
              'watchParty.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'watchParty.room',
            )}{' '}
            {room.roomCode}
          </h1>
        </div>

        <div className="watch-party-room-actions">
          <div className="watch-party-connection-status">
            <span className={`watch-party-status-dot ${status}`} />

            {getStatusLabel()}
          </div>

          <button
            type="button"
            className="watch-party-primary-button"
            onClick={() => {
              setInviteOpen(
                true,
              )
            }}
          >
            {t(
              'watchParty.invite',
            )}
          </button>

          <button
            type="button"
            className="watch-party-code-button"
            onClick={() => {
              void handleCopyCode()
            }}
          >
            {copied
              ? t(
                  'watchParty.copied',
                )
              : t(
                  'watchParty.copyCode',
                )}
          </button>

          <button
            type="button"
            className="watch-party-danger-button"
            disabled={
              isBusy
            }
            onClick={() => {
              void handleLeave()
            }}
          >
            {isHost
              ? t(
                  'watchParty.close',
                )
              : t(
                  'watchParty.leave',
                )}
          </button>
        </div>
      </header>

      {inviteOpen && (
        <div
          className="watch-party-invite-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setInviteOpen(
                false,
              )
            }
          }}
        >
          <section
            className="watch-party-invite-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="watch-party-invite-title"
          >
            <header>
              <div>
                <span>
                  {t(
                    'watchParty.eyebrow',
                  )}
                </span>

                <h2 id="watch-party-invite-title">
                  {t(
                    'watchParty.inviteTitle',
                  )}
                </h2>
              </div>

              <button
                type="button"
                className="watch-party-invite-close"
                aria-label={t(
                  'watchParty.closeInvite',
                )}
                onClick={() => {
                  setInviteOpen(
                    false,
                  )
                }}
              >
                ×
              </button>
            </header>

            <p>
              {t(
                'watchParty.inviteDescription',
              )}
            </p>

            <div className="watch-party-friend-invite">
              <div className="watch-party-friend-invite-heading">
                <strong>
                  {t(
                    'watchParty.inviteFriendsTitle',
                  )}
                </strong>

                <span>
                  {t(
                    'watchParty.inviteFriendsLead',
                  )}
                </span>
              </div>

              {!profile
                ? (
                  <div className="watch-party-friend-invite-empty">
                    <span>
                      {t(
                        'watchParty.inviteFriendsSignIn',
                      )}
                    </span>

                    <button
                      type="button"
                      className="watch-party-secondary-button"
                      onClick={() => {
                        setInviteOpen(
                          false,
                        )

                        navigate(
                          '/auth',
                        )
                      }}
                    >
                      {t(
                        'watchParty.inviteFriendsSignInAction',
                      )}
                    </button>
                  </div>
                )
                : inviteFriendsLoading
                  ? (
                    <div className="watch-party-friend-invite-empty">
                      {t(
                        'watchParty.inviteFriendsLoading',
                      )}
                    </div>
                  )
                  : inviteFriends.length ===
                      0
                    ? (
                      <div className="watch-party-friend-invite-empty">
                        <span>
                          {t(
                            'watchParty.inviteFriendsEmpty',
                          )}
                        </span>

                        <button
                          type="button"
                          className="watch-party-secondary-button"
                          onClick={() => {
                            setInviteOpen(
                              false,
                            )

                            navigate(
                              '/friends?tab=discover',
                            )
                          }}
                        >
                          {t(
                            'watchParty.inviteFriendsFind',
                          )}
                        </button>
                      </div>
                    )
                    : (
                      <div className="watch-party-friend-invite-list">
                        {inviteFriends.map(
                          (
                            friend,
                          ) => {
                            const inviteState =
                              friendInviteStates[
                                friend.id
                              ]

                            const initials =
                              friend.displayName
                                .split(
                                  ' ',
                                )
                                .map(
                                  (part) =>
                                    part[0],
                                )
                                .join(
                                  '',
                                )
                                .slice(
                                  0,
                                  2,
                                )
                                .toUpperCase()

                            return (
                              <div
                                className="watch-party-friend-invite-row"
                                key={
                                  friend.id
                                }
                              >
                                <div className="watch-party-friend-avatar">
                                  {friend.avatarUrl
                                    ? (
                                      <img
                                        src={
                                          friend.avatarUrl
                                        }
                                        alt=""
                                      />
                                    )
                                    : initials}
                                </div>

                                <div className="watch-party-friend-copy">
                                  <strong>
                                    {
                                      friend.displayName
                                    }
                                  </strong>

                                  <span>
                                    {
                                      friend.handle
                                    }
                                  </span>

                                  {inviteState ===
                                    'error' && (
                                    <small>
                                      {t(
                                        'watchParty.inviteFriendFailed',
                                      )}
                                    </small>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  className="watch-party-secondary-button"
                                  disabled={
                                    inviteState ===
                                      'sending' ||
                                    inviteState ===
                                      'sent'
                                  }
                                  onClick={() => {
                                    void handleInviteFriend(
                                      friend,
                                    )
                                  }}
                                >
                                  {inviteState ===
                                    'sending'
                                    ? t(
                                        'watchParty.inviteFriendSending',
                                      )
                                    : inviteState ===
                                        'sent'
                                      ? t(
                                          'watchParty.inviteFriendSent',
                                        )
                                      : t(
                                          'watchParty.inviteFriend',
                                        )}
                                </button>
                              </div>
                            )
                          },
                        )}
                      </div>
                    )}
            </div>

            <label className="watch-party-invite-link">
              <span>
                {t(
                  'watchParty.inviteLink',
                )}
              </span>

              <input
                readOnly
                value={
                  getInviteUrl()
                }
                onFocus={(event) => {
                  event.currentTarget.select()
                }}
              />
            </label>

            <div className="watch-party-invite-actions">
              <button
                type="button"
                className="watch-party-secondary-button"
                onClick={() => {
                  void handleCopyInvite()
                }}
              >
                {inviteCopied
                  ? t(
                      'watchParty.linkCopied',
                    )
                  : t(
                      'watchParty.copyLink',
                    )}
              </button>

              <button
                type="button"
                className="watch-party-primary-button"
                onClick={() => {
                  void handleShareInvite()
                }}
              >
                {t(
                  'watchParty.shareInvite',
                )}
              </button>
            </div>

            <div className="watch-party-invite-code">
              <span>
                {t(
                  'watchParty.roomCode',
                )}
              </span>

              <strong>
                {
                  room.roomCode
                }
              </strong>
            </div>
          </section>
        </div>
      )}

      {errorKey && (
        <div className="watch-party-error">
          {t(
            errorKey,
          )}
        </div>
      )}

      <div className="watch-party-room-layout">
        <WatchPartyVideoStage
          videoService={
            videoService
          }          room={
            room
          }
          isHost={
            isHost
          }
          connectionRef={
            connectionRef
          }
          hostSessionId={
            sessionId
          }
          connectionStatus={
            status
          }
          onPlaybackStateChange={(
            playback,
          ) => {
            setRoom(
              (current) =>
                current
                  ? {
                      ...current,

                      currentVideoId:
                        playback.currentVideoId,

                      currentTime:
                        playback.currentTime,

                      isPlaying:
                        playback.isPlaying,

                      updatedAt:
                        playback.updatedAt,
                    }
                  : current,
            )
          }}
        />

        <aside className="watch-party-side-panel">
          <section className="watch-party-participants">
            <header>
              <strong>
                {t(
                  'watchParty.participants',
                )}
              </strong>

              <span>
                {
                  room.participants.length
                }
              </span>
            </header>

            <div className="watch-party-participant-list">
              {room.participants.map(
                (
                  participant,
                  index,
                ) => (
                  <div
                    className="watch-party-participant"
                    key={`${participant.userName}-${participant.joinedAt}-${index}`}
                  >
                    <div className="watch-party-avatar">
                      {participant.userName
                        .charAt(
                          0,
                        )
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {
                          participant.userName
                        }
                      </strong>

                      <span>
                        {participant.isHost
                          ? t(
                              'watchParty.host',
                            )
                          : t(
                              'watchParty.guest',
                            )}
                      </span>
                    </div>

                    {participant.isHost && (
                      <span className="watch-party-host-badge">
                        {t(
                          'watchParty.host',
                        )}
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="watch-party-chat">
            <header>
              <strong>
                {t(
                  'watchParty.chat',
                )}
              </strong>
            </header>

            <div
              ref={
                messagesRef
              }
              className="watch-party-messages"
            >
              {room.messages.length ===
              0 ? (
                <div className="watch-party-chat-empty">
                  <strong>
                    {t(
                      'watchParty.chatEmpty',
                    )}
                  </strong>

                  <span>
                    {t(
                      'watchParty.chatEmptyHint',
                    )}
                  </span>
                </div>
              ) : (
                room.messages.map(
                  (
                    message:
                      WatchPartyMessage,
                  ) => (
                    <article
                      key={
                        message.id
                      }
                      className="watch-party-message"
                    >
                      <div>
                        <strong>
                          {
                            message.userName
                          }
                        </strong>

                        <time>
                          {formatTime(
                            message.sentAt,
                          )}
                        </time>
                      </div>

                      <p>
                        {
                          message.message
                        }
                      </p>
                    </article>
                  ),
                )
              )}
            </div>

            <form
              className="watch-party-compose"
              onSubmit={
                handleSendMessage
              }
            >
              <input
                value={
                  chatDraft
                }
                onChange={(
                  event,
                ) => {
                  setChatDraft(
                    event.target.value,
                  )
                }}
                maxLength={
                  500
                }
                disabled={
                  status !==
                  'connected'
                }
                placeholder={t(
                  'watchParty.messagePlaceholder',
                )}
              />

              <button
                type="submit"
                disabled={
                  status !==
                    'connected' ||
                  !chatDraft.trim() ||
                  isSending
                }
              >
                {isSending
                  ? t(
                      'watchParty.sending',
                    )
                  : t(
                      'watchParty.send',
                    )}
              </button>
            </form>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default WatchPartyPage