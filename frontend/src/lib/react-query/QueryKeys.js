// Centralized query keys for React Query
export const QUERY_KEYS = {
  // Auth related queries
  LOGIN_USER: ['auth', 'login'],
  CREATE_USER: ['auth', 'create-user'],
  CHECK_LOGIN: ['auth', 'check-login'],
  USER_PROFILE: ['auth', 'profile'],

  // Notes related queries
  UPLOAD_NOTE: ['notes', 'upload'],
  UPDATE_NOTE: ['notes', 'update'],
  GET_NOTES_FEED: (page, limit, filters) => [
    'notes',
    'feed',
    { page, limit, ...filters },
  ],
  GET_NOTE: ['notes', 'detail'],
  LIKE_NOTE: ['notes', 'like'],
  UNLIKE_NOTE: ['notes', 'unlike'],
  DELETE_NOTE: ['notes', 'delete'],

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
  GET_WISHLIST: (page, limit) => ['profile', 'wishlist', { page, limit }], // Legacy
  GET_FAVORITES: (page, limit) => ['profile', 'favorites', { page, limit }],
  GET_FOLLOWERS: ['profile', 'followers'],
  GET_FOLLOWING: ['profile', 'following'],
  GET_ACTIVITY_STATS: ['profile', 'activity-stats'],
  FOLLOW_USER: ['profile', 'follow'],
  UNFOLLOW_USER: ['profile', 'unfollow'],

  // Wishlists related queries
  CREATE_WISHLIST: ['wishlists', 'create'],
  GET_USER_WISHLISTS: (includeNotes, page, limit) => [
    'wishlists',
    'user',
    { includeNotes, page, limit },
  ],
  GET_WISHLIST_BY_ID: (wishlistId, page, limit) => [
    'wishlists',
    'detail',
    wishlistId,
    { page, limit },
  ],
  UPDATE_WISHLIST: ['wishlists', 'update'],
  DELETE_WISHLIST: ['wishlists', 'delete'],
  ADD_NOTES_TO_WISHLIST: ['wishlists', 'add-notes'],
  REMOVE_NOTES_FROM_WISHLIST: ['wishlists', 'remove-notes'],

  // Comments related queries
  GET_COMMENTS: (noteId, page, limit) => [
    'comments',
    'note',
    noteId,
    { page, limit },
  ],
  ADD_COMMENT: ['comments', 'add'],
  TOGGLE_COMMENT_LIKE: ['comments', 'toggle-like'],
  ADD_REPLY: ['comments', 'add-reply'],

  // Sharing related queries
  CREATE_SHARE_LINK: ['share', 'create'],
  GET_SHARE_INFO: noteId => ['share', 'info', noteId],
  DISABLE_SHARE_LINK: ['share', 'disable'],
  ACCESS_SHARED_NOTE: (noteId, token) => ['share', 'access', noteId, token],
  GET_SHARE_ANALYTICS: noteId => ['share', 'analytics', noteId],

  // Wishlist share related queries
  CREATE_WISHLIST_SHARE_LINK: ['wishlist-share', 'create'],
  GET_WISHLIST_SHARE_INFO: wishlistId => ['wishlist-share', 'info', wishlistId],
  DISABLE_WISHLIST_SHARE_LINK: ['wishlist-share', 'disable'],
  ACCESS_SHARED_WISHLIST: (wishlistId, token) => [
    'wishlist-share',
    'access',
    wishlistId,
    token,
  ],
  GET_WISHLIST_SHARE_ANALYTICS: wishlistId => [
    'wishlist-share',
    'analytics',
    wishlistId,
  ],

  // Google Drive related queries
  GOOGLE_DRIVE_ACCOUNT_INFO: ['google-drive', 'account-info'],
  GOOGLE_DRIVE_FOLDER_STRUCTURE: ['google-drive', 'folder-structure'],
}
