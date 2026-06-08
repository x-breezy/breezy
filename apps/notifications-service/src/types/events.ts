export interface AuthEmailVerificationEvent {
  userId: string
  email: string
  token: string
}

export interface AuthForgotPasswordEvent {
  userId: string
  email: string
  resetToken: string
}

export interface Auth2FAEvent {
  userId: string
  email: string
  code: string
  expiresAt: string
}

export interface SocialFollowEvent {
  followerId: string
  followingId: string
}

export interface ContentLikeEvent {
  actorId: string
  targetUserId: string
  postId: string
}

export interface ContentMentionEvent {
  actorId: string
  targetUserId: string
  postId: string
  commentId?: string
}

export type BreezyEvent =
  | AuthEmailVerificationEvent
  | AuthForgotPasswordEvent
  | Auth2FAEvent
  | SocialFollowEvent
  | ContentLikeEvent
  | ContentMentionEvent
