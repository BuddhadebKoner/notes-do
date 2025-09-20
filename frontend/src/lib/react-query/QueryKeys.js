// Centralized query keys for React Query
export const QUERY_KEYS = {
   // Auth related queries
   LOGIN_USER: ['auth', 'login'],
   CREATE_USER: ['auth', 'create-user'],
   CHECK_LOGIN: ['auth', 'check-login'],
   USER_PROFILE: ['auth', 'profile'],

   // Notes related queries
   UPLOAD_NOTE: ['notes', 'upload'],
   GET_NOTES: ['notes', 'list'],
   GET_NOTE: ['notes', 'detail'],

   // Profile related queries
   GET_PROFILE: ['profile', 'details'],
   UPDATE_PROFILE: ['profile', 'update'],
   GET_UPLOADED_NOTES: (page, limit, sortBy, sortOrder) => ['profile', 'uploaded-notes', { page, limit, sortBy, sortOrder }],
   GET_WISHLIST: (page, limit) => ['profile', 'wishlist', { page, limit }],
   GET_FAVORITES: (page, limit) => ['profile', 'favorites', { page, limit }],
   GET_FOLLOWERS: ['profile', 'followers'],
   GET_FOLLOWING: ['profile', 'following'],
   GET_ACTIVITY_STATS: ['profile', 'activity-stats'],
}