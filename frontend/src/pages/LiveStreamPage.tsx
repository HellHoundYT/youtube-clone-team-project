import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import type {
  HubConnection,
} from '@microsoft/signalr'
import {
  Link,
  useParams,
} from 'react-router-dom'
import {
  createLiveChatConnection,
  sendLiveChatMessage,
  startLiveChatConnection,
  stopLiveChatConnection,
  type LiveChatConnectionStatus,
  type LiveChatMessage,
} from '../api/liveChat'
import {
  getLiveStreamById,
  type LiveStreamDetails,
} from '../api/streams'
import './StreamsPages.css'
import './LiveChat.css'

const developmentUserName =
  'Guest Viewer'

function formatViewerCount(
  viewerCount: number,
) {
  return new Intl.NumberFormat(
    'en-US',
  ).format(viewerCount)
}

function formatChatTime(
  sentAt: string,
) {
  return new Intl.DateTimeFormat(
    'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(
    new Date(sentAt),
  )
}

function getStatusText(
  status:
    LiveChatConnectionStatus,
) {
  switch (status) {
    case 'connected':
      return 'Connected'

    case 'reconnecting':
      return 'Reconnecting...'

    case 'disconnected':
      return 'Disconnected'

    default:
      return 'Connecting...'
  }
}

function LiveStreamPage() {
  const { streamId } =
    useParams<{
      streamId: string
    }>()

  const [
    stream,
    setStream,
  ] = useState<
    LiveStreamDetails | null
  >(null)

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    chatMessages,
    setChatMessages,
  ] = useState<
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
    chatError,
    setChatError,
  ] = useState<
    string | null
  >(null)

  const [
    chatDraft,
    setChatDraft,
  ] = useState('')

  const [
    isSending,
    setIsSending,
  ] = useState(false)

  const connectionRef =
    useRef<
      HubConnection | null
    >(null)

  const chatMessagesRef =
    useRef<
      HTMLDivElement | null
    >(null)

  useEffect(() => {
    if (!streamId) {
      return
    }

    const controller =
      new AbortController()

    const loadStream =
      async () => {
        try {
          setIsLoading(true)
          setError(null)

          const data =
            await getLiveStreamById(
              streamId,
              controller.signal,
            )

          setStream(data)
        } catch (
          requestError
        ) {
          if (
            controller.signal.aborted
          ) {
            return
          }

          console.error(
            requestError,
          )

          setError(
            'Live stream could not be loaded.',
          )
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setIsLoading(false)
          }
        }
      }

    void loadStream()

    return () => {
      controller.abort()
    }
  }, [streamId])

  useEffect(() => {
    if (!streamId) {
      return
    }

    let isDisposed =
      false

    const connection =
      createLiveChatConnection(
        streamId,
        {
          onMessage:
            (
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

          onStatusChange:
            (
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

          onError:
            (
              message,
            ) => {
              if (
                isDisposed
              ) {
                return
              }

              setChatError(
                message,
              )
            },
        },
      )

    connectionRef.current =
      connection

    const connect =
      async () => {
        try {
          await startLiveChatConnection(
            connection,
            streamId,
          )

          if (
            isDisposed
          ) {
            return
          }

          setChatStatus(
            'connected',
          )

          setChatError(
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

          setChatError(
            'Live chat connection failed.',
          )
        }
      }

    void connect()

    return () => {
      isDisposed =
        true

      if (
        connectionRef.current ===
        connection
      ) {
        connectionRef.current =
          null
      }

      void stopLiveChatConnection(
        connection,
        streamId,
      )
    }
  }, [streamId])

  useEffect(() => {
    const container =
      chatMessagesRef.current

    if (!container) {
      return
    }

    container.scrollTop =
      container.scrollHeight
  }, [chatMessages])

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

        setChatError(
          null,
        )

        await sendLiveChatMessage(
          connection,
          streamId,
          developmentUserName,
          message,
        )

        setChatDraft('')
      } catch (
        sendError
      ) {
        console.error(
          sendError,
        )

        setChatError(
          'Message could not be sent.',
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
            Stream unavailable
          </strong>

          <span>
            Stream id is missing.
          </span>

          <Link
            className="stream-back-link"
            to="/streamers"
          >
            Back to streams
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
            Loading stream...
          </strong>

          <span>
            Connecting to the broadcast.
          </span>
        </div>
      </section>
    )
  }

  if (
    error ||
    !stream
  ) {
    return (
      <section className="streams-page">
        <div className="streams-state streams-state-error">
          <strong>
            Stream unavailable
          </strong>

          <span>
            {error ??
              'This broadcast is not available.'}
          </span>

          <Link
            className="stream-back-link"
            to="/streamers"
          >
            Back to streams
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
                LIVE
              </span>

              <span className="live-viewer-count">
                {formatViewerCount(
                  stream.viewerCount,
                )}{' '}
                watching
              </span>
            </div>
          </div>

          <div className="live-stream-info">
            <div className="live-stream-category">
              {
                stream.category
              }
            </div>

            <h1>
              {stream.title}
            </h1>

            <div className="live-channel-row">
              <div className="live-channel-avatar">
                {stream.channelName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {
                    stream.channelName
                  }
                </strong>

                <span>
                  Live broadcaster
                </span>
              </div>

              <button
                type="button"
                className="live-follow-button"
                disabled
                title="Subscriptions will be connected with the Channels module."
              >
                Follow
              </button>
            </div>

            <div className="live-description">
              <h2>
                About this stream
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
                        key={tag}
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
                Live chat
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
                  Welcome to live chat
                </strong>

                <span>
                  Messages from viewers
                  will appear here.
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
            Chatting as{' '}
            <strong>
              {
                developmentUserName
              }
            </strong>
          </div>

          {chatError && (
            <div className="live-chat-error">
              {chatError}
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
              maxLength={500}
              disabled={
                chatStatus !==
                  'connected' ||
                isSending
              }
              placeholder={
                chatStatus ===
                'connected'
                  ? 'Send a message...'
                  : 'Connecting to chat...'
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
                : 'Send'}
            </button>
          </form>
        </aside>
      </div>
    </section>
  )
}

export default LiveStreamPage