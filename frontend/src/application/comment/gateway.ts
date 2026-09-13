import type {
  CommentItem,
  CommentReaction,
} from '../../domain/comment/types'

export interface CommentGateway {
  list(
    videoId: string,
    signal?: AbortSignal,
  ): Promise<CommentItem[]>

  add(
    videoId: string,
    text: string,
    parentCommentId?: string,
  ): Promise<CommentItem>

  toggleReaction(
    commentId: string,
    reaction: Exclude<CommentReaction, null>,
  ): Promise<CommentItem>
}
