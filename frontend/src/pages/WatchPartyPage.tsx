import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import type {
  HubConnection,
} from '@microsoft/signalr'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  closeWatchPartyRoom,
  createWatchPartyConnection,
  createWatchPartyRoom,
  joinWatchPartyRoom,
  leaveWatchPartyRoom,
  sendWatchPartyMessage,
  startWatchPartyConnection,
  stopWatchPartyConnection,
  type WatchPartyConnectionStatus,
  type WatchPartyMessage,
  type WatchPartyRoomState,
} from '../api/watchParty'
import {
  getWatchPartySessionId,
  getWatchPartyUserName,
  isWatchPartyHostRoom,
  markWatchPartyHostRoom,
  removeWatchPartyHostRoom,
  saveWatchPartyUserName,
} from '../watchPartySession'
import {
  useAppTranslation,
} from '../i18n'
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

function WatchPartyPage() {
  const {
    roomCode: roomCodeParam,
  } =
    useParams<{
      roomCode?: string
    }>()

  const navigate =
    useNavigate()

  const {
    t,
    i18n,
  } =
    useAppTranslation()

  const sessionId =
    useMemo(
      () =>
        getWatchPartySessionId(),
      [],
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
        getWatchPartyUserName(),
    )

  const [
    activeUserName,
    setActiveUserName,
  ] =
    useState(
      () =>
        getWatchPartyUserName(),
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

  const connectionRef =
    useRef<
      HubConnection | null
    >(null)

  const messagesRef =
    useRef<
      HTMLDivElement | null
    >(null)

  const isHost =
    normalizedRoomCode
      ? isWatchPartyHostRoom(
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
      createWatchPartyConnection(
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

            removeWatchPartyHostRoom(
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
                await joinWatchPartyRoom(
                  connection,
                  normalizedRoomCode,
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

          await startWatchPartyConnection(
            connection,
          )

          const joined =
            await joinWatchPartyRoom(
              connection,
              normalizedRoomCode,
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

      void stopWatchPartyConnection(
        connection,
      )
    }
  }, [
    activeUserName,
    normalizedRoomCode,
    sessionId,
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

    saveWatchPartyUserName(
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
        createWatchPartyConnection(
          {},
        )

      try {
        setIsBusy(
          true,
        )

        setErrorKey(
          null,
        )

        saveWatchPartyUserName(
          normalizedName,
        )

        setActiveUserName(
          normalizedName,
        )

        await startWatchPartyConnection(
          connection,
        )

        const created =
          await createWatchPartyRoom(
            connection,
            sessionId,
            normalizedName,
            null,
          )

        markWatchPartyHostRoom(
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

        await stopWatchPartyConnection(
          connection,
        )
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

      saveWatchPartyUserName(
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

        await sendWatchPartyMessage(
          connection,
          room.roomCode,
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
          await closeWatchPartyRoom(
            connection,
            room.roomCode,
            sessionId,
          )

          removeWatchPartyHostRoom(
            room.roomCode,
          )
        } else {
          await leaveWatchPartyRoom(
            connection,
            room.roomCode,
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

      {errorKey && (
        <div className="watch-party-error">
          {t(
            errorKey,
          )}
        </div>
      )}

      <div className="watch-party-room-layout">
        <main className="watch-party-stage">
          <div className="watch-party-stage-empty">
            <div className="watch-party-stage-symbol">
              ▶
            </div>

            <span>
              {room.currentVideoId
                ? t(
                    'watchParty.selectedVideo',
                  )
                : t(
                    'watchParty.noVideo',
                  )}
            </span>

            <h2>
              {t(
                'watchParty.stageTitle',
              )}
            </h2>

            <p>
              {t(
                'watchParty.stageDescription',
              )}
            </p>

            {room.currentVideoId && (
              <code>
                {
                  room.currentVideoId
                }
              </code>
            )}
          </div>
        </main>

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