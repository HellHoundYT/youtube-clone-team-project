import axios from 'axios'
import type {
  CommentGateway,
} from '../../application/comment/gateway'
import type {
  CommentItem,
  CommentReaction,
} from '../../domain/comment/types'
import {
  createAuthorizedConfig,
  createOptionalAuthorizedConfig,
  withAuthenticatedRequest,
} from './authSession'

export const commentGateway:
CommentGateway = {
  async list(
    videoId,
    signal,
  ) {
    const response =
      await axios.get<CommentItem[]>(
        `/api/v1/videos/${encodeURIComponent(videoId)}/comments`,
        {
          signal,
          ...createOptionalAuthorizedConfig(),
        },
      )

    return response.data
  },

  async add(
    videoId,
    text,
    parentCommentId,
  ) {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.post<CommentItem>(
            `/api/v1/videos/${encodeURIComponent(videoId)}/comments`,
            {
              text,
              parentCommentId:
                parentCommentId ?? null,
            },
            {
              withCredentials:
                true,
              ...createAuthorizedConfig(token),
            },
          ),
      )

    return response.data
  },

  async toggleReaction(
    commentId,
    reaction:
      Exclude<CommentReaction, null>,
  ) {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.post<CommentItem>(
            `/api/v1/comments/${encodeURIComponent(commentId)}/reaction`,
            {
              reaction,
            },
            {
              withCredentials:
                true,
              ...createAuthorizedConfig(token),
            },
          ),
      )

    return response.data
  },
}
