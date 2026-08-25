import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  Link,
  useParams,
} from 'react-router-dom'
import type {
  LiveChatClient,
  LiveChatClientFactory,
} from '../../application/liveChat/client'
import type {
  LiveChatConnectionStatus,
  LiveChatMessage,
} from '../../application/liveChat/types'
import type {
  StreamService,
} from '../../application/stream/service'
import type {
  LiveStreamDetails,
} from '../../domain/stream/types'
import {
  useAppTranslation,
} from '../../shared/i18n'
import './StreamsPages.css'
import './LiveChat.css'

const developmentUserName =
  'Guest Viewer'

const categoryKeys:
Record<string, string> = {
  programming:
    'streamCategory.programming',

  gaming:
    'streamCategory.gaming',

  games:
    'streamCategory.games',

  music:
    'streamCategory.music',

  education:
    'streamCategory.education',

  esports:
    'streamCategory.esports',

  cybersport:
    'streamCategory.cybersport',

  creative:
    'streamCategory.creative',

  technology:
    'streamCategory.technology',

  art:
    'streamCategory.art',

  chatting:
    'streamCategory.chatting',

  'just-chatting':
    'streamCategory.justChatting',
}

function getLocale(
  language:
    | string
    | undefined,
) {
  return language
    ?.toLowerCase()
    .startsWith('uk')
    ? 'uk-UA'
    : 'en-US'
}

function formatViewerCount(
  viewerCount: number,
  locale: string,
) {
  return new Intl.NumberFormat(
    locale,
  ).format(
    viewerCount,
  )
}

