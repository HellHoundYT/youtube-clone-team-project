export type CommentReaction =
  | 'like'
  | 'dislike'
  | null

export interface CommentItem {
  id: string
  videoId: string
  authorId: string
  parentCommentId: string | null
  author: string
  authorAvatarUrl: string | null
  text: string
  createdAt: string
  likes: number
  dislikes: number
  reaction: CommentReaction
  replies: CommentItem[]
}
