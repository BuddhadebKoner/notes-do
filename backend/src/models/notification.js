import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
   // Recipient of the notification
   recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
   },

   // Sender/Actor who triggered the notification
   sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },

   // Notification type
   type: {
      type: String,
      enum: ['follow'],
      required: true,
      default: 'follow'
   },

   // Notification message
   message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
   },

   // Read status
   isRead: {
      type: Boolean,
      default: false,
      index: true
   },

   // Read timestamp
   readAt: {
      type: Date
   }
}, {
   timestamps: true
});

// Compound indexes for better query performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, sender: 1, type: 1 });

// Instance method to mark notification as read
notificationSchema.methods.markAsRead = function () {
   if (!this.isRead) {
      this.isRead = true;
      this.readAt = new Date();
      return this.save();
   }
   return Promise.resolve(this);
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function (userId) {
   return this.countDocuments({
      recipient: userId,
      isRead: false
   });
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = function (userId) {
   return this.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
   );
};

// Static method to create a follow notification
notificationSchema.statics.createFollowNotification = async function (senderId, recipientId) {
   // Check if notification already exists
   const existingNotification = await this.findOne({
      sender: senderId,
      recipient: recipientId,
      type: 'follow'
   });

   if (existingNotification) {
      return existingNotification;
   }

   // Get sender info to create message
   const sender = await mongoose.model('User').findById(senderId)
      .select('profile.firstName profile.lastName username');

   if (!sender) {
      throw new Error('Sender not found');
   }

   const message = `${sender.profile.firstName} ${sender.profile.lastName} started following you`;

   return this.create({
      sender: senderId,
      recipient: recipientId,
      type: 'follow',
      message
   });
};

// Static method to delete follow notification
notificationSchema.statics.deleteFollowNotification = function (senderId, recipientId) {
   return this.findOneAndDelete({
      sender: senderId,
      recipient: recipientId,
      type: 'follow'
   });
};

export default mongoose.model('Notification', notificationSchema);
