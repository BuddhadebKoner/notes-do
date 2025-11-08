import { User, Note, Notification } from '../models/index.js';
import mongoose from 'mongoose';

// Get user profile with complete information
export const getUserProfile = async (req, res) => {
   try {
      // Find user by clerkId - No population needed for efficiency
      console.log('Fetching profile for clerkId:', req.clerkId);
      const user = await User.findOne({ clerkId: req.clerkId })
         .select('-driveIntegration.refreshToken') // Exclude sensitive data
         .lean(); // Use lean() for better performance

      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User profile not found'
         });
      }

      // Get additional statistics efficiently in parallel
      const [totalDownloads, totalLikes] = await Promise.all([
         Note.aggregate([
            { $match: { uploader: user._id } },
            { $group: { _id: null, total: { $sum: '$social.downloads' } } }
         ]),
         Note.aggregate([
            { $match: { uploader: user._id } },
            { $group: { _id: null, total: { $sum: '$social.likes' } } }
         ])
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
               fullName: `${user.profile.firstName} ${user.profile.lastName}`, // Computed here since lean() doesn't include virtuals
               avatar: user.profile.avatar,
               bio: user.profile.bio,
               dateOfBirth: user.profile.dateOfBirth,
               gender: user.profile.gender
            },

            // Academic Info
            academic: {
               university: user.academic?.university,
               department: user.academic?.department,
               currentSemester: user.academic?.currentSemester,
               graduationYear: user.academic?.graduationYear,
               studentId: user.academic?.studentId,
               degree: user.academic?.degree
            },

            // Contact Info
            contact: {
               phone: user.contact?.phone,
               address: user.contact?.address,
               socialLinks: user.contact?.socialLinks
            },

            // Preferences
            preferences: user.preferences,

            // Activity Stats - Only counts, no arrays
            activity: {
               // Counts only - arrays handled by separate APIs
               totalUploads: user.activity?.notesUploaded?.length || 0,
               totalFavorites: user.activity?.favoriteNotes?.length || 0,
               totalWishlist: user.activity?.wishlistNotes?.length || 0,
               totalFollowing: user.activity?.following?.length || 0,
               totalFollowers: user.activity?.followers?.length || 0,

               // Computed stats
               totalDownloads: totalDownloads[0]?.total || 0,
               totalLikesReceived: totalLikes[0]?.total || 0,

               // Legacy support (can remove these later)
               totalLikesReceived_legacy: user.activity?.totalLikesReceived || 0,
               totalDownloads_legacy: user.activity?.totalDownloads || 0
            },

            // Account Status
            account: {
               isVerified: user.account?.isVerified || false,
               isActive: user.account?.isActive || true,
               role: user.account?.role || 'student',
               lastLogin: user.account?.lastLogin,
               createdAt: user.createdAt
            },

            // Drive Integration
            driveIntegration: {
               isConnected: user.driveIntegration?.isConnected || false,
               driveEmail: user.driveIntegration?.driveEmail,
               lastSync: user.driveIntegration?.lastSync,
               storageQuota: user.driveIntegration?.storageQuota
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

      const { page = 1, limit = 10, sortBy = 'uploadDate', sortOrder = 'desc' } = req.query; ``

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const notes = await Note.find({ uploader: req.user._id })
         .select('title description subject academic tags visibility file.viewUrl uploadDate _id')
         .sort(sortOptions)
         .skip(skip)
         .limit(parseInt(limit))
         .lean();

      // Transform notes to include graduationYear for frontend compatibility
      const transformedNotes = notes.map(note => ({
         ...note,
         academic: {
            ...note.academic,
            graduationYear: note.academic?.academicYear
               ? (() => {
                  const yearPart = note.academic.academicYear.split('-')[1];
                  // If year part is 2 digits, convert to 4 digits
                  if (yearPart.length === 2) {
                     const twoDigitYear = parseInt(yearPart);
                     // Assume years 00-30 are 2000s, 31-99 are 1900s (but for graduation, likely 2000s)
                     return twoDigitYear <= 30 ? `20${yearPart}` : `19${yearPart}`;
                  }
                  return yearPart; // Already 4 digits
               })()
               : undefined
         }
      }));

      const totalNotes = await Note.countDocuments({ uploader: req.user._id });

      res.status(200).json({
         success: true,
         data: {
            notes: transformedNotes,
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

      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get count efficiently without fetching data
      const totalFollowers = await User.aggregate([
         { $match: { _id: req.user._id } },
         { $project: { followersCount: { $size: '$activity.followers' } } }
      ]);

      const followersCount = totalFollowers[0]?.followersCount || 0;

      // Only fetch the requested page of followers
      const user = await User.findById(req.user._id)
         .populate({
            path: 'activity.followers',
            select: 'profile.firstName profile.lastName profile.avatar username academic.university academic.department',
            options: {
               skip: skip,
               limit: parseInt(limit)
            }
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
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(followersCount / parseInt(limit)),
               totalFollowers: followersCount,
               hasNextPage: skip + parseInt(limit) < followersCount,
               hasPrevPage: parseInt(page) > 1,
               limit: parseInt(limit)
            }
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

      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get count efficiently without fetching data
      const totalFollowing = await User.aggregate([
         { $match: { _id: req.user._id } },
         { $project: { followingCount: { $size: '$activity.following' } } }
      ]);

      const followingCount = totalFollowing[0]?.followingCount || 0;

      // Only fetch the requested page of following
      const user = await User.findById(req.user._id)
         .populate({
            path: 'activity.following',
            select: 'profile.firstName profile.lastName profile.avatar username academic.university academic.department',
            options: {
               skip: skip,
               limit: parseInt(limit)
            }
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
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(followingCount / parseInt(limit)),
               totalFollowing: followingCount,
               hasNextPage: skip + parseInt(limit) < followingCount,
               hasPrevPage: parseInt(page) > 1,
               limit: parseInt(limit)
            }
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

      // Determine access level - ensure boolean values
      let hasAccess = false;
      let canFollow = false;

      if (isOwnProfile) {
         // Own profile - full access
         hasAccess = true;
         canFollow = false;
      } else if (profileVisibility === 'public') {
         // Public profile - everyone can see and follow
         hasAccess = true;
         canFollow = true;
      } else if (profileVisibility === 'university') {
         // University-only - check if user is logged in and same university
         if (requestingUser) {
            const sameUniversity = requestingUser.academic?.university &&
               targetUser.academic?.university &&
               requestingUser.academic.university.toLowerCase() ===
               targetUser.academic.university.toLowerCase();
            hasAccess = Boolean(sameUniversity);
            canFollow = Boolean(sameUniversity);
         } else {
            // Not logged in - no access
            hasAccess = false;
            canFollow = false;
         }
      } else if (profileVisibility === 'private') {
         // Private profile - no access and no follow allowed
         hasAccess = false;
         canFollow = false;
      } else {
         // Default case - ensure boolean values
         hasAccess = false;
         canFollow = false;
      }

      // Build response based on access level - ensure boolean values
      let responseData = {
         ...baseProfile,
         privacy: {
            profileVisibility,
            hasAccess: Boolean(hasAccess),
            canFollow: Boolean(canFollow),
            isOwnProfile: Boolean(isOwnProfile)
         }
      };

      if (hasAccess || isOwnProfile) {
         // Add detailed information
         // Count total uploads (all notes by user)
         const totalUploadsCount = await Note.countDocuments({
            uploader: targetUser._id
         });

         // Count public uploads only for display
         const publicUploadsCount = await Note.countDocuments({
            uploader: targetUser._id,
            visibility: { $in: ['public', 'university'] }
         });

         // Calculate total downloads from user's notes
         const totalDownloads = await Note.aggregate([
            { $match: { uploader: targetUser._id } },
            { $group: { _id: null, total: { $sum: '$social.downloads' } } }
         ]);

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
               totalUploads: publicUploadsCount, // Show only public/university visible notes count
               totalDownloads: totalDownloads[0]?.total || 0,
               totalLikesReceived: targetUser.activity.totalLikesReceived || 0,
               followersCount: targetUser.activity.followers?.length || 0,
               followingCount: targetUser.activity.following?.length || 0
            }
         };

         // Check if requesting user follows target user using efficient method
         if (requestingUser && !isOwnProfile) {
            responseData.relationship = {
               isFollowing: requestingUser.isFollowing(targetUser._id),
               isFollowedBy: requestingUser.isFollowedBy(targetUser._id)
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

// Get public user's notes with pagination
export const getPublicUserNotes = async (req, res) => {
   try {
      const { username } = req.params;
      const { page = 1, limit = 12, sortBy = 'uploadDate', sortOrder = 'desc' } = req.query;

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

      // Determine access level (same logic as getPublicUserProfile)
      let hasAccess = false;

      if (isOwnProfile) {
         // Own profile - full access
         hasAccess = true;
      } else if (profileVisibility === 'public') {
         // Public profile - everyone can see
         hasAccess = true;
      } else if (profileVisibility === 'university' && requestingUser) {
         // University-only - check if same university
         const sameUniversity = requestingUser.academic?.university &&
            targetUser.academic?.university &&
            requestingUser.academic.university.toLowerCase() ===
            targetUser.academic.university.toLowerCase();
         hasAccess = sameUniversity;
      } else if (profileVisibility === 'private') {
         // Private profile - no access to notes
         hasAccess = false;
      }

      // If no access, return empty result with message
      if (!hasAccess && !isOwnProfile) {
         return res.status(403).json({
            success: false,
            message: 'Access denied. This user\'s notes are not public.',
            data: {
               notes: [],
               pagination: {
                  currentPage: parseInt(page),
                  totalPages: 0,
                  totalNotes: 0,
                  hasNextPage: false,
                  hasPrevPage: false
               },
               privacy: {
                  profileVisibility,
                  hasAccess: false
               }
            }
         });
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Build query for notes based on access level
      let notesQuery = { uploader: targetUser._id };

      if (!isOwnProfile) {
         // For non-own profiles, only show public or university-visible notes
         if (profileVisibility === 'public') {
            notesQuery.visibility = { $in: ['public', 'university'] };
         } else if (profileVisibility === 'university') {
            notesQuery.visibility = { $in: ['public', 'university'] };
         }
      }

      // Fetch notes with pagination
      const notes = await Note.find(notesQuery)
         .select('title description tags academic subject file.downloadUrl file.thumbnailUrl file.driveFileId social uploadDate visibility')
         .populate({
            path: 'uploader',
            select: 'profile.firstName profile.lastName profile.avatar username'
         })
         .sort(sortOptions)
         .skip(skip)
         .limit(parseInt(limit))
         .lean();

      // Count total notes for pagination
      const totalNotes = await Note.countDocuments(notesQuery);

      // Format notes for frontend (similar to NoteCard structure)
      const formattedNotes = notes.map(note => ({
         _id: note._id,
         title: note.title,
         subject: note.subject?.name || 'Unknown Subject',
         description: note.description,
         tags: note.tags || [],
         viewUrl: `/note/${note._id}`, // Direct link to note details
         downloadUrl: note.file?.downloadUrl,
         driveFileId: note.file?.driveFileId,
         thumbnailUrl: note.file?.thumbnailUrl,
         stats: {
            views: note.social?.views || 0,
            likes: note.social?.likes?.length || 0,
            downloads: note.social?.downloads || 0
         },
         uploader: {
            name: note.uploader ? `${note.uploader.profile.firstName} ${note.uploader.profile.lastName}` : 'Anonymous',
            username: note.uploader?.username || 'unknown',
            avatar: note.uploader?.profile?.avatar
         },
         uploadDate: note.uploadDate,
         academic: {
            university: note.academic?.university,
            department: note.academic?.department,
            semester: note.academic?.semester
         }
      }));

      // Build pagination info
      const pagination = {
         currentPage: parseInt(page),
         totalPages: Math.ceil(totalNotes / parseInt(limit)),
         totalNotes,
         hasNextPage: skip + parseInt(limit) < totalNotes,
         hasPrevPage: parseInt(page) > 1,
         limit: parseInt(limit)
      };

      res.status(200).json({
         success: true,
         message: `Found ${totalNotes} notes for user ${username}`,
         data: {
            notes: formattedNotes,
            pagination,
            privacy: {
               profileVisibility,
               hasAccess: true,
               isOwnProfile
            },
            user: {
               username: targetUser.username,
               name: `${targetUser.profile.firstName} ${targetUser.profile.lastName}`,
               avatar: targetUser.profile.avatar
            }
         }
      });

   } catch (error) {
      console.error('Get public user notes error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch user notes',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Follow a user
export const followUser = async (req, res) => {
   try {
      const { username } = req.params;

      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required'
         });
      }

      // Find the user to follow
      const userToFollow = await User.findOne({
         username,
         'account.isActive': true
      }).select('_id username profile preferences academic activity');

      if (!userToFollow) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      // Check if trying to follow self
      if (userToFollow._id.toString() === req.user._id.toString()) {
         return res.status(400).json({
            success: false,
            message: 'You cannot follow yourself'
         });
      }

      // Check if already following
      if (req.user.isFollowing(userToFollow._id)) {
         return res.status(400).json({
            success: false,
            message: 'You are already following this user',
            data: {
               relationship: {
                  isFollowing: true,
                  followersCount: userToFollow.activity.followers.length,
                  followingCount: req.user.activity.following.length
               }
            }
         });
      }

      // Check privacy settings and follow permissions
      const profileVisibility = userToFollow.preferences?.privacy?.profileVisibility || 'university';
      let canFollow = false;

      if (profileVisibility === 'public') {
         canFollow = true;
      } else if (profileVisibility === 'university') {
         const sameUniversity = req.user.academic?.university &&
            userToFollow.academic?.university &&
            req.user.academic.university.toLowerCase() ===
            userToFollow.academic.university.toLowerCase();
         canFollow = sameUniversity;
      }

      if (!canFollow) {
         const message = profileVisibility === 'private'
            ? 'This user\'s profile is private and cannot be followed'
            : profileVisibility === 'university'
               ? 'You can only follow users from the same university'
               : 'You cannot follow this user';

         return res.status(403).json({
            success: false,
            message
         });
      }

      // Use the efficient toggleFollow method
      const result = await User.toggleFollow(req.user._id, userToFollow._id, 'follow');

      // Create follow notification (don't await to avoid blocking the response)
      Notification.createFollowNotification(req.user._id, userToFollow._id)
         .catch(error => console.error('Failed to create follow notification:', error));

      res.status(200).json({
         success: true,
         message: `You are now following ${userToFollow.profile.firstName}`,
         data: {
            followedUser: {
               id: userToFollow._id,
               username: userToFollow.username,
               name: `${userToFollow.profile.firstName} ${userToFollow.profile.lastName}`,
               avatar: userToFollow.profile.avatar
            },
            relationship: {
               isFollowing: true,
               followersCount: result.followersCount,
               followingCount: result.followingCount
            }
         }
      });

   } catch (error) {
      console.error('Follow user error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to follow user',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
   try {
      const { username } = req.params;

      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required'
         });
      }

      // Find the user to unfollow
      const userToUnfollow = await User.findOne({
         username,
         'account.isActive': true
      }).select('_id username profile activity');

      if (!userToUnfollow) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      // Check if not following
      if (!req.user.isFollowing(userToUnfollow._id)) {
         return res.status(400).json({
            success: false,
            message: 'You are not following this user',
            data: {
               relationship: {
                  isFollowing: false,
                  followersCount: userToUnfollow.activity.followers.length,
                  followingCount: req.user.activity.following.length
               }
            }
         });
      }

      // Use the efficient toggleFollow method
      const result = await User.toggleFollow(req.user._id, userToUnfollow._id, 'unfollow');

      // Delete follow notification (don't await to avoid blocking the response)
      Notification.deleteFollowNotification(req.user._id, userToUnfollow._id)
         .catch(error => console.error('Failed to delete follow notification:', error));

      res.status(200).json({
         success: true,
         message: `You unfollowed ${userToUnfollow.profile.firstName}`,
         data: {
            unfollowedUser: {
               id: userToUnfollow._id,
               username: userToUnfollow.username,
               name: `${userToUnfollow.profile.firstName} ${userToUnfollow.profile.lastName}`,
               avatar: userToUnfollow.profile.avatar
            },
            relationship: {
               isFollowing: false,
               followersCount: result.followersCount,
               followingCount: result.followingCount
            }
         }
      });

   } catch (error) {
      console.error('Unfollow user error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to unfollow user',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Get public user's followers with pagination
export const getPublicUserFollowers = async (req, res) => {
   try {
      const { username } = req.params;
      const { page = 1, limit = 20 } = req.query;

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

      // Check access permissions for viewing followers
      let hasAccess = false;

      if (isOwnProfile) {
         // Own profile - full access
         hasAccess = true;
      } else if (profileVisibility === 'public') {
         // Public profile - everyone can see followers
         hasAccess = true;
      } else if (profileVisibility === 'university' && requestingUser) {
         // University-only - check if same university
         const sameUniversity = requestingUser.academic?.university &&
            targetUser.academic?.university &&
            requestingUser.academic.university.toLowerCase() ===
            targetUser.academic.university.toLowerCase();
         hasAccess = sameUniversity;
      } else if (profileVisibility === 'private') {
         // Private profile - no access to followers list
         hasAccess = false;
      }

      // If no access, return error
      if (!hasAccess) {
         return res.status(403).json({
            success: false,
            message: 'You do not have permission to view this user\'s followers'
         });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get total followers count efficiently
      const totalFollowers = await User.aggregate([
         { $match: { _id: targetUser._id } },
         { $project: { followersCount: { $size: '$activity.followers' } } }
      ]);

      const followersCount = totalFollowers[0]?.followersCount || 0;

      // Only fetch the requested page of followers with minimal required data
      const user = await User.findById(targetUser._id)
         .populate({
            path: 'activity.followers',
            select: 'profile.firstName profile.lastName profile.avatar username academic.university academic.department',
            options: {
               skip: skip,
               limit: parseInt(limit)
            }
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
            targetUser: {
               id: targetUser._id,
               username: targetUser.username,
               fullName: `${targetUser.profile.firstName} ${targetUser.profile.lastName}`,
               avatar: targetUser.profile.avatar
            },
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(followersCount / parseInt(limit)),
               totalFollowers: followersCount,
               hasNextPage: skip + parseInt(limit) < followersCount,
               hasPrevPage: parseInt(page) > 1,
               limit: parseInt(limit)
            }
         }
      });

   } catch (error) {
      console.error('Get public user followers error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch followers',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Update note details (excluding file)
export const updateNoteDetails = async (req, res) => {
   try {
      // Check if user profile exists in our database
      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'User not authenticated'
         });
      }

      const { noteId } = req.params;

      if (!noteId) {
         return res.status(400).json({
            success: false,
            message: 'Note ID is required'
         });
      }

      // Find the note and verify ownership
      const note = await Note.findOne({
         _id: noteId,
         uploader: req.user._id
      });

      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found or you do not have permission to edit this note'
         });
      }

      // Extract and validate required fields
      const {
         title,
         description,
         subject,
         university,
         degree,  // Frontend sends 'degree' for degreeType
         department,
         semester,
         graduationYear,
         category,
         difficulty,
         visibility,
         tags,
         courseCode,
         courseName,
         courseCredits
      } = req.body;

      // Validate required fields
      if (!title || !description || !subject) {
         return res.status(400).json({
            success: false,
            message: 'Missing required fields: title, description, and subject are required'
         });
      }

      // Parse tags if it's a string
      let parsedTags = tags;
      if (typeof tags === 'string') {
         parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }

      // Build update object using dot notation to preserve existing nested data
      const updates = {
         title: title.trim(),
         description: description.trim(),
         tags: parsedTags || [],

         // Subject information
         'subject.name': subject.trim(),
         'subject.category': category || 'lecture-notes',
         'subject.difficulty': difficulty || 'intermediate',

         // Visibility
         visibility: visibility || 'public'
      };

      // Handle academic fields - use 'ALL' defaults for empty values to maintain compatibility
      if (university !== undefined) {
         updates['academic.university'] = university && university.trim() ? university.trim() : 'ALL';
      }

      if (department !== undefined) {
         updates['academic.department'] = department && department.trim() ? department.trim() : 'ALL';
      }

      if (degree !== undefined) {
         updates['academic.degree'] = degree && degree.trim() ? degree.trim() : 'bachelor';
      }

      if (semester !== undefined) {
         updates['academic.semester'] = semester ? parseInt(semester) : 0; // 0 means all semesters
      }

      // Handle graduation year -> academic year conversion
      if (graduationYear !== undefined) {
         console.log('Updating graduation year:', graduationYear, 'for note:', noteId);
         if (graduationYear && graduationYear.trim()) {
            const gradYear = parseInt(graduationYear);
            if (!isNaN(gradYear)) {
               // Convert graduation year to academic year format (e.g., 2025 -> "2021-25")
               const startYear = gradYear - 4;
               const newAcademicYear = `${startYear}-${gradYear.toString().slice(-2)}`;
               updates['academic.academicYear'] = newAcademicYear;
               console.log('Setting academic year to:', newAcademicYear);
            }
         } else {
            // If graduation year is empty, set to default academic year
            updates['academic.academicYear'] = '2024-25';
            console.log('Setting academic year to default: 2024-25');
         }
      }

      // Handle course information if provided (preserve existing if not provided)
      if (courseCode) updates['academic.course.code'] = courseCode;
      if (courseName) updates['academic.course.name'] = courseName;
      if (courseCredits !== undefined) updates['academic.course.credits'] = parseInt(courseCredits) || 3;

      // Update the note
      const updatedNote = await Note.findByIdAndUpdate(
         noteId,
         { $set: updates },
         { new: true, runValidators: true }
      ).populate('uploader', 'profile.firstName profile.lastName profile.avatar username');

      if (!updatedNote) {
         return res.status(404).json({
            success: false,
            message: 'Failed to update note'
         });
      }

      // Transform the response to match frontend expectations
      const extractedGradYear = updatedNote.academic?.academicYear && updatedNote.academic.academicYear !== '2024-25'
         ? (() => {
            if (!updatedNote.academic.academicYear.includes('-')) {
               return updatedNote.academic.academicYear;
            }
            const yearPart = updatedNote.academic.academicYear.split('-')[1];
            // If year part is 2 digits, convert to 4 digits
            if (yearPart.length === 2) {
               const twoDigitYear = parseInt(yearPart);
               // Assume years 00-30 are 2000s, 31-99 are 1900s (but for graduation, likely 2000s)
               return twoDigitYear <= 30 ? `20${yearPart}` : `19${yearPart}`;
            }
            return yearPart; // Already 4 digits
         })()
         : undefined;

      console.log('Academic year after update:', updatedNote.academic?.academicYear);
      console.log('Extracted graduation year:', extractedGradYear);

      const transformedNote = {
         ...updatedNote.toObject(),
         academic: {
            ...updatedNote.academic,
            graduationYear: extractedGradYear
         }
      };

      res.status(200).json({
         success: true,
         message: 'Note updated successfully',
         note: transformedNote
      });

   } catch (error) {
      console.error('Update note details error:', error);

      if (error.name === 'ValidationError') {
         const errors = Object.values(error.errors).map(err => err.message);
         return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors
         });
      }

      res.status(500).json({
         success: false,
         message: 'Failed to update note details',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};