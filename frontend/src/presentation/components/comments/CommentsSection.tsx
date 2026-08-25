import {
  type FormEvent,
  useState,
} from 'react'
import {
  useAuthStore,
} from '../../features/auth/authStore'
import {
  getCommentsStorage,
} from '../../features/comments/commentsStorage'
import {
  useAppTranslation,
} from '../../../shared/i18n'
import './CommentsSection.css'

type Reaction =
  | 'like'
  | 'dislike'
  | null

interface CommentItem {
  id: string
  author: string
  text: string
  createdAt: string
  likes: number
  dislikes: number
  reaction: Reaction
  replies: CommentItem[]
}

const storagePrefix =
  'amtlis.video-comments.'

function readComments(
  videoId: string,
): CommentItem[] {
  try {
    const stored = getCommentsStorage().getItem(
      `${storagePrefix}${videoId}`,
    )

    return stored
      ? JSON.parse(stored) as CommentItem[]
      : []
  } catch {
    return []
  }
}

function createComment(
  author: string,
  text: string,
): CommentItem {
  return {
    id: crypto.randomUUID(),
    author,
    text,
    createdAt: new Date().toISOString(),
    likes: 0,
    dislikes: 0,
    reaction: null,
    replies: [],
  }
}

function updateReaction(
  comment: CommentItem,
  reaction: Exclude<Reaction, null>,
): CommentItem {
  const previous = comment.reaction
  const next = previous === reaction
    ? null
    : reaction

  return {
    ...comment,
    reaction: next,
    likes: comment.likes + (next === 'like' ? 1 : 0) - (previous === 'like' ? 1 : 0),
    dislikes: comment.dislikes + (next === 'dislike' ? 1 : 0) - (previous === 'dislike' ? 1 : 0),
  }
}

function CommentCard({
  comment,
  onReaction,
  onReply,
}: {
  comment: CommentItem
  onReaction: (commentId: string, reaction: Exclude<Reaction, null>) => void
  onReply: (commentId: string, text: string) => void
}) {
  const { t } = useAppTranslation()
  const [isReplying, setIsReplying] = useState(false)
  const [reply, setReply] = useState('')

  const submitReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = reply.trim()

    if (!text) {
      return
    }

    onReply(comment.id, text)
    setReply('')
    setIsReplying(false)
  }

  return (
    <article className="comment-card">
      <div className="comment-avatar">
        {comment.author.charAt(0).toUpperCase()}
      </div>
      <div className="comment-content">
        <div className="comment-header">
          <strong>{comment.author}</strong>
          <span>{t('system.comments.justNow')}</span>
        </div>
        <p>{comment.text}</p>
        <div className="comment-actions">
          <button className={comment.reaction === 'like' ? 'is-active' : ''} type="button" onClick={() => onReaction(comment.id, 'like')}>
            ♡ {comment.likes || ''}
          </button>
          <button className={comment.reaction === 'dislike' ? 'is-active' : ''} type="button" onClick={() => onReaction(comment.id, 'dislike')}>
            ♢ {comment.dislikes || ''}
          </button>
          <button type="button" onClick={() => setIsReplying((value) => !value)}>{t('system.comments.reply')}</button>
        </div>
        {isReplying && (
          <form className="comment-reply-form" onSubmit={submitReply}>
            <input value={reply} autoFocus placeholder={t('system.comments.replyPlaceholder')} onChange={(event) => setReply(event.target.value)} />
            <button type="submit">{t('system.comments.send')}</button>
          </form>
        )}
        {comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map((replyItem) => (
              <div className="comment-reply" key={replyItem.id}>
                <div className="comment-avatar comment-avatar-small">{replyItem.author.charAt(0).toUpperCase()}</div>
                <div><strong>{replyItem.author}</strong><p>{replyItem.text}</p></div>
              </div>
            ))}
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
  const { t } = useAppTranslation()
  const profile = useAuthStore((state) => state.profile)
  const [comments, setComments] = useState<CommentItem[]>(() => readComments(videoId))
  const [text, setText] = useState('')

  const persist = (next: CommentItem[]) => {
    getCommentsStorage().setItem(`${storagePrefix}${videoId}`, JSON.stringify(next))
    setComments(next)
  }

  const addComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = text.trim()
    if (!content) return
    persist([createComment(profile?.displayName ?? t('system.comments.guest'), content), ...comments])
    setText('')
  }

  const reactToComment = (commentId: string, reaction: Exclude<Reaction, null>) => {
    persist(comments.map((comment) => comment.id === commentId ? updateReaction(comment, reaction) : comment))
  }

  const replyToComment = (commentId: string, replyText: string) => {
    const author = profile?.displayName ?? t('system.comments.guest')
    persist(comments.map((comment) => comment.id === commentId ? { ...comment, replies: [...comment.replies, createComment(author, replyText)] } : comment))
  }

  return (
    <section className="comments-section">
      <div className="comments-heading">
        <h2>{t('system.comments.title')}</h2>
        <span>{t('system.comments.count', { count: comments.length })}</span>
      </div>
      <form className="comment-compose" onSubmit={addComment}>
        <div className="comment-avatar">{(profile?.displayName ?? t('system.comments.guest')).charAt(0).toUpperCase()}</div>
        <div>
          <textarea value={text} rows={2} maxLength={500} placeholder={t('system.comments.placeholder')} onChange={(event) => setText(event.target.value)} />
          <button type="submit" disabled={!text.trim()}>{t('system.comments.send')}</button>
        </div>
      </form>
      {comments.length === 0 ? (
        <div className="comments-empty">{t('system.comments.empty')}</div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => <CommentCard key={comment.id} comment={comment} onReaction={reactToComment} onReply={replyToComment} />)}
        </div>
      )}
    </section>
  )
}

export default CommentsSection
