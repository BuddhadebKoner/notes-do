import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
   // Clerk Authentication & Basic Info
   clerkId: {
      type: String,
      required: true,
      unique: true
   },
   email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
   },
   username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
   },
   // Note: No password field - handled by Clerk

   // Profile Information
   profile: {
      firstName: {
         type: String,
         required: true,
         trim: true,
         maxlength: 50
      },
      lastName: {
         type: String,
         default: '',
         trim: true,
         maxlength: 50
      },
      avatar: {
         type: String,
         default: null
      },
      bio: {
         type: String,
         maxlength: 500,
         trim: true
      },
      dateOfBirth: {
         type: Date
      },
      gender: {
         type: String,
         enum: ['male', 'female', 'other', 'prefer-not-to-say'],
         default: 'prefer-not-to-say'
      }
   },

   // Academic Information - initially optional, can be completed later
   academic: {
      university: {
         type: String,
         trim: true,
         maxlength: 100,
         default: ''
      },
      department: {
         type: String,
         trim: true,
         maxlength: 100,
         default: ''
      },
      currentSemester: {
         type: Number,
         min: 1,
         max: 12
      },
      graduationYear: {
         type: Number
      },
      studentId: {
         type: String,
         trim: true,
         maxlength: 50,
         default: ''
      },
      degree: {
         type: String,
         enum: ['bachelor', 'master', 'phd', 'diploma', 'certificate', 'other'],
         default: 'bachelor'
      },
      // Teacher specific fields - optional initially
      teacherInfo: {
         employeeId: {
            type: String,
            trim: true,
            maxlength: 50,
            default: ''
         },
         designation: {
            type: String,
            enum: ['assistant-professor', 'associate-professor', 'professor', 'lecturer', 'instructor', 'other']
         },
         experience: {
            type: Number,
            min: 0,
            max: 50,
            default: 0
         },
         specialization: [{
            type: String,
            trim: true,
            maxlength: 100
         }]
      }
   },

   // Contact Information
   contact: {
      phone: {
         type: String,
         trim: true,
         maxlength: 20
      },
      address: {
         street: String,
         city: String,
         state: String,
         country: String,
         zipCode: String
      },
      socialLinks: {
         linkedin: String,
         github: String,
         twitter: String,
         website: String
      }
   },

   // User Preferences
   preferences: {
      theme: {
         type: String,
         enum: ['light', 'dark', 'auto'],
         default: 'auto'
      },
      language: {
         type: String,
         default: 'en'
      },
      emailNotifications: {
         newNotes: {
            type: Boolean,
            default: true
         },
         comments: {
            type: Boolean,
            default: true
         },
         likes: {
            type: Boolean,
            default: true
         },
         weeklyDigest: {
            type: Boolean,
            default: false
         }
      },
      privacy: {
         profileVisibility: {
            type: String,
            enum: ['public', 'university', 'private'],
            default: 'public'
         },
         showEmail: {
            type: Boolean,
            default: false
         }
      }
   },

   // Activity & Engagement
   activity: {
      notesUploaded: [{
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Note'
      }],
      favoriteNotes: [{
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Note'
      }],
      // Legacy wishlist field - kept for backward compatibility
      wishlistNotes: [{
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Note'
      }],
      // New multiple wishlists feature
      wishlists: [{
         _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
         },
         name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
         },
         description: {
            type: String,
            maxlength: 500,
            trim: true
         },
         notes: [{
            note: {
               type: mongoose.Schema.Types.ObjectId,
               ref: 'Note',
               required: true
            },
            addedAt: {
               type: Date,
               default: Date.now
            }
         }],
         isPrivate: {
            type: Boolean,
            default: false
         },
         color: {
            type: String,
            enum: ['blue', 'green', 'purple', 'red', 'orange', 'yellow', 'pink', 'gray'],
            default: 'blue'
         },
         createdAt: {
            type: Date,
            default: Date.now
         },
         updatedAt: {
            type: Date,
            default: Date.now
         },
         // Sharing & Private Links
         sharing: {
            shareToken: {
               type: String,
               unique: true,
               sparse: true // Allows null values while maintaining uniqueness
            },
            shareTokenExpiry: {
               type: Date
            },
            isShareEnabled: {
               type: Boolean,
               default: false
            },
            shareCreatedAt: {
               type: Date
            },
            shareUpdatedAt: {
               type: Date
            },
            // Share analytics
            shareStats: {
               totalViews: {
                  type: Number,
                  default: 0
               },
               uniqueUsers: {
                  type: Number,
                  default: 0
               },
               lastAccessed: {
                  type: Date
               },
               accessHistory: [{
                  user: {
                     type: mongoose.Schema.Types.ObjectId,
                     ref: 'User'
                  },
                  accessedAt: {
                     type: Date,
                     default: Date.now
                  },
                  ipAddress: {
                     type: String
                  },
                  userAgent: {
                     type: String
                  }
               }]
            }
         }
      }],
      following: [{
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
      }],
      followers: [{
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
      }],
      totalUploads: {
         type: Number,
         default: 0
      },
      totalLikesReceived: {
         type: Number,
         default: 0
      },
      totalDownloads: {
         type: Number,
         default: 0
      }
   },

   // Account Status & Security
   account: {
      isVerified: {
         type: Boolean,
         default: false
      },
      isActive: {
         type: Boolean,
         default: true
      },
      role: {
         type: String,
         enum: ['student', 'teacher', 'admin', 'moderator'],
         required: true
      },
      lastLogin: {
         type: Date
      },
      createdViaClerk: {
         type: Boolean,
         default: true
      },
      clerkMetadata: {
         type: mongoose.Schema.Types.Mixed,
         default: {}
      }
   },

   // Google Drive Integration
   driveIntegration: {
      isConnected: {
         type: Boolean,
         default: false
      },
      driveEmail: {
         type: String,
         lowercase: true,
         trim: true
      },
      refreshToken: {
         type: String,
         select: false
      },
      lastSync: {
         type: Date
      },
      storageQuota: {
         used: {
            type: Number,
            default: 0
         },
         limit: {
            type: Number,
            default: 15000000000 // 15GB default Google Drive quota
         }
      }
   }
}, {
   timestamps: true,
   toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
         if (ret.driveIntegration && ret.driveIntegration.refreshToken) {
            delete ret.driveIntegration.refreshToken;
         }
         return ret;
      }
   },
   toObject: { virtuals: true }
});

