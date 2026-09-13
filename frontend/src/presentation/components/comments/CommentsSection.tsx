import {
  type FormEvent,
  useEffect,
  useState,
} from 'react'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'
import type {
  CommentItem,
  CommentReaction,
} from '../../../domain/comment/types'
import {
  useAuthStore,
} from '../../features/auth/authStore'
import {
  getCommentService,
} from '../../features/comments/commentServiceProvider'
import {
  useAppTranslation,
} from '../../../shared/i18n'
import './CommentsSection.css'

function CommentAvatar({
  comment,
  small = false,
}: {
  comment: CommentItem
  small?: boolean
}) {
  return (
    <div
      className={`comment-avatar ${
        small
          ? 'comment-avatar-small'
          : ''
      }`}
    >
      {comment.authorAvatarUrl ? (
        <img
          src={comment.authorAvatarUrl}
          alt=""
        />
      ) : (
        comment.author
          .charAt(0)
          .toUpperCase()
      )}
    </div>
  )
}

function CommentCard({
  comment,
  onReaction,
  onReply,
}: {
  comment: CommentItem
  onReaction: (
    commentId: string,
    reaction: Exclude<CommentReaction, null>,
  ) => Promise<void>
  onReply: (
    commentId: string,
    text: string,
  ) => Promise<void>
}) {
  const {
    t,
  } = useAppTranslation()
  const [isReplying, setIsReplying] =
    useState(false)
  const [reply, setReply] =
    useState('')

  const submitReply = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    const text = reply.trim()

    if (!text) {
      return
    }

    await onReply(
      comment.id,
      text,
    )
    setReply('')
    setIsReplying(false)
  }

  return (
    <article className="comment-card">
      <CommentAvatar comment={comment} />

      <div className="comment-content">
        <div className="comment-header">
          <strong>{comment.author}</strong>
          <span>{t('system.comments.justNow')}</span>
        </div>

        <p>{comment.text}</p>

        <div className="comment-actions">
          <button
            className={
              comment.reaction === 'like'
                ? 'is-active'
                : ''
            }
            type="button"
            onClick={() => {
              void onReaction(
                comment.id,
                'like',
              )
            }}
          >
            ♡ {comment.likes || ''}
          </button>

          <button
            className={
              comment.reaction === 'dislike'
                ? 'is-active'
                : ''
            }
            type="button"
            onClick={() => {
              void onReaction(
                comment.id,
                'dislike',
              )
            }}
          >
            ♢ {comment.dislikes || ''}
          </button>

          <button
            type="button"
            onClick={() =>
              setIsReplying(
                (value) => !value,
              )
            }
          >
            {t('system.comments.reply')}
          </button>
        </div>

        {isReplying && (
          <form
            className="comment-reply-form"
            onSubmit={(event) => {
              void submitReply(event)
            }}
          >
            <input
              value={reply}
              autoFocus
              maxLength={500}
              placeholder={t(
                'system.comments.replyPlaceholder',
              )}
              onChange={(event) =>
                setReply(
                  event.target.value,
                )
              }
            />
            <button type="submit">
              {t('system.comments.send')}
            </button>
          </form>
        )}

        {comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map(
              (replyItem) => (
                <div
                  className="comment-reply"
                  key={replyItem.id}
                >
                  <CommentAvatar
                    comment={replyItem}
                    small
                  />
                  <div>
                    <strong>
                      {replyItem.author}
                    </strong>
                    <p>{replyItem.text}</p>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function CommentsSection({
  videoId,
}: {
  videoId: string
}) {
  const {
    t,
  } = useAppTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const commentService =
    getCommentService()
  const profile = useAuthStore(
    (state) => state.profile,
  )
  const [comments, setComments] =
    useState<CommentItem[]>([])
  const [text, setText] =
    useState('')
  const [isLoading, setIsLoading] =
    useState(true)
  const [error, setError] =
    useState('')

  useEffect(() => {
    const controller =
      new AbortController()

    void commentService
      .list(
        videoId,
        controller.signal,
      )
      .then((items) => {
        setError('')
        setComments(items)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(
            t('system.comments.requestFailed'),
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [
    commentService,
    profile?.id,
    t,
    videoId,
  ])

  const requireProfile = () => {
    if (profile) {
      return true
    }

    navigate(
      '/auth',
      {
        state: {
          from:
            location.pathname,
        },
      },
    )
    return false
  }

  const addComment = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    const content = text.trim()

    if (!content ||
        !requireProfile()) {
      return
    }

    try {
      setError('')
      const created =
        await commentService.add(
          videoId,
          content,
        )

      setComments(
        (current) => [
          created,
          ...current,
        ],
      )
      setText('')
    } catch {
      setError(
        t('system.comments.requestFailed'),
      )
    }
  }

  const reactToComment = async (
    commentId: string,
    reaction:
      Exclude<CommentReaction, null>,
  ) => {
    if (!requireProfile()) {
      return
    }

    try {
      setError('')
      const updated =
        await commentService.toggleReaction(
          commentId,
          reaction,
        )

      setComments(
        (current) =>
          current.map(
            (comment) =>
              comment.id === updated.id
                ? updated
                : comment,
          ),
      )
    } catch {
      setError(
        t('system.comments.requestFailed'),
      )
    }
  }

  const replyToComment = async (
    commentId: string,
    replyText: string,
  ) => {
    if (!requireProfile()) {
      return
    }

    try {
      setError('')
      const created =
        await commentService.add(
          videoId,
          replyText,
          commentId,
        )

      setComments(
        (current) =>
          current.map(
            (comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    replies: [
                      ...comment.replies,
                      created,
                    ],
                  }
                : comment,
          ),
      )
    } catch {
      setError(
        t('system.comments.requestFailed'),
      )
    }
  }

  const composerName =
    profile?.displayName ??
    t('system.comments.guest')

  return (
    <section className="comments-section">
      <div className="comments-heading">
        <h2>{t('system.comments.title')}</h2>
        <span>
          {t(
            'system.comments.count',
            {
              count:
                comments.length,
            },
          )}
        </span>
      </div>

      <form
        className="comment-compose"
        onSubmit={(event) => {
          void addComment(event)
        }}
      >
        <div className="comment-avatar">
          {composerName
            .charAt(0)
            .toUpperCase()}
        </div>
        <div>
          <textarea
            value={text}
            rows={2}
            maxLength={500}
            placeholder={t(
              profile
                ? 'system.comments.placeholder'
                : 'system.comments.signInToComment',
            )}
            onChange={(event) =>
              setText(
                event.target.value,
              )
            }
          />
          <button
            type="submit"
            disabled={!text.trim()}
          >
            {t('system.comments.send')}
          </button>
        </div>
      </form>

      {error && (
        <div className="comments-empty">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="comments-empty">
          {t('system.comments.loading')}
        </div>
      ) : comments.length === 0 ? (
        <div className="comments-empty">
          {t('system.comments.empty')}
        </div>
      ) : (
        <div className="comments-list">
          {comments.map(
            (comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onReaction={reactToComment}
                onReply={replyToComment}
              />
            ),
          )}
        </div>
      )}
    </section>
  )
}

export default CommentsSection
