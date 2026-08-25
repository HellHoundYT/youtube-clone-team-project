import {
  useEffect,
  useMemo,
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
  LiveChatSessionStore,
} from '../../application/liveChat/sessionStore'
import type {
  LiveChatConnectionStatus,
  LiveChatMessage,
  LiveChatReactionUpdate,
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

const reactionOptions = [
  {
    emoji: '\u2764\uFE0F',
    tone: 'heart',
  },
  {
    emoji: '\u{1F44D}',
    tone: 'like',
  },
  {
    emoji: '\u{1F602}',
    tone: 'laugh',
  },
  {
    emoji: '\u{1F62E}',
    tone: 'wow',
  },
  {
    emoji: '\u{1F622}',
    tone: 'sad',
  },
  {
    emoji: '\u{1F525}',
    tone: 'fire',
  },
] as const

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

function upsertMessage(
  messages: LiveChatMessage[],
  incoming: LiveChatMessage,
) {
  const index =
    messages.findIndex(
      message =>
        message.id ===
        incoming.id,
    )

  if (index < 0) {
    return [
      ...messages,
      incoming,
    ].slice(
      -200,
    )
  }

  const next =
    [...messages]

  next[index] =
    incoming

  return next
}

function applyReactionUpdate(
  message: LiveChatMessage,
  update: LiveChatReactionUpdate,
) {
  if (
    message.id !==
    update.messageId
  ) {
    return message
  }

  const existing =
    message.reactions.find(
      reaction =>
        reaction.emoji ===
        update.emoji,
    )

  const reactedByCurrentSession =
    update.reactedByCurrentSession ??
    existing?.reactedByCurrentSession ??
    false

  if (update.count <= 0) {
    return {
      ...message,
      reactions:
        message.reactions.filter(
          reaction =>
            reaction.emoji !==
            update.emoji,
        ),
    }
  }

  const nextReaction = {
    emoji:
      update.emoji,

    count:
      update.count,

    reactedByCurrentSession,
  }

  if (!existing) {
    return {
      ...message,
      reactions: [
        ...message.reactions,
        nextReaction,
      ],
    }
  }

  return {
    ...message,
    reactions:
      message.reactions.map(
        reaction =>
          reaction.emoji ===
          update.emoji
            ? nextReaction
            : reaction,
      ),
  }
}

interface LiveStreamPageProps {
  liveChatClientFactory: LiveChatClientFactory
  liveChatSessionStore: LiveChatSessionStore
  streamService: StreamService
}

function LiveStreamPage({
  liveChatClientFactory,
  liveChatSessionStore,
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

  const [
    editingMessageId,
    setEditingMessageId,
  ] =
    useState<
      string | null
    >(null)

  const [
    editingDraft,
    setEditingDraft,
  ] =
    useState('')

  const [
    replyTargetId,
    setReplyTargetId,
  ] =
    useState<
      string | null
    >(null)

  const [
    replyDraft,
    setReplyDraft,
  ] =
    useState('')

  const chatClientRef =
    useRef<
      LiveChatClient | null
    >(null)

  const chatMessagesRef =
    useRef<
      HTMLDivElement | null
    >(null)

  const topLevelMessages =
    useMemo(
      () =>
        chatMessages.filter(
          message =>
            !message.parentMessageId,
        ),
      [
        chatMessages,
      ],
    )

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

    const sessionId =
      liveChatSessionStore
        .getSessionId()

    const chatClient =
      liveChatClientFactory.create(
        streamId,
        sessionId,
        {
          onSnapshot: (
            messages,
          ) => {
            if (
              isDisposed
            ) {
              return
            }

            setChatMessages(
              messages,
            )
          },

          onMessageAdded: (
            message,
          ) => {
            if (
              isDisposed
            ) {
              return
            }

            setChatMessages(
              current =>
                upsertMessage(
                  current,
                  message,
                ),
            )
          },

          onMessageUpdated: (
            message,
          ) => {
            if (
              isDisposed
            ) {
              return
            }

            setChatMessages(
              current =>
                upsertMessage(
                  current,
                  message,
                ),
            )
          },

          onMessagesDeleted: (
            messageIds,
          ) => {
            if (
              isDisposed
            ) {
              return
            }

            const removed =
              new Set(
                messageIds,
              )

            setChatMessages(
              current =>
                current.filter(
                  message =>
                    !removed.has(
                      message.id,
                    ),
                ),
            )
          },

          onReactionUpdated: (
            update,
          ) => {
            if (
              isDisposed
            ) {
              return
            }

            setChatMessages(
              current =>
                current.map(
                  message =>
                    applyReactionUpdate(
                      message,
                      update,
                    ),
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
    liveChatSessionStore,
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

  const startEditingMessage = (
    message:
      LiveChatMessage,
  ) => {
    if (!message.isOwn) {
      return
    }

    setEditingMessageId(
      message.id,
    )

    setEditingDraft(
      message.message,
    )
  }

  const saveEditedMessage =
    async (
      messageId: string,
    ) => {
      const chatClient =
        chatClientRef.current

      const message =
        editingDraft.trim()

      if (
        !chatClient ||
        !message
      ) {
        return
      }

      try {
        setChatErrorKey(
          null,
        )

        await chatClient.edit(
          messageId,
          message,
        )

        setEditingMessageId(
          null,
        )

        setEditingDraft(
          '',
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        setChatErrorKey(
          'liveStream.chat.genericError',
        )
      }
    }

  const deleteMessage =
    async (
      messageId: string,
    ) => {
      const chatClient =
        chatClientRef.current

      if (!chatClient) {
        return
      }

      try {
        setChatErrorKey(
          null,
        )

        await chatClient.delete(
          messageId,
        )

        setEditingMessageId(
          null,
        )

        setEditingDraft(
          '',
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        setChatErrorKey(
          'liveStream.chat.genericError',
        )
      }
    }

  const submitReply =
    async (
      messageId: string,
    ) => {
      const chatClient =
        chatClientRef.current

      const message =
        replyDraft.trim()

      if (
        !chatClient ||
        !message
      ) {
        return
      }

      try {
        setChatErrorKey(
          null,
        )

        await chatClient.reply(
          messageId,
          developmentUserName,
          message,
        )

        setReplyTargetId(
          null,
        )

        setReplyDraft(
          '',
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        setChatErrorKey(
          'liveStream.chat.genericError',
        )
      }
    }

  const toggleReaction =
    async (
      messageId: string,
      emoji: string,
    ) => {
      const chatClient =
        chatClientRef.current

      if (!chatClient) {
        return
      }

      try {
        setChatErrorKey(
          null,
        )

        await chatClient.toggleReaction(
          messageId,
          emoji,
        )
      } catch (
        error
      ) {
        console.error(
          error,
        )

        setChatErrorKey(
          'liveStream.chat.genericError',
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
            {topLevelMessages.length ===
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
              topLevelMessages.map(
                (message) => {
                  const replies =
                    chatMessages.filter(
                      item =>
                        item.parentMessageId ===
                        message.id,
                    )

                  return (
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

                        <button
                          type="button"
                          className="live-chat-reply-trigger"
                          onClick={() => {
                            setReplyTargetId(
                              message.id,
                            )
                            setReplyDraft(
                              '',
                            )
                          }}
                        >
                          {t(
                            'liveStream.chat.reply',
                          )}
                        </button>

                        {message.isOwn && (
                          <div className="live-chat-actions">
                            <button
                              type="button"
                              onClick={() =>
                                startEditingMessage(
                                  message,
                                )
                              }
                            >
                              {t(
                                'liveStream.chat.edit',
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                void deleteMessage(
                                  message.id,
                                )
                              }}
                            >
                              {t(
                                'liveStream.chat.delete',
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {editingMessageId ===
                      message.id ? (
                        <form
                          className="live-chat-edit"
                          onSubmit={(
                            event,
                          ) => {
                            event.preventDefault()

                            void saveEditedMessage(
                              message.id,
                            )
                          }}
                        >
                          <input
                            value={
                              editingDraft
                            }
                            maxLength={
                              500
                            }
                            autoFocus
                            onChange={(
                              event,
                            ) =>
                              setEditingDraft(
                                event.target
                                  .value,
                              )
                            }
                          />

                          <button
                            type="submit"
                            disabled={
                              !editingDraft.trim()
                            }
                          >
                            {t(
                              'liveStream.chat.save',
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(
                                null,
                              )
                              setEditingDraft(
                                '',
                              )
                            }}
                          >
                            {t(
                              'liveStream.chat.cancel',
                            )}
                          </button>
                        </form>
                      ) : (
                        <p>
                          {
                            message.message
                          }
                        </p>
                      )}

                      <div className="live-chat-reaction-picker">
                        {reactionOptions.map(
                          (
                            reaction,
                          ) => (
                            <button
                              type="button"
                              key={
                                reaction.emoji
                              }
                              aria-label={`${t(
                                'liveStream.chat.react',
                              )} ${reaction.emoji}`}
                              onClick={() => {
                                void toggleReaction(
                                  message.id,
                                  reaction.emoji,
                                )
                              }}
                            >
                              {
                                reaction.emoji
                              }
                            </button>
                          ),
                        )}
                      </div>

                      {message.reactions.length >
                        0 && (
                        <div className="live-chat-reactions">
                          {message.reactions.map(
                            (
                              reaction,
                            ) => {
                              const tone =
                                reactionOptions.find(
                                  option =>
                                    option.emoji ===
                                    reaction.emoji,
                                )?.tone ??
                                'like'

                              return (
                                <button
                                  type="button"
                                  key={
                                    reaction.emoji
                                  }
                                  className={`reaction-${tone}${reaction.reactedByCurrentSession ? ' is-active' : ''}`}
                                  onClick={() => {
                                    void toggleReaction(
                                      message.id,
                                      reaction.emoji,
                                    )
                                  }}
                                >
                                  {
                                    reaction.emoji
                                  }
                                  <span>
                                    {
                                      reaction.count
                                    }
                                  </span>
                                </button>
                              )
                            },
                          )}
                        </div>
                      )}

                      {replies.map(
                        (
                          reply,
                        ) => (
                          <div
                            className="live-chat-reply"
                            key={
                              reply.id
                            }
                          >
                            <strong>
                              {
                                reply.userName
                              }
                            </strong>

                            <time>
                              {formatChatTime(
                                reply.sentAt,
                                locale,
                              )}
                            </time>

                            <p>
                              {
                                reply.message
                              }
                            </p>
                          </div>
                        ),
                      )}

                      {replyTargetId ===
                        message.id && (
                        <form
                          className="live-chat-reply-form"
                          onSubmit={(
                            event,
                          ) => {
                            event.preventDefault()

                            void submitReply(
                              message.id,
                            )
                          }}
                        >
                          <input
                            value={
                              replyDraft
                            }
                            maxLength={
                              500
                            }
                            autoFocus
                            placeholder={t(
                              'liveStream.chat.replyPlaceholder',
                            )}
                            onChange={(
                              event,
                            ) =>
                              setReplyDraft(
                                event.target
                                  .value,
                              )
                            }
                          />

                          <button
                            type="submit"
                            disabled={
                              !replyDraft.trim()
                            }
                          >
                            {t(
                              'liveStream.chat.reply',
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReplyTargetId(
                                null,
                              )
                              setReplyDraft(
                                '',
                              )
                            }}
                          >
                            {t(
                              'liveStream.chat.cancel',
                            )}
                          </button>
                        </form>
                      )}
                    </article>
                  )
                },
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