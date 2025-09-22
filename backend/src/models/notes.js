import mongoose from 'mongoose';

// Comment subdocument schema
const commentSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
   },
   likes: [{
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
      },
      createdAt: {
         type: Date,
         default: Date.now
      }
   }],
   replies: [{
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true
      },
      content: {
         type: String,
         required: true,
         trim: true,
         maxlength: 500
      },
      createdAt: {
         type: Date,
         default: Date.now
      }
   }],
   isEdited: {
      type: Boolean,
      default: false
   },
   isReported: {
      type: Boolean,
      default: false
   },
   reportCount: {
      type: Number,
      default: 0
   }
}, {
   timestamps: true
});

// Main notes schema
const noteSchema = new mongoose.Schema({
   // Basic Information
   title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true
   },
   description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
   },
   tags: [{
      type: String,
      trim: true,
      maxlength: 50
   }],

   // Academic Classification
   academic: {
      university: {
         type: String,
         required: true,
         trim: true,
         maxlength: 100,
         index: true
      },
      department: {
         type: String,
         required: true,
         trim: true,
         maxlength: 100,
         index: true
      },
      course: {
         code: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20
         },
         name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
         },
         credits: {
            type: Number,
            min: 1,
            max: 10
         }
      },
      semester: {
         type: Number,
         required: true,
         min: 1,
         max: 12,
         index: true
      },
      academicYear: {
         type: String,
         required: true,
         trim: true,
         maxlength: 20
      },
      degree: {
         type: String,
         enum: ['bachelor', 'master', 'phd', 'diploma', 'certificate', 'other'],
         default: 'bachelor'
      }
   },

   // Subject/Topic Information
   subject: {
      name: {
         type: String,
         required: true,
         trim: true,
         maxlength: 100,
         index: true
      },
      category: {
         type: String,
         enum: [
            'lecture-notes',
            'assignment',
            'exam-preparation',
            'project-report',
            'research-paper',
            'presentation',
            'tutorial',
            'lab-manual',
            'reference-material',
            'other'
         ],
         required: true,
         index: true
      },
      difficulty: {
         type: String,
         enum: ['beginner', 'intermediate', 'advanced'],
         default: 'intermediate'
      },
      chapters: [{
         name: String,
         pageRange: {
            start: Number,
            end: Number
         }
      }]
   },

   // File & Drive Information
   file: {
      driveFileId: {
         type: String,
         required: true,
         unique: true,
         index: true
      },
      driveFileName: {
         type: String,
         required: true,
         trim: true
      },
      mimeType: {
         type: String,
         required: true,
         default: 'application/pdf'
      },
      size: {
         type: Number,
         required: true,
         min: 0
      },
      downloadUrl: {
         type: String,
         required: true
      },
      viewUrl: {
         type: String
      },
      thumbnailUrl: {
         type: String
      },
      pageCount: {
         type: Number,
         min: 1
      },
      lastModified: {
         type: Date
      },
      checksum: {
         type: String,
         index: true
      }
   },

   // Upload Information
   uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
   },
   uploadDate: {
      type: Date,
      default: Date.now,
      index: true
   },
   uploadSource: {
      type: String,
      enum: ['web', 'mobile-app', 'api'],
      default: 'web'
   },

   // Content Metadata
   content: {
      language: {
         type: String,
         default: 'en',
         maxlength: 10
      },
      isHandwritten: {
         type: Boolean,
         default: false
      },
      hasImages: {
         type: Boolean,
         default: false
      },
      hasFormulas: {
         type: Boolean,
         default: false
      },
      extractedText: {
         type: String,
         maxlength: 50000,
         select: false // Don't include by default for performance
      },
      keywords: [{
         type: String,
         trim: true,
         maxlength: 50
      }]
   },

   // Social Features
   social: {
      likes: [{
         user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
         },
         createdAt: {
            type: Date,
            default: Date.now
         }
      }],
      views: {
         type: Number,
         default: 0
      },
      downloads: {
         type: Number,
         default: 0
      },
      shares: {
         type: Number,
         default: 0
      },
      bookmarks: [{
         user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
         },
         createdAt: {
            type: Date,
            default: Date.now
         }
      }],
      rating: {
         totalRating: {
            type: Number,
            default: 0
         },
         ratingCount: {
            type: Number,
            default: 0
         },
         averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
         },
         ratings: [{
            user: {
               type: mongoose.Schema.Types.ObjectId,
               ref: 'User'
            },
            rating: {
               type: Number,
               required: true,
               min: 1,
               max: 5
            },
            review: {
               type: String,
               maxlength: 500
            },
            createdAt: {
               type: Date,
               default: Date.now
            }
         }]
      }
   },

   // Comments System
   comments: [commentSchema],

   // Access Control & Visibility
   visibility: {
      type: String,
      enum: ['public', 'university', 'department', 'course', 'private'],
      default: 'university',
      index: true
   },
   permissions: {
      canDownload: {
         type: Boolean,
         default: true
      },
      canComment: {
         type: Boolean,
         default: true
      },
      canShare: {
         type: Boolean,
         default: true
      },
      requiresApproval: {
         type: Boolean,
         default: false
      }
   },

   // Status & Moderation
   status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'archived', 'reported'],
      default: 'pending',
      index: true
   },
   moderation: {
      isReviewed: {
         type: Boolean,
         default: false
      },
      reviewedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
      },
      reviewedAt: {
         type: Date
      },
      reviewNotes: {
         type: String,
         maxlength: 1000
      },
      reportCount: {
         type: Number,
         default: 0
      },
      reports: [{
         reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
         },
         reason: {
            type: String,
            enum: [
               'inappropriate-content',
               'copyright-violation',
               'spam',
               'incorrect-information',
               'duplicate-content',
               'other'
            ]
         },
         description: {
            type: String,
            maxlength: 500
         },
         createdAt: {
            type: Date,
            default: Date.now
         }
      }]
   },

   // SEO & Discovery
   seo: {
      slug: {
         type: String,
         unique: true,
         sparse: true,
         index: true
      },
      metaDescription: {
         type: String,
         maxlength: 160
      },
      searchScore: {
         type: Number,
         default: 0
      }
   },

   // Analytics & Tracking
   analytics: {
      viewHistory: [{
         user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
         },
         timestamp: {
            type: Date,
            default: Date.now
         },
         userAgent: String,
         ipAddress: String
      }],
      downloadHistory: [{
         user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
         },
         timestamp: {
            type: Date,
            default: Date.now
         }
      }],
      trending: {
         dailyViews: {
            type: Number,
            default: 0
         },
         weeklyViews: {
            type: Number,
            default: 0
         },
         monthlyViews: {
            type: Number,
            default: 0
         },
         lastTrendingUpdate: {
            type: Date,
            default: Date.now
         }
      }
   }
}, {
   timestamps: true,
   toJSON: { virtuals: true },
   toObject: { virtuals: true }
});

