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
  CommentSort,
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

const pageSize = 20

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

function CommentOwnerActions({
  comment,
  viewerId,
  onEdit,
  onDelete,
}: {
  comment: CommentItem
  viewerId?: string
  onEdit: (
    commentId: string,
    text: string,
  ) => Promise<void>
  onDelete: (
    commentId: string,
  ) => Promise<void>
}) {
  const { t } = useAppTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)
  const [isBusy, setIsBusy] = useState(false)

  if (!viewerId || viewerId !== comment.authorId) {
    return null
  }

  const save = async () => {
    const text = draft.trim()

    if (!text || text === comment.text || isBusy) {
      setIsEditing(false)
      setDraft(comment.text)
      return
    }

    setIsBusy(true)
    try {
      await onEdit(comment.id, text)
      setIsEditing(false)
    } finally {
      setIsBusy(false)
    }
  }

  const remove = async () => {
    if (isBusy || !window.confirm(
      t('system.comments.deleteConfirm'),
    )) {
      return
    }

    setIsBusy(true)
    try {
      await onDelete(comment.id)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="comment-owner-actions">
      {isEditing ? (
        <>
          <input
            value={draft}
            maxLength={500}
            disabled={isBusy}
            onChange={(event) =>
              setDraft(event.target.value)}
          />
          <button
            type="button"
            disabled={isBusy || !draft.trim()}
            onClick={() => {
              void save()
            }}
          >
            {t('system.comments.save')}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setDraft(comment.text)
              setIsEditing(false)
            }}
          >
            {t('system.comments.cancel')}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setIsEditing(true)}
          >
            {t('system.comments.edit')}
          </button>
          <button
            type="button"
            className="comment-delete-action"
            disabled={isBusy}
            onClick={() => {
              void remove()
            }}
          >
            {t('system.comments.delete')}
          </button>
        </>
      )}
    </div>
  )
}

