import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Note from '../models/notes.js';
import User from '../models/user.js';
import { connectDB } from '../config/database.js';

// Generate a unique share token
const generateShareToken = () => {
   return crypto.randomBytes(32).toString('hex');
};

// Create or regenerate share link for a note
export const createShareLink = async (req, res) => {
   try {
      await connectDB();

      const { noteId } = req.params;
      const { expiryDays = 30 } = req.body; // Default 30 days expiry

      // Validate note exists and user is the owner
      const note = await Note.findById(noteId);
      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      // Check if user is the owner of the note
      if (note.uploader.toString() !== req.user._id.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only note owner can create share links'
         });
      }

      // Generate new share token and expiry
      const shareToken = generateShareToken();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

      // Update note with new share link
      const updatedNote = await Note.findByIdAndUpdate(
         noteId,
         {
            $set: {
               'sharing.shareToken': shareToken,
               'sharing.shareTokenExpiry': expiryDate,
               'sharing.isShareEnabled': true,
               'sharing.shareCreatedAt': note.sharing?.shareCreatedAt || new Date(),
               'sharing.shareUpdatedAt': new Date()
            }
         },
         { new: true }
      );

      // Generate share URL
      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${noteId}?token=${shareToken}`;

      res.status(200).json({
         success: true,
         message: 'Share link created successfully',
         data: {
            shareUrl,
            shareToken,
            expiryDate,
            noteTitle: note.title,
            isShareEnabled: true
         }
      });

   } catch (error) {
      console.error('Create share link error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to create share link',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

// Get share link info for a note (owner only)
export const getShareLinkInfo = async (req, res) => {
   try {
      await connectDB();

      const { noteId } = req.params;

      // Find note and check ownership
      const note = await Note.findById(noteId)
         .select('title sharing uploader')
         .populate('uploader', 'username profile.firstName profile.lastName');

      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      // Check if user is the owner
      if (note.uploader._id.toString() !== req.user._id.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only note owner can view share link info'
         });
      }

      if (!note.sharing?.isShareEnabled || !note.sharing?.shareToken) {
         return res.status(404).json({
            success: false,
            message: 'No active share link found for this note'
         });
      }

      // Check if link is expired
      const isExpired = new Date() > note.sharing.shareTokenExpiry;

      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${noteId}?token=${note.sharing.shareToken}`;

      res.status(200).json({
         success: true,
         data: {
            shareUrl,
            shareToken: note.sharing.shareToken,
            expiryDate: note.sharing.shareTokenExpiry,
            isExpired,
            isShareEnabled: note.sharing.isShareEnabled,
            shareCreatedAt: note.sharing.shareCreatedAt,
            shareUpdatedAt: note.sharing.shareUpdatedAt,
            stats: {
               totalViews: note.sharing.shareStats?.totalViews || 0,
               uniqueUsers: note.sharing.shareStats?.uniqueUsers || 0,
               lastAccessed: note.sharing.shareStats?.lastAccessed
            }
         }
      });

   } catch (error) {
      console.error('Get share link info error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to get share link info',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

// Disable share link for a note
export const disableShareLink = async (req, res) => {
   try {
      await connectDB();

      const { noteId } = req.params;

      // Find note and check ownership
      const note = await Note.findById(noteId);
      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      // Check if user is the owner
      if (note.uploader.toString() !== req.user._id.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only note owner can disable share links'
         });
      }

      // Disable share link
      await Note.findByIdAndUpdate(
         noteId,
         {
            $set: {
               'sharing.isShareEnabled': false,
               'sharing.shareUpdatedAt': new Date()
            },
            $unset: {
               'sharing.shareToken': '',
               'sharing.shareTokenExpiry': ''
            }
         }
      );

      res.status(200).json({
         success: true,
         message: 'Share link disabled successfully'
      });

   } catch (error) {
      console.error('Disable share link error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to disable share link',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

// Verify and access shared note (public endpoint)
export const accessSharedNote = async (req, res) => {
   try {
      await connectDB();

      const { noteId } = req.params;
      const { token } = req.query;

      if (!token) {
         return res.status(400).json({
            success: false,
            message: 'Share token is required'
         });
      }

      // Find note with share token
      const note = await Note.findOne({
         _id: noteId,
         'sharing.shareToken': token,
         'sharing.isShareEnabled': true
      })
         .populate('uploader', 'username profile.firstName profile.lastName profile.avatar')
         .populate('comments.user', 'username profile.firstName profile.lastName profile.avatar');

      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Invalid or expired share link'
         });
      }

      // Check if token is expired
      if (new Date() > note.sharing.shareTokenExpiry) {
         return res.status(410).json({
            success: false,
            message: 'Share link has expired'
         });
      }

      // Get current user data if authenticated
      const currentUserId = req.user?._id;
      const currentUser = req.user;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Visibility and access control logic (same as getNoteById)
      let hasAccess = false;
      let canView = false;
      let canDownload = false;
      let canComment = false;
      let canLike = false;
      let isOwner = false;

      // Check ownership
      isOwner = currentUserId && note.uploader._id.toString() === currentUserId.toString();

      // Determine access based on visibility (simplified to public/private only)
      switch (note.visibility) {
         case 'public':
            // Public notes can be accessed by anyone through share link
            hasAccess = true;
            canView = true;
            canDownload = note.permissions.canDownload;
            canComment = !!currentUserId; // Must be logged in to comment
            canLike = !!currentUserId; // Must be logged in to like
            break;

         case 'private':
            // For private notes via share link, require authentication
            if (!currentUserId) {
               return res.status(401).json({
                  success: false,
                  message: 'Authentication required to access this private shared note. Please sign in to continue.',
                  requiresAuth: true
               });
            }

            // Allow access if user is authenticated and has valid share token
            if (token === note.sharing.shareToken) {
               hasAccess = true;
               canView = true;
               canDownload = note.permissions.canDownload;
               canComment = isOwner; // Only owner can comment on private notes
               canLike = isOwner; // Only owner can like private notes
            }
            break;

         default:
            hasAccess = false;
      }

      // If no access, return appropriate error
      if (!hasAccess) {
         if (note.visibility === 'private' && !currentUserId) {
            return res.status(401).json({
               success: false,
               message: 'Authentication required to access this private shared note. Please sign in to continue.',
               requiresAuth: true
            });
         }

         return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this shared note.'
         });
      }

      // Track access
      const accessRecord = {
         user: currentUserId || null,
         accessedAt: new Date(),
         ipAddress,
         userAgent
      };

      // Check if this is a unique user access
      const existingAccess = note.sharing.shareStats?.accessHistory?.find(
         access => access.user && currentUserId && access.user.toString() === currentUserId.toString()
      );

      const isUniqueUser = !existingAccess;

      // Update share stats
      await Note.findByIdAndUpdate(
         noteId,
         {
            $inc: {
               'sharing.shareStats.totalViews': 1,
               'sharing.shareStats.uniqueUsers': isUniqueUser ? 1 : 0
            },
            $set: {
               'sharing.shareStats.lastAccessed': new Date()
            },
            $push: {
               'sharing.shareStats.accessHistory': {
                  $each: [accessRecord],
                  $slice: -100 // Keep only last 100 access records
               }
            }
         }
      );

      // Increment view count if user has access (same as getNoteById)
      if (hasAccess) {
         await Note.findByIdAndUpdate(noteId, {
            $inc: { 'social.views': 1 }
         });
      }

      // Check if user has liked this note (for authenticated users)
      let hasLiked = false;
      if (currentUserId && note.social.likes) {
         hasLiked = note.social.likes.some(like =>
            like.user.toString() === currentUserId.toString()
         );
      }

      // Prepare note data for response (same structure as getNoteById)
      const noteData = {
         _id: note._id,
         title: note.title,
         description: note.description,
         tags: note.tags,
         subject: note.subject,
         academic: note.academic,
         file: {
            viewUrl: note.file.viewUrl,
            directViewUrl: note.file.directViewUrl,
            thumbnailUrl: note.file.thumbnailUrl,
            size: note.file.size,
            mimeType: note.file.mimeType
         },
         uploader: {
            _id: note.uploader._id,
            username: note.uploader.username,
            fullName: note.uploader.profile.firstName + ' ' + note.uploader.profile.lastName,
            avatar: note.uploader.profile.avatar
         },
         uploadDate: note.uploadDate,
         social: {
            views: note.social.views + 1, // Include the incremented view
            downloads: note.social.downloads,
            likesCount: note.social.likes?.length || 0,
            rating: note.social.rating,
            hasLiked
         },
         visibility: note.visibility,
         comments: canComment ? note.comments : [], // Only include comments if user can comment
         commentsCount: note.comments?.length || 0,
         permissions: {
            hasAccess,
            canView,
            canDownload,
            canComment,
            canLike,
            isOwner
         },
         isSharedAccess: true
      };

      res.status(200).json({
         success: true,
         message: 'Shared note accessed successfully',
         note: noteData
      });

   } catch (error) {
      console.error('Access shared note error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to access shared note',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

// Get share analytics for note owner
export const getShareAnalytics = async (req, res) => {
   try {
      await connectDB();

      const { noteId } = req.params;

      // Find note and check ownership
      const note = await Note.findById(noteId)
         .select('title sharing uploader')
         .populate({
            path: 'sharing.shareStats.accessHistory.user',
            select: 'username profile.firstName profile.lastName'
         });

      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      // Check if user is the owner
      if (note.uploader.toString() !== req.user._id.toString()) {
         return res.status(403).json({
            success: false,
            message: 'Only note owner can view share analytics'
         });
      }

      if (!note.sharing?.isShareEnabled) {
         return res.status(404).json({
            success: false,
            message: 'No active share link found for this note'
         });
      }

      // Prepare analytics data
      const analytics = {
         totalViews: note.sharing.shareStats?.totalViews || 0,
         uniqueUsers: note.sharing.shareStats?.uniqueUsers || 0,
         lastAccessed: note.sharing.shareStats?.lastAccessed,
         shareCreatedAt: note.sharing.shareCreatedAt,
         shareUpdatedAt: note.sharing.shareUpdatedAt,
         isExpired: new Date() > note.sharing.shareTokenExpiry,
         expiryDate: note.sharing.shareTokenExpiry,
         recentAccess: note.sharing.shareStats?.accessHistory?.slice(-20).reverse() || []
      };

      res.status(200).json({
         success: true,
         data: {
            noteTitle: note.title,
            analytics
         }
      });

   } catch (error) {
      console.error('Get share analytics error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to get share analytics',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};