import { Notification } from '../models/index.js';

// Get all notifications for the authenticated user
export const getUserNotifications = async (req, res) => {
   try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required'
         });
      }

      // Build query
      const query = { recipient: req.user._id };
      if (unreadOnly === 'true') {
         query.isRead = false;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Fetch notifications with pagination
      const notifications = await Notification.find(query)
         .populate({
            path: 'sender',
            select: 'username profile.firstName profile.lastName profile.avatar'
         })
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(parseInt(limit))
         .lean();

      // Count total notifications
      const totalNotifications = await Notification.countDocuments(query);
      const unreadCount = await Notification.getUnreadCount(req.user._id);

      // Format notifications for frontend
      const formattedNotifications = notifications.map(notification => ({
         _id: notification._id,
         type: notification.type,
         message: notification.message,
         isRead: notification.isRead,
         readAt: notification.readAt,
         createdAt: notification.createdAt,
         sender: notification.sender ? {
            id: notification.sender._id,
            username: notification.sender.username,
            name: `${notification.sender.profile.firstName} ${notification.sender.profile.lastName}`,
            avatar: notification.sender.profile.avatar
         } : null
      }));

      // Build pagination info
      const pagination = {
         currentPage: parseInt(page),
         totalPages: Math.ceil(totalNotifications / parseInt(limit)),
         totalNotifications,
         unreadCount,
         hasNextPage: skip + parseInt(limit) < totalNotifications,
         hasPrevPage: parseInt(page) > 1,
         limit: parseInt(limit)
      };

      res.status(200).json({
         success: true,
         message: `Found ${totalNotifications} notifications`,
         data: {
            notifications: formattedNotifications,
            pagination
         }
      });

   } catch (error) {
      console.error('Get user notifications error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch notifications',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
   try {
      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required'
         });
      }

      const unreadCount = await Notification.getUnreadCount(req.user._id);

      res.status(200).json({
         success: true,
         data: {
            unreadCount
         }
      });

   } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch unread count',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Mark a notification as read
export const markNotificationAsRead = async (req, res) => {
   try {
      const { notificationId } = req.params;

      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required'
         });
      }

      // Find the notification
      const notification = await Notification.findOne({
         _id: notificationId,
         recipient: req.user._id
      });

      if (!notification) {
         return res.status(404).json({
            success: false,
            message: 'Notification not found'
         });
      }

      // Mark as read
      await notification.markAsRead();

      res.status(200).json({
         success: true,
         message: 'Notification marked as read',
         data: {
            notification: {
               _id: notification._id,
               isRead: notification.isRead,
               readAt: notification.readAt
            }
         }
      });

   } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to mark notification as read',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
   try {
      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required'
         });
      }

      const result = await Notification.markAllAsRead(req.user._id);

      res.status(200).json({
         success: true,
         message: 'All notifications marked as read',
         data: {
            modifiedCount: result.modifiedCount
         }
      });

   } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to mark all notifications as read',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
   try {
      const { notificationId } = req.params;

      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required'
         });
      }

      // Find and delete the notification
      const notification = await Notification.findOneAndDelete({
         _id: notificationId,
         recipient: req.user._id
      });

      if (!notification) {
         return res.status(404).json({
            success: false,
            message: 'Notification not found'
         });
      }

      res.status(200).json({
         success: true,
         message: 'Notification deleted successfully',
         data: {
            deletedId: notificationId
         }
      });

   } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete notification',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};
