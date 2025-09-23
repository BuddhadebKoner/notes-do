import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
   // Clerk Authentication & Basic Info
   clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true
   },
   email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
   },
   username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true
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

   // Academic Information
   academic: {
      university: {
         type: String,
         trim: true,
         maxlength: 100
      },
      department: {
         type: String,
         trim: true,
         maxlength: 100
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
         maxlength: 50
      },
      degree: {
         type: String,
         enum: ['bachelor', 'master', 'phd', 'diploma', 'certificate', 'other'],
         default: 'bachelor'
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
            default: 'university'
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
      wishlistNotes: [{
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Note'
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
         default: 'student'
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

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ clerkId: 1 });
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

export default mongoose.model('User', userSchema);