// Compound indexes for better performance
noteSchema.index({ 'academic.university': 1, 'academic.department': 1, 'academic.semester': 1 });
noteSchema.index({ 'subject.name': 1, 'subject.category': 1 });
noteSchema.index({ status: 1, visibility: 1, createdAt: -1 });
noteSchema.index({ uploader: 1, createdAt: -1 });
noteSchema.index({ 'file.driveFileId': 1 }, { unique: true });
noteSchema.index({ 'social.views': -1, 'social.downloads': -1 });
noteSchema.index({ 'social.rating.averageRating': -1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ 'content.keywords': 1 });

// Text indexes for search functionality
noteSchema.index({
   title: 'text',
   description: 'text',
   'subject.name': 'text',
   'academic.university': 'text',
   'academic.department': 'text',
   'academic.course.name': 'text',
   tags: 'text'
});

// Virtual for like count
noteSchema.virtual('social.likesCount').get(function () {
   return this.social.likes ? this.social.likes.length : 0;
});

// Virtual for comment count
noteSchema.virtual('commentsCount').get(function () {
   return this.comments ? this.comments.length : 0;
});

// Virtual for bookmark count
noteSchema.virtual('social.bookmarksCount').get(function () {
   return this.social.bookmarks ? this.social.bookmarks.length : 0;
});

// Virtual for full academic info
noteSchema.virtual('academic.fullInfo').get(function () {
   return `${this.academic.university} - ${this.academic.department} - Semester ${this.academic.semester}`;
});

