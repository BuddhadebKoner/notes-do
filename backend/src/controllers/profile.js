import { User, Note } from '../models/index.js';
import mongoose from 'mongoose';

// Get user profile with complete information
export const getUserProfile = async (req, res) => {
   try {
      // Find user by clerkId and populate relevant data
      console.log('Fetching profile for clerkId:', req.clerkId);
      const user = await User.findOne({ clerkId: req.clerkId })
         .populate({
            path: 'activity.notesUploaded',
            select: 'title subject.name file.downloadUrl uploadDate'
         })
         .populate({
            path: 'activity.favoriteNotes',
            select: 'title subject.name file.downloadUrl uploader'
         })
         .populate({
            path: 'activity.wishlistNotes',
            select: 'title subject.name file.downloadUrl uploader'
         })
         .populate({
            path: 'activity.following',
            select: 'profile.firstName profile.lastName profile.avatar username'
         })
         .populate({
            path: 'activity.followers',
            select: 'profile.firstName profile.lastName profile.avatar username'
         });

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User profile not found'
         });
      }

      // Get additional statistics
      const uploadedNotesCount = await Note.countDocuments({ uploader: user._id });
      const totalDownloads = await Note.aggregate([
         { $match: { uploader: user._id } },
         { $group: { _id: null, total: { $sum: '$engagement.downloads' } } }
      ]);

      const response = {
         success: true,
         user: {
            // Basic Info
            id: user._id,
            clerkId: user.clerkId,
            email: user.email,
            username: user.username,

            // Profile Info
            profile: {
               firstName: user.profile.firstName,
               lastName: user.profile.lastName,
               fullName: user.profile.fullName,
               avatar: user.profile.avatar,
               bio: user.profile.bio,
               dateOfBirth: user.profile.dateOfBirth,
               gender: user.profile.gender
            },

            // Academic Info
            academic: {
               university: user.academic.university,
               department: user.academic.department,
               currentSemester: user.academic.currentSemester,
               graduationYear: user.academic.graduationYear,
               studentId: user.academic.studentId,
               degree: user.academic.degree
            },

            // Contact Info
            contact: {
               phone: user.contact.phone,
               address: user.contact.address,
               socialLinks: user.contact.socialLinks
            },

            // Preferences
            preferences: user.preferences,

            // Activity Stats
            activity: {
               notesUploaded: user.activity.notesUploaded,
               favoriteNotes: user.activity.favoriteNotes,
               wishlistNotes: user.activity.wishlistNotes,
               following: user.activity.following,
               followers: user.activity.followers,
               totalUploads: uploadedNotesCount,
               totalLikesReceived: user.activity.totalLikesReceived,
               totalDownloads: totalDownloads[0]?.total || 0
            },

            // Account Status
            account: {
               isVerified: user.account.isVerified,
               isActive: user.account.isActive,
               role: user.account.role,
               lastLogin: user.account.lastLogin,
               createdAt: user.createdAt
            },

            // Drive Integration
            driveIntegration: {
               isConnected: user.driveIntegration.isConnected,
               driveEmail: user.driveIntegration.driveEmail,
               lastSync: user.driveIntegration.lastSync,
               storageQuota: user.driveIntegration.storageQuota
            }
         }
      };

      res.status(200).json(response);
   } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch user profile',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Get user's uploaded notes
