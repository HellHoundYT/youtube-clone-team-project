import type {
  CommentGateway,
} from './gateway'
import type {
  CommentItem,
  CommentReaction,
} from '../../domain/comment/types'

export interface CommentService {
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

export function createCommentService(
  gateway: CommentGateway,
): CommentService {
  return {
    list:
      gateway.list,

    add:
      gateway.add,

    toggleReaction:
      gateway.toggleReaction,
  }
}