function formatChatTime(
  sentAt: string,
  locale: string,
) {
  return new Intl.DateTimeFormat(
    locale,
    {
      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  ).format(
    new Date(
      sentAt,
    ),
  )
}

interface LiveStreamPageProps {
  liveChatClientFactory: LiveChatClientFactory
  streamService: StreamService
}

function LiveStreamPage({
  liveChatClientFactory,
  streamService,
}: LiveStreamPageProps) {
  const {
    streamId,
  } =
    useParams<{
      streamId: string
    }>()

  const {
    t,
    i18n,
  } =
    useAppTranslation()

  const locale =
    getLocale(
      i18n.resolvedLanguage,
    )

  const [
    stream,
    setStream,
  ] =
    useState<
      LiveStreamDetails | null
    >(null)

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  const [
    hasError,
    setHasError,
  ] =
    useState(false)

  const [
    chatMessages,
    setChatMessages,
  ] =
    useState<
      LiveChatMessage[]
    >([])

  const [
    chatStatus,
    setChatStatus,
  ] =
    useState<LiveChatConnectionStatus>(
      'connecting',
    )

  const [
    chatErrorKey,
    setChatErrorKey,
  ] =
    useState<
      string | null
    >(null)

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

  const chatClientRef =
    useRef<
      LiveChatClient | null
    >(null)

  const chatMessagesRef =
    useRef<
      HTMLDivElement | null
    >(null)

  const getCategoryLabel = (
    category: string,
  ) => {
    const normalized =
      category
        .trim()
        .toLowerCase()
        .replace(
          /\s+/g,
          '-',
        )

    const key =
      categoryKeys[
        normalized
      ]

    return key
      ? t(key)
      : category
  }

  const getStatusText = (
    status:
      LiveChatConnectionStatus,
  ) => {
    switch (status) {
      case 'connected':
        return t(
          'liveStream.chat.connected',
        )

      case 'reconnecting':
        return t(
          'liveStream.chat.reconnecting',
        )

      case 'disconnected':
        return t(
          'liveStream.chat.disconnected',
        )

      default:
        return t(
          'liveStream.chat.connecting',
        )
    }
  }

  useEffect(() => {
    if (!streamId) {
      return
    }

    const controller =
      new AbortController()

    const loadStream =
      async () => {
        try {
          setIsLoading(
            true,
          )

          setHasError(
            false,
          )

          const data =
            await streamService.getLiveStreamById(
              streamId,
              controller.signal,
            )

          setStream(
            data,
          )
        } catch (
          requestError
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          console.error(
            requestError,
          )

          setHasError(
            true,
          )
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setIsLoading(
              false,
            )
          }
        }
      }

    void loadStream()

    return () => {
      controller.abort()
    }
  }, [
    streamId,
    streamService,
  ])

  useEffect(() => {
    if (!streamId) {
      return
    }

    let isDisposed =
      false

    const chatClient =
      liveChatClientFactory.create(
        streamId,
        {
          onMessage: (
            message,
          ) => {
            if (
              isDisposed
            ) {
              return
            }

            setChatMessages(
              (
                current,
              ) =>
                [
                  ...current,
                  message,
                ].slice(
                  -100,
                ),
            )
          },

          onStatusChange: (
            status,
          ) => {
            if (
              isDisposed
            ) {
              return
            }

            setChatStatus(
              status,
            )
          },

          onError: () => {
            if (
              isDisposed
            ) {
              return
            }

            setChatErrorKey(
              'liveStream.chat.genericError',
            )
          },
        },
      )

    chatClientRef.current =
      chatClient

    const connect =
      async () => {
        try {
          await chatClient.start()

          if (
            isDisposed
          ) {
            return
          }

          setChatStatus(
            'connected',
          )

          setChatErrorKey(
            null,
          )
        } catch (
          connectionError
        ) {
          console.error(
            connectionError,
          )

          if (
            isDisposed
          ) {
            return
          }

          setChatStatus(
            'disconnected',
          )

          setChatErrorKey(
            'liveStream.chat.connectionFailed',
          )
        }
      }

    void connect()

    return () => {
      isDisposed =
        true

      if (
        chatClientRef.current ===
        chatClient
      ) {
        chatClientRef.current =
          null
      }

      void chatClient.stop()
    }
  }, [
    liveChatClientFactory,
    streamId,
  ])

  useEffect(() => {
    const container =
      chatMessagesRef.current

    if (!container) {
      return
    }

    container.scrollTop =
      container.scrollHeight
  }, [
    chatMessages,
  ])

  const handleSendMessage =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      const chatClient =
        chatClientRef.current

      const message =
        chatDraft.trim()

      if (
        !chatClient ||
        chatStatus !==
          'connected' ||
        !streamId ||
        !message ||
        isSending
      ) {
        return
      }

      try {
        setIsSending(
          true,
        )

        setChatErrorKey(
          null,
        )

        await chatClient.send(
          developmentUserName,
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

        setChatErrorKey(
          'liveStream.chat.sendFailed',
        )
      } finally {
        setIsSending(
          false,
        )
      }
    }

  if (!streamId) {
    return (
      <section className="streams-page">
        <div className="streams-state streams-state-error">
          <strong>
            {t(
              'liveStream.unavailable',
            )}
          </strong>

          <span>
            {t(
              'liveStream.missingId',
            )}
          </span>

          <Link
            className="stream-back-link"
            to="/streamers"
          >
            {t(
              'liveStream.back',
            )}
          </Link>
        </div>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="streams-page">
        <div className="streams-state">
          <strong>
            {t(
              'liveStream.loading',
            )}
          </strong>

          <span>
            {t(
              'liveStream.loadingHint',
            )}
          </span>
        </div>
      </section>
    )
  }

  if (
    hasError ||
    !stream
  ) {
    return (
      <section className="streams-page">
        <div className="streams-state streams-state-error">
          <strong>
            {t(
              'liveStream.unavailable',
            )}
          </strong>

          <span>
            {hasError
              ? t(
                  'liveStream.loadFailed',
                )
              : t(
                  'liveStream.notAvailable',
                )}
          </span>

          <Link
            className="stream-back-link"
            to="/streamers"
          >
            {t(
              'liveStream.back',
            )}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="live-stream-page">
      <div className="live-stream-layout">
        <main className="live-stream-main">
          <div className="live-player-shell">
            <video
              className="live-player"
              src={
                stream.playbackUrl
              }
              controls
              autoPlay
              playsInline
            />

            <div className="live-player-overlay">
              <span className="stream-live-badge">
                {t(
                  'liveStream.live',
                )}
              </span>

              <span className="live-viewer-count">
                {t(
                  'liveStream.watching',
                  {
                    formatted:
                      formatViewerCount(
                        stream.viewerCount,
                        locale,
                      ),
                  },
                )}
              </span>
            </div>
          </div>

          <div className="live-stream-info">
            <div className="live-stream-category">
              {getCategoryLabel(
                stream.category,
              )}
            </div>

            <h1>
              {
                stream.title
              }
            </h1>

            <div className="live-channel-row">
              <div className="live-channel-avatar">
                {stream.channelName
                  .charAt(
                    0,
                  )
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {
                    stream.channelName
                  }
                </strong>

                <span>
                  {t(
                    'liveStream.broadcaster',
                  )}
                </span>
              </div>

              <button
                type="button"
                className="live-follow-button"
                disabled
                title={t(
                  'liveStream.followHint',
                )}
              >
                {t(
                  'liveStream.follow',
                )}
              </button>
            </div>

            <div className="live-description">
              <h2>
                {t(
                  'liveStream.about',
                )}
              </h2>

              <p>
                {
                  stream.description
                }
              </p>

              {stream.tags.length >
                0 && (
                <div className="live-tags">
                  {stream.tags.map(
                    (tag) => (
                      <span
                        key={
                          tag
                        }
                      >
                        #{tag}
                      </span>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        <aside className="live-chat-shell">
          <header className="live-chat-header">
            <div>
              <span className="live-chat-dot" />

              <strong>
                {t(
                  'liveStream.chat.title',
                )}
              </strong>
            </div>

            <div className="live-chat-header-status">
              <span
                className={`live-chat-status-dot ${chatStatus}`}
              />

              <span>
                {getStatusText(
                  chatStatus,
                )}
              </span>
            </div>
          </header>

          <div
            ref={
              chatMessagesRef
            }
            className="live-chat-messages"
          >
            {chatMessages.length ===
            0 ? (
              <div className="live-chat-empty">
                <strong>
                  {t(
                    'liveStream.chat.welcome',
                  )}
                </strong>

                <span>
                  {t(
                    'liveStream.chat.welcomeHint',
                  )}
                </span>
              </div>
            ) : (
              chatMessages.map(
                (message) => (
                  <article
                    key={
                      message.id
                    }
                    className="live-chat-message"
                  >
                    <div className="live-chat-message-head">
                      <strong>
                        {
                          message.userName
                        }
                      </strong>

                      <time>
                        {formatChatTime(
                          message.sentAt,
                          locale,
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

          <div className="live-chat-identity">
            {t(
              'liveStream.chat.chattingAs',
            )}{' '}

            <strong>
              {
                developmentUserName
              }
            </strong>
          </div>

          {chatErrorKey && (
            <div className="live-chat-error">
              {t(
                chatErrorKey,
              )}
            </div>
          )}

          <form
            className="live-chat-compose"
            onSubmit={
              handleSendMessage
            }
          >
            <input
              type="text"
              value={
                chatDraft
              }
              maxLength={
                500
              }
              disabled={
                chatStatus !==
                  'connected' ||
                isSending
              }
              placeholder={
                chatStatus ===
                'connected'
                  ? t(
                      'liveStream.chat.sendPlaceholder',
                    )
                  : t(
                      'liveStream.chat.connectingPlaceholder',
                    )
              }
              onChange={(
                event,
              ) =>
                setChatDraft(
                  event.target
                    .value,
                )
              }
            />

            <button
              type="submit"
              disabled={
                chatStatus !==
                  'connected' ||
                isSending ||
                !chatDraft.trim()
              }
            >
              {isSending
                ? '...'
                : t(
                    'liveStream.chat.send',
                  )}
            </button>
          </form>
        </aside>
      </div>
    </section>
  )
}

export default LiveStreamPage
