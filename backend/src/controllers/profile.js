import { User, Note } from '../models/index.js';
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
      });

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

      // Check privacy settings and follow permissions
      const profileVisibility = userToFollow.preferences?.privacy?.profileVisibility || 'university';
      let canFollow = false;

      if (profileVisibility === 'public') {
         // Public profile - anyone can follow
         canFollow = true;
      } else if (profileVisibility === 'university') {
         // University-only - check if same university
         const sameUniversity = req.user.academic?.university &&
            userToFollow.academic?.university &&
            req.user.academic.university.toLowerCase() ===
            userToFollow.academic.university.toLowerCase();
         canFollow = sameUniversity;
      } else if (profileVisibility === 'private') {
         // Private profile - no one can follow
         canFollow = false;
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

      // Use atomic operations to update both users - MongoDB handles duplicates with $addToSet
      const [currentUserResult, targetUserResult] = await Promise.all([
         User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { 'activity.following': userToFollow._id } },
            { new: true }
         ),
         User.findByIdAndUpdate(
            userToFollow._id,
            { $addToSet: { 'activity.followers': req.user._id } },
            { new: true }
         )
      ]);

      // Check if the follow action actually happened (not already following)
      const wasAlreadyFollowing = !currentUserResult.activity.following.includes(userToFollow._id) ||
         !targetUserResult.activity.followers.includes(req.user._id);

      if (wasAlreadyFollowing) {
         return res.status(400).json({
            success: false,
            message: 'You are already following this user'
         });
      }

      res.status(200).json({
         success: true,
         message: `You are now following ${userToFollow.profile.firstName}`,
         data: {
            followedUser: {
               id: userToFollow._id,
               username: userToFollow.username,
               name: userToFollow.profile.fullName,
               avatar: userToFollow.profile.avatar
            },
            relationship: {
               isFollowing: true,
               followersCount: targetUserResult.activity.followers.length,
               followingCount: currentUserResult.activity.following.length
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
      });

      if (!userToUnfollow) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      // Use atomic operations to update both users
      const [currentUserResult, targetUserResult] = await Promise.all([
         User.findByIdAndUpdate(
            req.user._id,
            { $pull: { 'activity.following': userToUnfollow._id } },
            { new: true }
         ),
         User.findByIdAndUpdate(
            userToUnfollow._id,
            { $pull: { 'activity.followers': req.user._id } },
            { new: true }
         )
      ]);

      // Check if the unfollow action actually happened
      const wasNotFollowing = currentUserResult.activity.following.includes(userToUnfollow._id) ||
         targetUserResult.activity.followers.includes(req.user._id);

      if (wasNotFollowing) {
         return res.status(400).json({
            success: false,
            message: 'You are not following this user'
         });
      }

      res.status(200).json({
         success: true,
         message: `You unfollowed ${userToUnfollow.profile.firstName}`,
         data: {
            unfollowedUser: {
               id: userToUnfollow._id,
               username: userToUnfollow.username,
               name: userToUnfollow.profile.fullName,
               avatar: userToUnfollow.profile.avatar
            },
            relationship: {
               isFollowing: false,
               followersCount: targetUserResult.activity.followers.length,
               followingCount: currentUserResult.activity.following.length
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