// Indexes for better performance (unique fields already have indexes)
userSchema.index({ 'academic.university': 1, 'academic.department': 1 });
userSchema.index({ 'account.isActive': 1, 'account.isVerified': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('profile.fullName').get(function () {
   return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Pre-save middleware to update last login
userSchema.pre('save', function (next) {
   if (this.isNew) {
      this.account.lastLogin = new Date();
   }
   next();
});

// Instance method to update last login
userSchema.methods.updateLastLogin = function () {
   return this.updateOne({
      $set: { 'account.lastLogin': new Date() }
   });
};

// Static method to find users by university and department
userSchema.statics.findByAcademicInfo = function (university, department) {
   return this.find({
      'academic.university': new RegExp(university, 'i'),
      'academic.department': new RegExp(department, 'i'),
      'account.isActive': true
   });
};

// Instance method to check if user is following another user
userSchema.methods.isFollowing = function (userId) {
   return this.activity.following.some(followingId =>
      followingId.toString() === userId.toString()
   );
};

// Instance method to check if user is followed by another user
userSchema.methods.isFollowedBy = function (userId) {
   return this.activity.followers.some(followerId =>
      followerId.toString() === userId.toString()
   );
};

// Static method to get relationship between two users efficiently
userSchema.statics.getRelationship = async function (requestingUserId, targetUserId) {
   if (!requestingUserId || !targetUserId) {
      return { isFollowing: false, isFollowedBy: false };
   }

   // Use aggregation to check relationship in a single query
   const result = await this.aggregate([
      {
         $match: { _id: new mongoose.Types.ObjectId(requestingUserId) }
      },
      {
         $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'activity.following',
            as: 'isFollowedBy'
         }
      },
      {
         $project: {
            isFollowing: {
               $in: [new mongoose.Types.ObjectId(targetUserId), '$activity.following']
            },
            isFollowedBy: {
               $gt: [
                  {
                     $size: {
                        $filter: {
                           input: '$isFollowedBy',
                           cond: { $eq: ['$$this._id', new mongoose.Types.ObjectId(targetUserId)] }
                        }
                     }
                  },
                  0
               ]
            }
         }
      }
   ]);

   return result[0] || { isFollowing: false, isFollowedBy: false };
};

// Static method to follow/unfollow with atomic operations and return updated relationship
userSchema.statics.toggleFollow = async function (followerId, followeeId, action = 'follow') {
   const session = await mongoose.startSession();

   try {
      await session.withTransaction(async () => {
         if (action === 'follow') {
            // Add to following and followers arrays atomically
            await Promise.all([
               this.findByIdAndUpdate(
                  followerId,
                  { $addToSet: { 'activity.following': followeeId } },
                  { session }
               ),
               this.findByIdAndUpdate(
                  followeeId,
                  { $addToSet: { 'activity.followers': followerId } },
                  { session }
               )
            ]);
         } else {
            // Remove from following and followers arrays atomically
            await Promise.all([
               this.findByIdAndUpdate(
                  followerId,
                  { $pull: { 'activity.following': followeeId } },
                  { session }
               ),
               this.findByIdAndUpdate(
                  followeeId,
                  { $pull: { 'activity.followers': followerId } },
                  { session }
               )
            ]);
         }
      });

      // Get updated counts efficiently
      const [followerUser, followeeUser] = await Promise.all([
         this.findById(followerId).select('activity.following').lean(),
         this.findById(followeeId).select('activity.followers').lean()
      ]);

      return {
         success: true,
         isFollowing: action === 'follow',
         followingCount: followerUser?.activity?.following?.length || 0,
         followersCount: followeeUser?.activity?.followers?.length || 0
      };

   } catch (error) {
      throw error;
   } finally {
      await session.endSession();
   }
};

export default mongoose.model('User', userSchema);