function CommentCard({
  comment,
  viewerId,
  onReaction,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: CommentItem
  viewerId?: string
  onReaction: (
    commentId: string,
    reaction: Exclude<CommentReaction, null>,
  ) => Promise<void>
  onReply: (
    commentId: string,
    text: string,
  ) => Promise<void>
  onEdit: (
    commentId: string,
    text: string,
  ) => Promise<void>
  onDelete: (
    commentId: string,
  ) => Promise<void>
}) {
  const { t } = useAppTranslation()
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

        <CommentOwnerActions
          comment={comment}
          viewerId={viewerId}
          onEdit={onEdit}
          onDelete={onDelete}
        />

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
                  <div className="comment-reply-content">
                    <strong>
                      {replyItem.author}
                    </strong>
                    <p>{replyItem.text}</p>
                    <div className="comment-actions">
                      <button
                        className={
                          replyItem.reaction === 'like'
                            ? 'is-active'
                            : ''
                        }
                        type="button"
                        onClick={() => {
                          void onReaction(
                            replyItem.id,
                            'like',
                          )
                        }}
                      >
                        ♡ {replyItem.likes || ''}
                      </button>
                      <button
                        className={
                          replyItem.reaction === 'dislike'
                            ? 'is-active'
                            : ''
                        }
                        type="button"
                        onClick={() => {
                          void onReaction(
                            replyItem.id,
                            'dislike',
                          )
                        }}
                      >
                        ♢ {replyItem.dislikes || ''}
                      </button>
                    </div>
                    <CommentOwnerActions
                      comment={replyItem}
                      viewerId={viewerId}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
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
  compact = false,
}: {
  videoId: string
  compact?: boolean
}) {
  const { t } = useAppTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const commentService = getCommentService()
  const profile = useAuthStore(
    (state) => state.profile,
  )
  const [comments, setComments] =
    useState<CommentItem[]>([])
  const [text, setText] =
    useState('')
  const [sort, setSort] =
    useState<CommentSort>('newest')
  const [page, setPage] =
    useState(1)
  const [hasMore, setHasMore] =
    useState(false)
  const [isLoading, setIsLoading] =
    useState(true)
  const [isLoadingMore, setIsLoadingMore] =
    useState(false)
  const [error, setError] =
    useState('')

  useEffect(() => {
    const controller = new AbortController()

    setIsLoading(true)
    setPage(1)

    void commentService
      .list(
        videoId,
        {
          page: 1,
          pageSize,
          sort,
        },
        controller.signal,
      )
      .then((items) => {
        setError('')
        setComments(items)
        setHasMore(items.length === pageSize)
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

    return () => controller.abort()
  }, [
    commentService,
    profile?.id,
    sort,
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
          from: location.pathname,
        },
      },
    )
    return false
  }

  const reload = async () => {
    const items = await commentService.list(
      videoId,
      {
        page: 1,
        pageSize: page * pageSize,
        sort,
      },
    )
    setComments(items)
    setHasMore(items.length === page * pageSize)
  }

  const addComment = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    const content = text.trim()

    if (!content || !requireProfile()) {
      return
    }

    try {
      setError('')
      await commentService.add(
        videoId,
        content,
      )
      setText('')
      await reload()
    } catch {
      setError(
        t('system.comments.requestFailed'),
      )
    }
  }

  const reactToComment = async (
    commentId: string,
    reaction: Exclude<CommentReaction, null>,
  ) => {
    if (!requireProfile()) {
      return
    }

    try {
      setError('')
      await commentService.toggleReaction(
        commentId,
        reaction,
      )
      await reload()
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
      await commentService.add(
        videoId,
        replyText,
        commentId,
      )
      await reload()
    } catch {
      setError(
        t('system.comments.requestFailed'),
      )
    }
  }

  const editComment = async (
    commentId: string,
    updatedText: string,
  ) => {
    try {
      setError('')
      await commentService.update(
        commentId,
        updatedText,
      )
      await reload()
    } catch {
      setError(
        t('system.comments.requestFailed'),
      )
    }
  }

  const deleteComment = async (
    commentId: string,
  ) => {
    try {
      setError('')
      await commentService.remove(commentId)
      await reload()
    } catch {
      setError(
        t('system.comments.requestFailed'),
      )
    }
  }

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) {
      return
    }

    const nextPage = page + 1
    setIsLoadingMore(true)

    try {
      const items = await commentService.list(
        videoId,
        {
          page: nextPage,
          pageSize,
          sort,
        },
      )
      setComments((current) => [
        ...current,
        ...items,
      ])
      setPage(nextPage)
      setHasMore(items.length === pageSize)
    } catch {
      setError(
        t('system.comments.requestFailed'),
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  const composerName =
    profile?.displayName ??
    t('system.comments.guest')

  return (
    <section
      className={
        compact
          ? 'comments-section comments-section-compact'
          : 'comments-section'
      }
    >
      <div className="comments-heading">
        <div className="comments-heading-copy">
          <h2>{t('system.comments.title')}</h2>
          <span>
            {t(
              'system.comments.count',
              {
                count: comments.length,
              },
            )}
          </span>
        </div>
        <select
          className="comments-sort"
          value={sort}
          aria-label={t('system.comments.sortLabel')}
          onChange={(event) =>
            setSort(event.target.value as CommentSort)}
        >
          <option value="newest">
            {t('system.comments.sortNewest')}
          </option>
          <option value="oldest">
            {t('system.comments.sortOldest')}
          </option>
          <option value="top">
            {t('system.comments.sortTop')}
          </option>
        </select>
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
        <>
          <div className="comments-list">
            {comments.map(
              (comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  viewerId={profile?.id}
                  onReaction={reactToComment}
                  onReply={replyToComment}
                  onEdit={editComment}
                  onDelete={deleteComment}
                />
              ),
            )}
          </div>

          {hasMore && (
            <button
              className="comments-load-more"
              type="button"
              disabled={isLoadingMore}
              onClick={() => {
                void loadMore()
              }}
            >
              {isLoadingMore
                ? t('system.comments.loading')
                : t('system.comments.loadMore')}
            </button>
          )}
        </>
      )}
    </section>
  )
}

export default CommentsSection
