import api, { API_ENDPOINTS } from '../config/api.js';

/**
 * Notification API Service
 * Handles all notification-related API calls
 */
const notificationAPI = {
   // Get all notifications for the authenticated user
   getUserNotifications: async (options = {}) => {
      const { page = 1, limit = 20, unreadOnly = false } = options;

      const params = new URLSearchParams({
         page: page.toString(),
         limit: limit.toString(),
         unreadOnly: unreadOnly.toString(),
      });

      const response = await api.get(`${API_ENDPOINTS.NOTIFICATIONS.GET_ALL}?${params}`);
      return response.data;
   },

   // Get unread notification count
   getUnreadCount: async () => {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      return response.data;
   },

   // Mark a specific notification as read
   markNotificationAsRead: async (notificationId) => {
      const response = await api.patch(`${API_ENDPOINTS.NOTIFICATIONS.MARK_READ}/${notificationId}/read`);
      return response.data;
   },

   // Mark all notifications as read
   markAllAsRead: async () => {
      const response = await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      return response.data;
   },

   // Delete a specific notification
   deleteNotification: async (notificationId) => {
      const response = await api.delete(`${API_ENDPOINTS.NOTIFICATIONS.DELETE}/${notificationId}`);
      return response.data;
   },
};

export default notificationAPI;

