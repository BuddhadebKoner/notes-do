// Centralized query keys for React Query
export const QUERY_KEYS = {
  // Auth related queries
  LOGIN_USER: ['auth', 'login'],
  CREATE_USER: ['auth', 'create-user'],
  CHECK_LOGIN: ['auth', 'check-login'],
  USER_PROFILE: ['auth', 'profile'],

  // Notes related queries
  UPLOAD_NOTE: ['notes', 'upload'],
  GET_NOTES_FEED: (page, limit, filters) => [
    'notes',
    'feed',
    { page, limit, ...filters },
  ],
  GET_NOTE: ['notes', 'detail'],
  LIKE_NOTE: ['notes', 'like'],
  UNLIKE_NOTE: ['notes', 'unlike'],

  // Profile related queries
  GET_PROFILE: ['profile', 'details'],
  UPDATE_PROFILE: ['profile', 'update'],
  GET_PUBLIC_PROFILE: username => ['profile', 'public', username],
  GET_PUBLIC_USER_NOTES: (username, page, limit, sortBy, sortOrder) => [
    'profile',
    'public-notes',
    username,
    { page, limit, sortBy, sortOrder },
  ],
  GET_PUBLIC_USER_FOLLOWERS: (username, page, limit) => [
    'profile',
    'public-followers',
    username,
    { page, limit },
  ],
  GET_UPLOADED_NOTES: (page, limit, sortBy, sortOrder) => [
    'profile',
    'uploaded-notes',
    { page, limit, sortBy, sortOrder },
  ],
  GET_WISHLIST: (page, limit) => ['profile', 'wishlist', { page, limit }],
  GET_FAVORITES: (page, limit) => ['profile', 'favorites', { page, limit }],
  GET_FOLLOWERS: ['profile', 'followers'],
  GET_FOLLOWING: ['profile', 'following'],
  GET_ACTIVITY_STATS: ['profile', 'activity-stats'],
  FOLLOW_USER: ['profile', 'follow'],
  UNFOLLOW_USER: ['profile', 'unfollow'],

  // Comments related queries
  GET_COMMENTS: (noteId, page, limit) => [
    'comments',
    'list',
    noteId,
    { page, limit },
  ],
  ADD_COMMENT: ['comments', 'add'],
  LIKE_COMMENT: ['comments', 'like'],
  UNLIKE_COMMENT: ['comments', 'unlike'],
  ADD_REPLY: ['comments', 'reply'],
}
