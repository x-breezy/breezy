export interface AuthEmailVerificationEvent {
  userId: string
  email: string
  username?: string
  token: string
  verifyUrl?: string
}

export interface AuthForgotPasswordEvent {
  userId: string
  email: string
  username?: string
  resetToken: string
  resetUrl?: string
}

export interface Auth2FAEvent {
  userId: string
  email: string
  username?: string
  code: string
  expiresAt: string
}

export interface SocialFollowEvent {
  followerId: string
  followingId: string
  username?: string
  avatarId?: string
}

export interface ContentLikeEvent {
  actorId: string
  targetUserId: string
  postId: string
  username?: string
  avatarId?: string
}

export interface ContentMentionEvent {
  actorId: string
  targetUserId: string
  postId: string
  commentId?: string
  username?: string
  avatarId?: string
}

export interface ContentCommentEvent {
  actorId: string
  targetUserId: string
  postId: string
  commentId: string
  username?: string
  avatarId?: string
}

export type BreezyEvent =
  | AuthEmailVerificationEvent
  | AuthForgotPasswordEvent
  | Auth2FAEvent
  | SocialFollowEvent
  | ContentLikeEvent
  | ContentMentionEvent
  | ContentCommentEvent
