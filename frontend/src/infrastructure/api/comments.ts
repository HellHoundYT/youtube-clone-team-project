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
    options = {},
    signal,
  ) {
    const response =
      await axios.get<CommentItem[]>(
        `/api/v1/videos/${encodeURIComponent(videoId)}/comments`,
        {
          signal,
          params: {
            page: options.page ?? 1,
            pageSize: options.pageSize ?? 20,
            sort: options.sort ?? 'newest',
          },
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

  async update(
    commentId,
    text,
  ) {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.put<CommentItem>(
            `/api/v1/comments/${encodeURIComponent(commentId)}`,
            {
              text,
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

  async remove(
    commentId,
  ) {
    await withAuthenticatedRequest(
      (token) =>
        axios.delete(
          `/api/v1/comments/${encodeURIComponent(commentId)}`,
          {
            withCredentials:
              true,
            ...createAuthorizedConfig(token),
          },
        ),
    )
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