export const getUserUploadedNotes = async (req, res) => {
   try {
      // Check if user profile exists in our database
      if (!req.user) {
         return res.status(404).json({
            success: false,
            message: 'User profile not found. Please create your profile first.'
         });
      }

      const { page = 1, limit = 10, sortBy = 'uploadDate', sortOrder = 'desc' } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const notes = await Note.find({ uploader: req.user._id })
         .select('title description tags academic subject file engagement uploadDate visibility.isPublic')
         .sort(sortOptions)
         .skip(skip)
         .limit(parseInt(limit))
         .lean();

      const totalNotes = await Note.countDocuments({ uploader: req.user._id });

      res.status(200).json({
         success: true,
         data: {
            notes,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(totalNotes / parseInt(limit)),
               totalNotes,
               hasNextPage: skip + parseInt(limit) < totalNotes,
               hasPrevPage: parseInt(page) > 1
            }
         }
      });
   } catch (error) {
      console.error('Get uploaded notes error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch uploaded notes',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Get user's wishlist notes
export const getUserWishlist = async (req, res) => {
   try {
      // Check if user profile exists in our database
      if (!req.user) {
         return res.status(404).json({
            success: false,
            message: 'User profile not found. Please create your profile first.'
         });
      }

      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const user = await User.findById(req.user._id)
         .populate({
            path: 'activity.wishlistNotes',
            select: 'title description tags academic subject file engagement uploadDate uploader',
            populate: {
               path: 'uploader',
               select: 'profile.firstName profile.lastName profile.avatar username'
            },
            options: {
               skip: skip,
               limit: parseInt(limit),
               sort: { createdAt: -1 }
            }
         });

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      const totalWishlistItems = user.activity.wishlistNotes.length;

      res.status(200).json({
         success: true,
         data: {
            notes: user.activity.wishlistNotes,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(totalWishlistItems / parseInt(limit)),
               totalNotes: totalWishlistItems,
               hasNextPage: skip + parseInt(limit) < totalWishlistItems,
               hasPrevPage: parseInt(page) > 1
            }
         }
      });
   } catch (error) {
      console.error('Get wishlist error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch wishlist',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Get user's favorite notes
export const getUserFavorites = async (req, res) => {
   try {
      // Check if user profile exists in our database
      if (!req.user) {
         return res.status(404).json({
            success: false,
            message: 'User profile not found. Please create your profile first.'
         });
      }

      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const user = await User.findById(req.user._id)
         .populate({
            path: 'activity.favoriteNotes',
            select: 'title description tags academic subject file engagement uploadDate uploader',
            populate: {
               path: 'uploader',
               select: 'profile.firstName profile.lastName profile.avatar username'
            },
            options: {
               skip: skip,
               limit: parseInt(limit),
               sort: { createdAt: -1 }
            }
         });

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      const totalFavoriteItems = user.activity.favoriteNotes.length;

      res.status(200).json({
         success: true,
         data: {
            notes: user.activity.favoriteNotes,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(totalFavoriteItems / parseInt(limit)),
               totalNotes: totalFavoriteItems,
               hasNextPage: skip + parseInt(limit) < totalFavoriteItems,
               hasPrevPage: parseInt(page) > 1
            }
         }
      });
   } catch (error) {
      console.error('Get favorites error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch favorites',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Get user's followers
export const getUserFollowers = async (req, res) => {
   try {
      // Check if user profile exists in our database
      if (!req.user) {
         return res.status(404).json({
            success: false,
            message: 'User profile not found. Please create your profile first.'
         });
      }

      const user = await User.findById(req.user._id)
         .populate({
            path: 'activity.followers',
            select: 'profile.firstName profile.lastName profile.avatar username academic.university academic.department'
         });

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      res.status(200).json({
         success: true,
         data: {
            followers: user.activity.followers,
            count: user.activity.followers.length
         }
      });
   } catch (error) {
      console.error('Get followers error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch followers',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Get user's following
export const getUserFollowing = async (req, res) => {
   try {
      // Check if user profile exists in our database
      if (!req.user) {
         return res.status(404).json({
            success: false,
            message: 'User profile not found. Please create your profile first.'
         });
      }

      const user = await User.findById(req.user._id)
         .populate({
            path: 'activity.following',
            select: 'profile.firstName profile.lastName profile.avatar username academic.university academic.department'
         });

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      res.status(200).json({
         success: true,
         data: {
            following: user.activity.following,
            count: user.activity.following.length
         }
      });
   } catch (error) {
      console.error('Get following error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch following',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
   try {
      // Check if user profile exists in our database
      if (!req.user) {
         return res.status(404).json({
            success: false,
            message: 'User profile not found. Please create your profile first.'
         });
      }

      const allowedFields = [
         'profile.bio',
         'profile.dateOfBirth',
         'profile.gender',
         'academic.university',
         'academic.department',
         'academic.currentSemester',
         'academic.graduationYear',
         'academic.studentId',
         'academic.degree',
         'contact.phone',
         'contact.address',
         'contact.socialLinks',
         'preferences.theme',
         'preferences.language',
         'preferences.emailNotifications',
         'preferences.privacy'
      ];

      const updates = {};

      // Filter only allowed fields
      Object.keys(req.body).forEach(key => {
         if (allowedFields.some(field => field.startsWith(key) || key.startsWith(field))) {
            updates[key] = req.body[key];
         }
      });

      const updatedUser = await User.findByIdAndUpdate(
         req.user._id,
         { $set: updates },
         { new: true, runValidators: true }
      ).select('-driveIntegration.refreshToken');

      if (!updatedUser) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      res.status(200).json({
         success: true,
         message: 'Profile updated successfully',
         user: updatedUser
      });
   } catch (error) {
      console.error('Update profile error:', error);

      if (error.name === 'ValidationError') {
         const validationErrors = Object.values(error.errors).map(err => err.message);
         return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors
         });
      }

      res.status(500).json({
         success: false,
         message: 'Failed to update profile',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Get user activity statistics
export const getUserActivityStats = async (req, res) => {
   try {
      // Check if user profile exists in our database
      if (!req.user) {
         return res.status(404).json({
            success: false,
            message: 'User profile not found. Please create your profile first.'
         });
      }

      const userId = req.user._id;

      // Get comprehensive activity stats
      const [
         notesStats,
         engagementStats,
         recentActivity
      ] = await Promise.all([
         // Notes statistics
         Note.aggregate([
            { $match: { uploader: userId } },
            {
               $group: {
                  _id: null,
                  totalNotes: { $sum: 1 },
                  totalDownloads: { $sum: '$engagement.downloads' },
                  totalViews: { $sum: '$engagement.views' },
                  totalLikes: { $sum: '$engagement.likes' },
                  avgRating: { $avg: '$engagement.rating.average' }
               }
            }
         ]),

         // Engagement statistics by category
         Note.aggregate([
            { $match: { uploader: userId } },
            {
               $group: {
                  _id: '$subject.category',
                  count: { $sum: 1 },
                  totalDownloads: { $sum: '$engagement.downloads' }
               }
            },
            { $sort: { count: -1 } }
         ]),

         // Recent activity (last 30 days)
         Note.find({
            uploader: userId,
            uploadDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
         }).select('title uploadDate engagement.downloads').sort({ uploadDate: -1 }).limit(10)
      ]);

      const user = await User.findById(userId).select('activity');

      res.status(200).json({
         success: true,
         data: {
            overview: {
               totalNotes: notesStats[0]?.totalNotes || 0,
               totalDownloads: notesStats[0]?.totalDownloads || 0,
               totalViews: notesStats[0]?.totalViews || 0,
               totalLikes: notesStats[0]?.totalLikes || 0,
               avgRating: notesStats[0]?.avgRating || 0,
               followers: user.activity.followers.length,
               following: user.activity.following.length,
               wishlistItems: user.activity.wishlistNotes.length,
               favoriteItems: user.activity.favoriteNotes.length
            },
            categoryStats: engagementStats,
            recentActivity: recentActivity
         }
      });
   } catch (error) {
      console.error('Get activity stats error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch activity statistics',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Get public user profile by username
export const getPublicUserProfile = async (req, res) => {
   try {
      const { username } = req.params;

      if (!username) {
         return res.status(400).json({
            success: false,
            message: 'Username is required'
         });
      }

      // Find the target user
      const targetUser = await User.findOne({
         username: username.toLowerCase(),
         'account.isActive': true
      })
         .populate({
            path: 'activity.notesUploaded',
            select: 'title subject.name file.downloadUrl uploadDate visibility.isPublic'
         })
         .populate({
            path: 'activity.following',
            select: 'profile.firstName profile.lastName profile.avatar username'
         })
         .populate({
            path: 'activity.followers',
            select: 'profile.firstName profile.lastName profile.avatar username'
         });

      if (!targetUser) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      // Get the requesting user's info (if authenticated)
      let requestingUser = null;
      let isOwnProfile = false;

      if (req.clerkId) {
         requestingUser = await User.findOne({ clerkId: req.clerkId });
         isOwnProfile = requestingUser && requestingUser._id.equals(targetUser._id);
      }

      // Determine what data to show based on privacy settings
      const profileVisibility = targetUser.preferences?.privacy?.profileVisibility || 'university';

      // Base profile data (always visible)
      const baseProfile = {
         id: targetUser._id,
         username: targetUser.username,
         profile: {
            firstName: targetUser.profile.firstName,
            lastName: targetUser.profile.lastName,
            fullName: targetUser.profile.fullName,
            avatar: targetUser.profile.avatar,
         },
         academic: {
            university: targetUser.academic.university,
            department: targetUser.academic.department,
            degree: targetUser.academic.degree
         },
         account: {
            isVerified: targetUser.account.isVerified,
            role: targetUser.account.role,
            createdAt: targetUser.createdAt
         }
      };

      // Determine access level
      let hasAccess = false;
      let canFollow = false;

      if (isOwnProfile) {
         // Own profile - full access
         hasAccess = true;
         canFollow = false;
      } else if (profileVisibility === 'public') {
         // Public profile - everyone can see
         hasAccess = true;
         canFollow = true;
      } else if (profileVisibility === 'university' && requestingUser) {
         // University-only - check if same university
         const sameUniversity = requestingUser.academic?.university &&
            targetUser.academic?.university &&
            requestingUser.academic.university.toLowerCase() ===
            targetUser.academic.university.toLowerCase();
         hasAccess = sameUniversity;
         canFollow = sameUniversity;
      } else if (profileVisibility === 'private') {
         // Private profile - minimal info only
         hasAccess = false;
         canFollow = requestingUser ? true : false; // Can follow if logged in, but can't see details
      }

      // Build response based on access level
      let responseData = {
         ...baseProfile,
         privacy: {
            profileVisibility,
            hasAccess,
            canFollow,
            isOwnProfile
         }
      };

      if (hasAccess || isOwnProfile) {
         // Add detailed information
         const uploadedNotesCount = await Note.countDocuments({
            uploader: targetUser._id,
            'visibility.isPublic': true
         });

         responseData = {
            ...responseData,
            profile: {
               ...responseData.profile,
               bio: targetUser.profile.bio,
               gender: targetUser.profile.gender
            },
            contact: {
               socialLinks: targetUser.contact.socialLinks
            },
            activity: {
               notesUploaded: targetUser.activity.notesUploaded.filter(note => note.visibility?.isPublic),
               totalUploads: uploadedNotesCount,
               totalLikesReceived: targetUser.activity.totalLikesReceived,
               followersCount: targetUser.activity.followers.length,
               followingCount: targetUser.activity.following.length,
               followers: targetUser.activity.followers,
               following: targetUser.activity.following
            }
         };

         // Check if requesting user follows target user
         if (requestingUser && !isOwnProfile) {
            const isFollowing = requestingUser.activity.following.includes(targetUser._id);
            responseData.relationship = {
               isFollowing,
               isFollowedBy: targetUser.activity.following.includes(requestingUser._id)
            };
         }
      } else {
         // Limited information for private profiles
         responseData.activity = {
            totalUploads: 0, // Don't show upload count for private profiles
            isPrivate: true
         };
      }

      res.status(200).json({
         success: true,
         user: responseData
      });

   } catch (error) {
      console.error('Get public user profile error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch user profile',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};