// Pre-save middleware to generate slug
noteSchema.pre('save', function (next) {
   if (this.isModified('title') || this.isNew) {
      this.seo.slug = this.title
         .toLowerCase()
         .replace(/[^a-z0-9]/g, '-')
         .replace(/-+/g, '-')
         .replace(/^-|-$/g, '') + '-' + Date.now();
   }
   next();
});

// Pre-save middleware to update rating average
noteSchema.pre('save', function (next) {
   if (this.isModified('social.rating.ratings')) {
      const ratings = this.social.rating.ratings;
      if (ratings.length > 0) {
         const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
         this.social.rating.totalRating = sum;
         this.social.rating.ratingCount = ratings.length;
         this.social.rating.averageRating = sum / ratings.length;
      }
   }
   next();
});

// Instance method to check if user liked the note
noteSchema.methods.isLikedBy = function (userId) {
   return this.social.likes.some(like => like.user.toString() === userId.toString());
};

// Instance method to check if user bookmarked the note
noteSchema.methods.isBookmarkedBy = function (userId) {
   return this.social.bookmarks.some(bookmark => bookmark.user.toString() === userId.toString());
};

// Instance method to increment view count
noteSchema.methods.incrementViews = function (userId = null) {
   this.social.views += 1;
   this.analytics.trending.dailyViews += 1;
   this.analytics.trending.weeklyViews += 1;
   this.analytics.trending.monthlyViews += 1;

   if (userId) {
      this.analytics.viewHistory.push({
         user: userId,
         timestamp: new Date()
      });
   }

   return this.save();
};

// Instance method to add like
noteSchema.methods.addLike = function (userId) {
   if (!this.isLikedBy(userId)) {
      this.social.likes.push({
         user: userId,
         createdAt: new Date()
      });
      return this.save();
   }
   return Promise.resolve(this);
};

// Instance method to remove like
noteSchema.methods.removeLike = function (userId) {
   this.social.likes = this.social.likes.filter(
      like => like.user.toString() !== userId.toString()
   );
   return this.save();
};

// Instance method to add bookmark
noteSchema.methods.addBookmark = function (userId) {
   if (!this.isBookmarkedBy(userId)) {
      this.social.bookmarks.push({
         user: userId,
         createdAt: new Date()
      });
      return this.save();
   }
   return Promise.resolve(this);
};

// Instance method to remove bookmark
noteSchema.methods.removeBookmark = function (userId) {
   this.social.bookmarks = this.social.bookmarks.filter(
      bookmark => bookmark.user.toString() !== userId.toString()
   );
   return this.save();
};

// Static method to find popular notes
noteSchema.statics.findPopular = function (limit = 10) {
   return this.find({
      status: 'approved',
      visibility: { $in: ['public', 'university'] }
   })
      .sort({
         'social.views': -1,
         'social.rating.averageRating': -1,
         'social.downloads': -1
      })
      .limit(limit)
      .populate('uploader', 'username profile.firstName profile.lastName profile.avatar')
      .select('-analytics -content.extractedText');
};

// Static method to find by academic criteria
noteSchema.statics.findByAcademic = function (university, department, semester) {
   return this.find({
      'academic.university': new RegExp(university, 'i'),
      'academic.department': new RegExp(department, 'i'),
      'academic.semester': semester,
      status: 'approved'
   })
      .sort({ createdAt: -1 })
      .populate('uploader', 'username profile.firstName profile.lastName');
};

// Static method for search with filters
noteSchema.statics.searchNotes = function (searchTerm, filters = {}) {
   const query = {
      $text: { $search: searchTerm },
      status: 'approved'
   };

   // Apply filters
   if (filters.university) {
      query['academic.university'] = new RegExp(filters.university, 'i');
   }
   if (filters.department) {
      query['academic.department'] = new RegExp(filters.department, 'i');
   }
   if (filters.semester) {
      query['academic.semester'] = filters.semester;
   }
   if (filters.category) {
      query['subject.category'] = filters.category;
   }
   if (filters.uploader) {
      query.uploader = filters.uploader;
   }

   return this.find(query)
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .populate('uploader', 'username profile.firstName profile.lastName profile.avatar');
};

export default mongoose.model('Note', noteSchema);