import express from 'express';
import {
   getUserNotifications,
   getUnreadCount,
   markNotificationAsRead,
   markAllAsRead,
   deleteNotification
} from '../controllers/notifications.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get all notifications for the authenticated user
// Query params: page, limit, unreadOnly (boolean)
router.get('/', getUserNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark a specific notification as read
router.patch('/:notificationId/read', markNotificationAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

// Delete a specific notification
router.delete('/:notificationId', deleteNotification);

export default router;
