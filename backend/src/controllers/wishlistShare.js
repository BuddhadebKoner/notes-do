import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/user.js';
import Note from '../models/notes.js';
import { connectDB } from '../config/database.js';

// Generate a unique share token
const generateShareToken = () => {
   return crypto.randomBytes(32).toString('hex');
};

// Create or regenerate share link for a wishlist
export const createWishlistShareLink = async (req, res) => {
   try {
      await connectDB();

      const { wishlistId } = req.params;
      const { expiryDays = 30 } = req.body; // Default 30 days expiry

      // Find user and the specific wishlist
      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      const wishlist = user.activity.wishlists.id(wishlistId);
      if (!wishlist) {
         return res.status(404).json({
            success: false,
            message: 'Wishlist not found'
         });
      }

      // Generate new share token and expiry
      const shareToken = generateShareToken();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

      // Update wishlist with new share link
      wishlist.sharing = {
         shareToken,
         shareTokenExpiry: expiryDate,
         isShareEnabled: true,
         shareCreatedAt: wishlist.sharing?.shareCreatedAt || new Date(),
         shareUpdatedAt: new Date(),
         shareStats: wishlist.sharing?.shareStats || {
            totalViews: 0,
            uniqueUsers: 0,
            accessHistory: []
         }
      };

      await user.save();

      // Generate share URL
      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wishlist/${wishlistId}?token=${shareToken}`;

      res.status(200).json({
         success: true,
         message: 'Wishlist share link created successfully',
         data: {
            shareUrl,
            shareToken,
            expiryDate,
            wishlistName: wishlist.name,
            isShareEnabled: true
         }
      });

   } catch (error) {
      console.error('Create wishlist share link error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to create wishlist share link',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

// Get share link info for a wishlist (owner only)
export const getWishlistShareLinkInfo = async (req, res) => {
   try {
      await connectDB();

      const { wishlistId } = req.params;

      // Find user and the specific wishlist
      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      const wishlist = user.activity.wishlists.id(wishlistId);
      if (!wishlist) {
         return res.status(404).json({
            success: false,
            message: 'Wishlist not found'
         });
      }

      if (!wishlist.sharing?.isShareEnabled || !wishlist.sharing?.shareToken) {
         return res.status(404).json({
            success: false,
            message: 'No active share link found for this wishlist'
         });
      }

      // Check if link is expired
      const isExpired = new Date() > wishlist.sharing.shareTokenExpiry;

      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wishlist/${wishlistId}?token=${wishlist.sharing.shareToken}`;

      res.status(200).json({
         success: true,
         data: {
            shareUrl,
            shareToken: wishlist.sharing.shareToken,
            expiryDate: wishlist.sharing.shareTokenExpiry,
            isExpired,
            isShareEnabled: wishlist.sharing.isShareEnabled,
            shareCreatedAt: wishlist.sharing.shareCreatedAt,
            shareUpdatedAt: wishlist.sharing.shareUpdatedAt,
            stats: {
               totalViews: wishlist.sharing.shareStats?.totalViews || 0,
               uniqueUsers: wishlist.sharing.shareStats?.uniqueUsers || 0,
               lastAccessed: wishlist.sharing.shareStats?.lastAccessed
            }
         }
      });

   } catch (error) {
      console.error('Get wishlist share link info error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to get wishlist share link info',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

// Disable share link for a wishlist
export const disableWishlistShareLink = async (req, res) => {
   try {
      await connectDB();

      const { wishlistId } = req.params;

      // Find user and the specific wishlist
      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      const wishlist = user.activity.wishlists.id(wishlistId);
      if (!wishlist) {
         return res.status(404).json({
            success: false,
            message: 'Wishlist not found'
         });
      }

      // Disable share link
      wishlist.sharing = {
         ...wishlist.sharing,
         isShareEnabled: false,
         shareUpdatedAt: new Date(),
         shareToken: undefined,
         shareTokenExpiry: undefined
      };

      await user.save();

      res.status(200).json({
         success: true,
         message: 'Wishlist share link disabled successfully'
      });

   } catch (error) {
      console.error('Disable wishlist share link error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to disable wishlist share link',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

// Access shared wishlist (public endpoint with optional auth)
export const accessSharedWishlist = async (req, res) => {
   try {
      await connectDB();

      const { wishlistId } = req.params;
      const { token } = req.query;

      if (!token) {
         return res.status(400).json({
            success: false,
            message: 'Share token is required'
         });
      }

      // Find user with wishlist that has the share token
      const user = await User.findOne({
         'activity.wishlists._id': wishlistId,
         'activity.wishlists.sharing.shareToken': token,
         'activity.wishlists.sharing.isShareEnabled': true
      })
         .populate({
            path: 'activity.wishlists.notes.note',
            select: 'title subject file.viewUrl file.downloadUrl file.driveFileId file.thumbnailUrl social.views social.likes status visibility uploader',
            populate: {
               path: 'uploader',
               select: 'username profile.firstName profile.lastName profile.avatar'
            }
         });

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'Invalid or expired share link'
         });
      }

      const wishlist = user.activity.wishlists.id(wishlistId);

      // Check if token is expired
      if (new Date() > wishlist.sharing.shareTokenExpiry) {
         return res.status(410).json({
            success: false,
            message: 'Share link has expired'
         });
      }

      // Check if wishlist is private and user is not authenticated
      const currentUserId = req.user?._id?.toString();
      if (wishlist.isPrivate && !currentUserId) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required to access this private wishlist',
            requiresAuth: true
         });
      }

      // Get user info if authenticated
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Track access
      const accessRecord = {
         user: currentUserId || null,
         accessedAt: new Date(),
         ipAddress,
         userAgent
      };

      // Check if this is a unique user access
      const existingAccess = wishlist.sharing.shareStats?.accessHistory?.find(
         access => access.user && currentUserId && access.user.toString() === currentUserId
      );

      const isUniqueUser = !existingAccess;

      // Update share stats
      if (!wishlist.sharing.shareStats) {
         wishlist.sharing.shareStats = {
            totalViews: 0,
            uniqueUsers: 0,
            accessHistory: []
         };
      }

      wishlist.sharing.shareStats.totalViews += 1;
      if (isUniqueUser) {
         wishlist.sharing.shareStats.uniqueUsers += 1;
      }
      wishlist.sharing.shareStats.lastAccessed = new Date();

      // Add access record (keep only last 100)
      wishlist.sharing.shareStats.accessHistory.push(accessRecord);
      if (wishlist.sharing.shareStats.accessHistory.length > 100) {
         wishlist.sharing.shareStats.accessHistory = wishlist.sharing.shareStats.accessHistory.slice(-100);
      }

      await user.save();

      // Filter notes - only show public and approved notes when wishlist is shared
      // Private notes should never be accessible through shared wishlist links
      const filteredNotes = wishlist.notes.filter(noteRef =>
         noteRef.note &&
         noteRef.note.visibility === 'public' &&
         noteRef.note.status === 'approved'
      );

      // Prepare wishlist data for response with optimized note fields for NoteCard component
      const wishlistData = {
         _id: wishlist._id,
         name: wishlist.name,
         description: wishlist.description,
         color: wishlist.color,
         isPrivate: wishlist.isPrivate,
         createdAt: wishlist.createdAt,
         updatedAt: wishlist.updatedAt,
         notesCount: filteredNotes.length,
         totalNotesCount: wishlist.notes.length,
         notes: filteredNotes.map(noteRef => ({
            // Core fields required by NoteCard
            _id: noteRef.note._id,
            title: noteRef.note.title,
            subject: noteRef.note.subject?.name || noteRef.note.subject,
            // File fields for preview and download
            viewUrl: noteRef.note.file.viewUrl,
            downloadUrl: noteRef.note.file.downloadUrl,
            driveFileId: noteRef.note.file.driveFileId,
            thumbnailUrl: noteRef.note.file.thumbnailUrl,
            // Stats for NoteCard display
            stats: {
               views: noteRef.note.social.views || 0,
               likes: noteRef.note.social.likes?.length || 0,
               isLiked: currentUserId ?
                  noteRef.note.social.likes?.some(like => like.user.toString() === currentUserId) : false
            },
            // Uploader info for NoteCard
            uploader: {
               username: noteRef.note.uploader.username,
               name: noteRef.note.uploader.profile.firstName + ' ' + noteRef.note.uploader.profile.lastName,
               avatar: noteRef.note.uploader.profile.avatar
            },
            // Additional metadata
            addedAt: noteRef.addedAt
         })),
         owner: {
            username: user.username,
            fullName: user.profile.firstName + ' ' + user.profile.lastName,
            avatar: user.profile.avatar
         },
         isSharedAccess: true
      };

      res.status(200).json({
         success: true,
         message: 'Shared wishlist accessed successfully',
         data: {
            wishlist: wishlistData,
            accessInfo: {
               accessedAt: new Date(),
               isAuthenticated: !!currentUserId,
               publicNotesOnly: true,
               hiddenNotesCount: wishlist.notes.length - filteredNotes.length
            }
         }
      });

   } catch (error) {
      console.error('Access shared wishlist error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to access shared wishlist',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

// Get share analytics for wishlist owner
export const getWishlistShareAnalytics = async (req, res) => {
   try {
      await connectDB();

      const { wishlistId } = req.params;

      // Find user and the specific wishlist
      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      const wishlist = user.activity.wishlists.id(wishlistId);
      if (!wishlist) {
         return res.status(404).json({
            success: false,
            message: 'Wishlist not found'
         });
      }

      if (!wishlist.sharing?.isShareEnabled) {
         return res.status(404).json({
            success: false,
            message: 'No active share link found for this wishlist'
         });
      }

      // Populate user info for access history
      await User.populate(wishlist, {
         path: 'sharing.shareStats.accessHistory.user',
         select: 'username profile.firstName profile.lastName'
      });

      // Prepare analytics data
      const analytics = {
         totalViews: wishlist.sharing.shareStats?.totalViews || 0,
         uniqueUsers: wishlist.sharing.shareStats?.uniqueUsers || 0,
         lastAccessed: wishlist.sharing.shareStats?.lastAccessed,
         shareCreatedAt: wishlist.sharing.shareCreatedAt,
         shareUpdatedAt: wishlist.sharing.shareUpdatedAt,
         isExpired: new Date() > wishlist.sharing.shareTokenExpiry,
         expiryDate: wishlist.sharing.shareTokenExpiry,
         recentAccess: wishlist.sharing.shareStats?.accessHistory?.slice(-20).reverse() || []
      };

      res.status(200).json({
         success: true,
         data: {
            wishlistName: wishlist.name,
            analytics
         }
      });

   } catch (error) {
      console.error('Get wishlist share analytics error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to get wishlist share analytics',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};