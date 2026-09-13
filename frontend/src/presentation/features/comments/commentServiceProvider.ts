import type {
  CommentService,
} from '../../../application/comment/service'

let configuredCommentService:
CommentService | null = null

export function configureCommentService(
  commentService: CommentService,
) {
  configuredCommentService =
    commentService
}

export function getCommentService():
CommentService {
  if (!configuredCommentService) {
    throw new Error(
      'Comment service is not configured.',
    )
  }

  return configuredCommentService
}
