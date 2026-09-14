import type {
  CommentItem,
  CommentListOptions,
  CommentReaction,
} from '../../domain/comment/types'

export interface CommentGateway {
  list(
    videoId: string,
    options?: CommentListOptions,
    signal?: AbortSignal,
  ): Promise<CommentItem[]>

  add(
    videoId: string,
    text: string,
    parentCommentId?: string,
  ): Promise<CommentItem>

  update(
    commentId: string,
    text: string,
  ): Promise<CommentItem>

  remove(
    commentId: string,
  ): Promise<void>

  toggleReaction(
    commentId: string,
    reaction: Exclude<CommentReaction, null>,
  ): Promise<CommentItem>
}
