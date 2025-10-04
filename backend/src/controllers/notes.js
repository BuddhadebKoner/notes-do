import multer from 'multer';
import mongoose from 'mongoose';
import { Note, User } from '../models/index.js';
import connectDB from '../config/database.js';
import { generateDriveUrls, uploadToUserDrive, deleteFromUserDrive } from '../utils/googleDrive.js';
import uploadQueue from '../utils/uploadQueue.js';

// Multer configuration for memory storage (no disk storage for Google Drive)
const storage = multer.memoryStorage();

const upload = multer({
   storage: storage,
   limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
   },
   fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
         cb(null, true);
      } else {
         cb(new Error('Only PDF files are allowed'), false);
      }
   }
});

// Upload endpoint
export const uploadNote = async (req, res) => {
   try {
      // Check if user exists and is authenticated
      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'User must be logged in and have a profile to upload notes'
         });
      }

      // Validate file upload
      if (!req.file) {
         return res.status(400).json({
            success: false,
            message: 'No file uploaded. Please select a PDF file.'
         });
      }

      // Validate file type
      if (req.file.mimetype !== 'application/pdf') {
         return res.status(400).json({
            success: false,
            message: 'Only PDF files are allowed for notes upload.'
         });
      }

      // Get form data from request body
      const {
         title,
         description,
         university,
         department,
         course,
         semester,
         academicYear,
         subject,
         category,
         difficulty = 'intermediate',
         tags = [],
         chapters = [],
         visibility = 'public',
         googleDriveToken
      } = req.body;

      // Validate required fields (only title, description, and subject are required now)
      if (!title || !description || !subject) {
         return res.status(400).json({
            success: false,
            message: 'Missing required fields: title, description, and subject are required'
         });
      }

      // Create unique filename
      const timestamp = Date.now();
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${sanitizedTitle}_${timestamp}.pdf`;

      // Get user's Google Drive token data from request (base64 encoded token data)
      let tokenData = null;
      if (googleDriveToken) {
         try {
            // Decode the token from localStorage
            tokenData = JSON.parse(Buffer.from(googleDriveToken, 'base64').toString());
         } catch (error) {
            // Failed to decode Google Drive token
         }
      }

      // Upload to User's Google Drive (if connected) or local storage
      let driveResult;
      let storageLocation = 'local';
      let localFilePath = null;

      if (tokenData) {
         try {
            // Use upload queue for large files to prevent server overload
            const fileSize = req.file.buffer.length;
            const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
            const useQueue = fileSize > 20 * 1024 * 1024; // Queue files >20MB

            if (useQueue) {
               // Add to queue and wait for processing
               driveResult = await uploadQueue.addToQueue(
                  async () => {
                     return await uploadToUserDrive(
                        req.file.buffer,
                        fileName,
                        req.file.mimetype,
                        tokenData,
                        subject
                     );
                  },
                  `${req.user._id}_${timestamp}` // Unique task ID
               );
            } else {
               // Direct upload for smaller files
               driveResult = await uploadToUserDrive(
                  req.file.buffer,
                  fileName,
                  req.file.mimetype,
                  tokenData,
                  subject
               );
            }

            if (driveResult.success) {
               storageLocation = 'google-drive';
            }
         } catch (driveError) {
            console.error('Drive upload error:', driveError.message);
            driveResult = null; // Ensure we fall back to local storage
         }
      }

      // Local storage fallback
      if (!driveResult || !driveResult.success) {
         try {
            // Fallback: Save file locally for development
            const fs = await import('fs').then(m => m.promises);
            const path = await import('path');

            // Create uploads directory if it doesn't exist
            const uploadsDir = path.join(process.cwd(), 'uploads');
            try {
               await fs.mkdir(uploadsDir, { recursive: true });
            } catch (mkdirError) {
               // Directory already exists, continue
            }

            // Save file locally
            localFilePath = path.join(uploadsDir, fileName);
            await fs.writeFile(localFilePath, req.file.buffer);

            driveResult = {
               success: true,
               file: {
                  id: 'local_' + Date.now(),
                  name: fileName,
                  mimeType: req.file.mimetype,
                  size: req.file.size.toString(),
                  webViewLink: `http://localhost:3000/uploads/${fileName}`,
                  webContentLink: `http://localhost:3000/uploads/${fileName}`,
                  thumbnailLink: null
               }
            };
            storageLocation = 'local';
         } catch (localError) {
            throw new Error(`Failed to save file locally: ${localError.message}`);
         }
      }

      if (!driveResult.success) {
         throw new Error(driveResult.error || 'File upload failed');
      }

      // Parse tags if it's a string
      let parsedTags = tags;
      if (typeof tags === 'string') {
         parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }

      // Parse chapters if it's a string
      let parsedChapters = chapters;
      if (typeof chapters === 'string') {
         parsedChapters = chapters.split(',').map(chapter => chapter.trim()).filter(chapter => chapter.length > 0);
      }

      // Create note document matching the schema
      const noteData = {
         title,
         description,
         tags: parsedTags,

         // Academic information (nested object) - use default values if not provided
         academic: {
            university: university || 'ALL', // 'ALL' indicates academic independent  
            department: department || 'ALL',
            course: {
               code: course || `${subject.substring(0, 10).toUpperCase()}${semester || 'ALL'}`,
               name: course || `${subject}${semester ? ` - Semester ${semester}` : ' - All Semesters'}`,
               credits: 3 // default credits
            },
            semester: semester ? parseInt(semester) : 0, // 0 indicates all semesters
            academicYear: academicYear || '2024-25',
            degree: 'bachelor' // default degree
         },

         // Subject information (nested object)
         subject: {
            name: subject,
            category: category || 'lecture-notes',
            difficulty,
            chapters: parsedChapters.map(chapter => ({ name: chapter }))
         },

         // File information (matching schema)
         file: {
            driveFileId: driveResult.file.id,
            driveFileName: driveResult.file.name,
            mimeType: driveResult.file.mimeType || 'application/pdf',
            size: parseInt(driveResult.file.size) || req.file.size,
            downloadUrl: generateDriveUrls(driveResult.file.id).downloadUrl,
            viewUrl: generateDriveUrls(driveResult.file.id).viewUrl,
            directViewUrl: generateDriveUrls(driveResult.file.id).directViewUrl,
            thumbnailUrl: generateDriveUrls(driveResult.file.id).thumbnailUrl,
            lastModified: new Date()
         },

         // Upload information
         uploader: req.user._id,
         uploadDate: new Date(),
         uploadSource: 'web',

         // Content metadata
         content: {
            language: 'en',
            isHandwritten: false,
            hasImages: false,
            hasFormulas: false
         },

         // Social features (defaults)
         social: {
            views: 0,
            downloads: 0,
            shares: 0,
            rating: {
               totalRating: 0,
               ratingCount: 0,
               averageRating: 0
            }
         },

         // Visibility and permissions
         visibility,
         permissions: {
            canDownload: true,
            canComment: true,
            canShare: true,
            requiresApproval: false
         },

         // Status (must be from enum: 'pending', 'approved', 'rejected', 'archived', 'reported')
         status: 'approved', // Changed from 'active' to 'approved'

         // Moderation
         moderation: {
            isReviewed: true,
            reviewedAt: new Date(),
            reportCount: 0
         }
      };

      // Save to database with transaction-like behavior
      let savedNote = null;
      let userUpdated = false;

      try {
         // Save note to database
         const note = new Note(noteData);
         savedNote = await note.save();

         // Update user's activity - add note to notesUploaded array and increment totalUploads
         await User.findByIdAndUpdate(
            req.user._id,
            {
               $push: { 'activity.notesUploaded': savedNote._id },
               $inc: { 'activity.totalUploads': 1 }
            },
            { new: true }
         );
         userUpdated = true;

         // Clean up local file if Google Drive upload was successful
         if (storageLocation === 'google-drive' && localFilePath) {
            try {
               const fs = await import('fs').then(m => m.promises);
               await fs.unlink(localFilePath);
            } catch (cleanupError) {
               console.warn('Failed to clean up local file:', cleanupError.message);
            }
         }

         // Create response message
         let successMessage = storageLocation === 'google-drive'
            ? `📁 Note uploaded successfully to your Google Drive! The file "${fileName}" is now organized in "Notes-Do/${new Date().getFullYear()}${subject ? `/${subject.replace(/[<>:"/\\|?*]/g, '-')}` : ''}" folder.`
            : `💾 Note uploaded successfully to local storage! File saved as "${fileName}".`;

         // Add warning if there was a Google Drive API warning
         if (driveResult?.warning) {
            successMessage += ` Note: ${driveResult.warning}`;
         }

         res.status(201).json({
            success: true,
            message: successMessage,
            note: savedNote,
            file: driveResult.file,
            storageLocation: storageLocation,
            driveInfo: storageLocation === 'google-drive' ? {
               fileName: driveResult.file.name,
               driveFileId: driveResult.file.id,
               viewUrl: driveResult.file.webViewLink,
               warning: driveResult?.warning
            } : null,
            warning: driveResult?.warning
         });

      } catch (dbError) {
         console.error('Database operation failed:', dbError);

         // Rollback: Delete the note from database if it was saved
         if (savedNote && savedNote._id) {
            try {
               await Note.findByIdAndDelete(savedNote._id);
            } catch (deleteError) {
               console.error('Failed to rollback note deletion:', deleteError.message);
            }
         }

         // Rollback: Remove note from user's activity if it was updated
         if (userUpdated && savedNote) {
            try {
               await User.findByIdAndUpdate(
                  req.user._id,
                  {
                     $pull: { 'activity.notesUploaded': savedNote._id },
                     $inc: { 'activity.totalUploads': -1 }
                  }
               );
            } catch (updateError) {
               console.error('Failed to rollback user activity:', updateError.message);
            }
         }

         // Rollback: Delete file from Google Drive if it was uploaded
         if (storageLocation === 'google-drive' && driveResult?.file?.id && tokenData) {
            try {
               const { deleteFromUserDrive } = await import('../utils/googleDrive.js');
               await deleteFromUserDrive(driveResult.file.id, tokenData);
            } catch (driveDeleteError) {
               console.error('Failed to rollback Google Drive file:', driveDeleteError.message);
            }
         }

         // Rollback: Delete local file if it exists
         if (localFilePath) {
            try {
               const fs = await import('fs').then(m => m.promises);
               await fs.unlink(localFilePath);
            } catch (localDeleteError) {
               console.error('Failed to rollback local file:', localDeleteError.message);
            }
         }

         throw dbError;
      }

   } catch (error) {
      console.error('Upload error:', error);

      // Handle multer errors
      if (error instanceof multer.MulterError) {
         if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
               success: false,
               message: 'File too large. Maximum size is 100MB.'
            });
         }
      }

      res.status(500).json({
         success: false,
         message: error.message || 'Failed to upload note',
         error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
   }
};

// Get notes feed - optimized for card display with pagination
export const getNotesFeed = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 12,
         subject,
         category,
         difficulty,
         semester,
         search,
         sortBy = 'uploadDate',
         sortOrder = 'desc'
      } = req.query;

      // Get current user ID if authenticated
      const currentUserId = req.user?.id || null;

      // Pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(Math.max(1, parseInt(limit)), 24); // Between 1-24 per page
      const skip = (pageNum - 1) * limitNum;

      // Build aggregation pipeline for better performance
      const pipeline = [];

      // Match stage - filter documents (only show public notes)
      const matchStage = {
         status: 'approved',
         visibility: 'public' // Only show public notes in feed
      };

      // Apply additional filters (removed university/department filters)
      if (subject?.trim()) {
         matchStage['subject.name'] = { $regex: new RegExp(subject.trim(), 'i') };
      }
      if (category?.trim()) {
         matchStage['subject.category'] = category.trim();
      }
      if (difficulty?.trim()) {
         matchStage['subject.difficulty'] = difficulty.trim();
      }
      if (semester) {
         const semesterNum = parseInt(semester);
         if (semesterNum >= 1 && semesterNum <= 12) {
            // Include both specific semester and academic independent notes (semester: 0)
            matchStage.$or = matchStage.$or || [];
            matchStage.$or.push(
               { 'academic.semester': semesterNum },
               { 'academic.semester': 0 } // Academic independent
            );
         }
      }

      // Search functionality (removed university/department search)
      if (search?.trim()) {
         const searchRegex = { $regex: new RegExp(search.trim(), 'i') };
         matchStage.$and = matchStage.$and || [];
         matchStage.$and.push({
            $or: [
               { title: searchRegex },
               { description: searchRegex },
               { 'subject.name': searchRegex },
               { tags: searchRegex }
            ]
         });
      }
      pipeline.push({ $match: matchStage });

      // Lookup uploader information
      pipeline.push({
         $lookup: {
            from: 'users',
            localField: 'uploader',
            foreignField: '_id',
            as: 'uploader',
            pipeline: [{
               $project: {
                  'profile.firstName': 1,
                  'profile.lastName': 1,
                  'profile.avatar': 1,
                  username: 1,
                  _id: 1
               }
            }]
         }
      });

      // Unwind uploader (convert array to object)
      pipeline.push({
         $unwind: {
            path: '$uploader',
            preserveNullAndEmptyArrays: true
         }
      });

      // Add computed fields
      pipeline.push({
         $addFields: {
            'social.likesCount': { $size: { $ifNull: ['$social.likes', []] } },
            'social.isLikedByCurrentUser': currentUserId ? {
               $in: [new mongoose.Types.ObjectId(currentUserId), { $ifNull: ['$social.likes.user', []] }]
            } : false,
            uploaderName: {
               $cond: {
                  if: '$uploader',
                  then: {
                     $trim: {
                        input: {
                           $concat: [
                              { $ifNull: ['$uploader.profile.firstName', ''] },
                              ' ',
                              { $ifNull: ['$uploader.profile.lastName', ''] }
                           ]
                        }
                     }
                  },
                  else: 'Anonymous'
               }
            }
         }
      });

      // Project only essential fields for simplified card display
      pipeline.push({
         $project: {
            title: 1,
            subject: '$subject.name',
            viewUrl: '$file.viewUrl',
            downloadUrl: '$file.downloadUrl',
            driveFileId: '$file.driveFileId',
            thumbnailUrl: '$file.thumbnailUrl',
            'stats.views': '$social.views',
            'stats.likes': '$social.likesCount',
            'stats.isLiked': '$social.isLikedByCurrentUser',
            'uploader.name': '$uploaderName',
            'uploader.avatar': '$uploader.profile.avatar',
            'uploader.username': '$uploader.username',
            'uploader._id': '$uploader._id'
         }
      });

      // Sort - updated for flattened structure
      const sortStage = {};
      if (sortBy === 'social.views') {
         sortStage['stats.views'] = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'social.downloads') {
         sortStage['stats.downloads'] = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'social.rating.averageRating') {
         sortStage['stats.rating'] = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'title') {
         sortStage.title = sortOrder === 'asc' ? 1 : -1;
      } else {
         sortStage.uploadDate = sortOrder === 'asc' ? 1 : -1;
      }
      pipeline.push({ $sort: sortStage });

      // Create pipeline for counting (without skip/limit)
      const countPipeline = [...pipeline, { $count: 'total' }];

      // Add pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limitNum });

      // Execute both queries in parallel
      const [notes, countResult] = await Promise.all([
         Note.aggregate(pipeline),
         Note.aggregate(countPipeline)
      ]);

      const total = countResult[0]?.total || 0;

      // Return only essential fields for simplified card display
      const transformedNotes = notes.map(note => ({
         _id: note._id,
         title: note.title,
         subject: note.subject || '',
         viewUrl: note.viewUrl,
         downloadUrl: note.downloadUrl,
         driveFileId: note.driveFileId,
         thumbnailUrl: note.thumbnailUrl,
         stats: {
            views: note.stats?.views || 0,
            likes: note.stats?.likes || 0,
            isLiked: note.stats?.isLiked || false
         },
         uploader: {
            name: note.uploader?.name || 'Anonymous',
            avatar: note.uploader?.avatar,
            username: note.uploader?.username,
            _id: note.uploader?._id
         }
      }));

      const response = {
         success: true,
         notes: transformedNotes,
         pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            itemsPerPage: limitNum,
            totalItems: total,
            hasNextPage: pageNum < Math.ceil(total / limitNum),
            hasPrevPage: pageNum > 1
         },
         filters: {
            search: search || null,
            sortBy,
            sortOrder
         }
      };

      res.json(response);

   } catch (error) {
      console.error('Get notes feed error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch notes feed',
         error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
   }
};

// Get detailed note by ID with proper visibility controls
export const getNoteById = async (req, res) => {
   try {
      const { id } = req.params;

      // Validate note ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid note ID format'
         });
      }

      // Find note with necessary populated fields (excluding comments)
      const note = await Note.findById(id)
         .populate({
            path: 'uploader',
            select: 'profile.firstName profile.lastName profile.avatar username academic.university academic.department account.isVerified account.role'
         })
         .populate({
            path: 'social.likes.user',
            select: 'profile.firstName profile.lastName username'
         })
         .populate({
            path: 'social.bookmarks.user',
            select: 'profile.firstName profile.lastName username'
         })
         .select('-comments'); // Exclude comments from the response

      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      // Check if note is approved and active
      if (note.status !== 'approved') {
         return res.status(404).json({
            success: false,
            message: 'Note not available'
         });
      }

      // Get current user data if authenticated
      const currentUserId = req.user?.id || null;
      const currentUser = req.user || null;

      // Visibility and access control logic
      let hasAccess = false;
      let canView = false;
      let canDownload = false;
      let canComment = false;
      let canLike = false;
      let isOwner = false;

      // Check ownership
      isOwner = currentUserId && note.uploader._id.toString() === currentUserId;

      // Determine access based on visibility (simplified to public/private only)
      switch (note.visibility) {
         case 'public':
            hasAccess = true;
            canView = true;
            canDownload = note.permissions.canDownload;
            canComment = !!currentUserId; // Must be logged in to comment
            canLike = !!currentUserId; // Must be logged in to like
            break;

         case 'private':
            // Only owner can access private notes directly
            if (isOwner) {
               hasAccess = true;
               canView = true;
               canDownload = note.permissions.canDownload;
               canComment = true; // Owner can comment on their own notes
               canLike = false; // Owner cannot like their own notes
            }
            break;

         default:
            hasAccess = false;
      }

      // If no access, return appropriate error based on visibility
      if (!hasAccess) {
         if (note.visibility === 'private') {
            return res.status(403).json({
               success: false,
               message: 'This note is private and not accessible',
               errorType: 'PRIVATE_NOTE',
               noteTitle: note.title,
               uploader: {
                  name: `${note.uploader.profile.firstName} ${note.uploader.profile.lastName}`.trim(),
                  username: note.uploader.username
               }
            });
         } else {
            return res.status(404).json({
               success: false,
               message: 'Note not found or not accessible',
               errorType: 'NOT_FOUND'
            });
         }
      }

      // Increment view count if user has access
      if (hasAccess) {
         await Note.findByIdAndUpdate(id, { $inc: { 'social.views': 1 } });
      }

      // Build complete response
      const noteResponse = {
         _id: note._id,
         title: note.title,
         description: note.description,
         tags: note.tags,
         academic: note.academic,
         subject: note.subject,
         file: {
            driveFileId: note.file.driveFileId,
            driveFileName: note.file.driveFileName,
            mimeType: note.file.mimeType,
            size: note.file.size,
            viewUrl: generateDriveUrls(note.file.driveFileId).viewUrl,
            directViewUrl: generateDriveUrls(note.file.driveFileId).directViewUrl,
            downloadUrl: canDownload ? generateDriveUrls(note.file.driveFileId).downloadUrl : null,
            thumbnailUrl: note.file.thumbnailUrl || generateDriveUrls(note.file.driveFileId).thumbnailUrl,
            pageCount: note.file.pageCount
         },
         content: {
            language: note.content.language,
            isHandwritten: note.content.isHandwritten,
            hasImages: note.content.hasImages,
            hasFormulas: note.content.hasFormulas,
            keywords: note.content.keywords
         },
         social: {
            likes: note.social.likes?.length || 0,
            views: note.social.views || 0,
            downloads: note.social.downloads || 0,
            shares: note.social.shares || 0,
            bookmarks: note.social.bookmarks?.length || 0,
            rating: note.social.rating,
            isLiked: currentUserId ? note.social.likes?.some(like => like.user._id.toString() === currentUserId) : false,
            isBookmarked: currentUserId ? note.social.bookmarks?.some(bookmark => bookmark.user._id.toString() === currentUserId) : false,
            commentsCount: 0 // Will be fetched separately if needed
         },
         uploader: {
            _id: note.uploader._id,
            name: `${note.uploader.profile.firstName} ${note.uploader.profile.lastName}`.trim(),
            username: note.uploader.username,
            avatar: note.uploader.profile.avatar,
            isVerified: note.uploader.account.isVerified,
            role: note.uploader.account.role
         },
         uploadDate: note.uploadDate,
         visibility: note.visibility,
         permissions: {
            hasAccess,
            canView,
            canDownload,
            canComment,
            canLike,
            isOwner
         },
         createdAt: note.createdAt,
         updatedAt: note.updatedAt
      };

      res.json({
         success: true,
         note: noteResponse
      });

   } catch (error) {
      console.error('Get note by ID error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch note details',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Download note file
export const downloadNote = async (req, res) => {
   try {
      const { id } = req.params;

      const note = await Note.findById(id);

      if (!note || note.status !== 'approved') {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      // Only allow download of public notes
      if (note.visibility !== 'public') {
         return res.status(403).json({
            success: false,
            message: 'This note is not publicly available for download'
         });
      }

      // Increment download count
      await Note.findByIdAndUpdate(id, { $inc: { 'social.downloads': 1 } });

      // Redirect to the download URL
      const downloadUrl = generateDriveUrls(note.file.driveFileId).downloadUrl;
      if (downloadUrl) {
         return res.redirect(downloadUrl);
      } else {
         return res.status(404).json({
            success: false,
            message: 'File not available for download'
         });
      }

   } catch (error) {
      console.error('Download note error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to download note',
         error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
   }
};

// Cleanup old local files (utility function)
export const cleanupLocalFiles = async (req, res) => {
   try {
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');

      const uploadsDir = path.join(process.cwd(), 'uploads');

      // Check if uploads directory exists
      try {
         await fs.access(uploadsDir);
      } catch {
         return res.json({
            success: true,
            message: 'No uploads directory to clean',
            filesRemoved: 0
         });
      }

      const files = await fs.readdir(uploadsDir);
      let removedCount = 0;

      // Remove files older than 1 hour (for development)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);

      for (const file of files) {
         const filePath = path.join(uploadsDir, file);
         const stats = await fs.stat(filePath);

         if (stats.mtime.getTime() < oneHourAgo) {
            await fs.unlink(filePath);
            removedCount++;
         }
      }

      res.json({
         success: true,
         message: `Cleaned up ${removedCount} old files from local storage`,
         filesRemoved: removedCount
      });

   } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to cleanup files',
         error: error.message
      });
   }
};

// Like a note
export const likeNote = async (req, res) => {
   try {
      const { id } = req.params;
      const userId = req.user.id;

      // Find the note
      const note = await Note.findById(id);
      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      // Check if user already liked the note
      const isAlreadyLiked = note.social.likes.some(
         like => like.user.toString() === userId
      );

      if (isAlreadyLiked) {
         return res.status(400).json({
            success: false,
            message: 'You have already liked this note'
         });
      }

      // Add like
      note.social.likes.push({
         user: userId,
         createdAt: new Date()
      });

      await note.save();

      // Update the note owner's totalLikesReceived count
      await User.findByIdAndUpdate(
         note.uploader,
         { $inc: { 'activity.totalLikesReceived': 1 } }
      );

      res.status(200).json({
         success: true,
         message: 'Note liked successfully',
         data: {
            likesCount: note.social.likes.length,
            isLiked: true
         }
      });

   } catch (error) {
      console.error('Error liking note:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to like note',
         error: error.message
      });
   }
};

// Unlike a note
export const unlikeNote = async (req, res) => {
   try {
      const { id } = req.params;
      const userId = req.user.id;

      // Find the note
      const note = await Note.findById(id);
      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      // Check if user has liked the note
      const likeIndex = note.social.likes.findIndex(
         like => like.user.toString() === userId
      );

      if (likeIndex === -1) {
         return res.status(400).json({
            success: false,
            message: 'You have not liked this note'
         });
      }

      // Remove like
      note.social.likes.splice(likeIndex, 1);
      await note.save();

      // Update the note owner's totalLikesReceived count (decrease)
      await User.findByIdAndUpdate(
         note.uploader,
         { $inc: { 'activity.totalLikesReceived': -1 } }
      );

      res.status(200).json({
         success: true,
         message: 'Note unliked successfully',
         data: {
            likesCount: note.social.likes.length,
            isLiked: false
         }
      });

   } catch (error) {
      console.error('Error unliking note:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to unlike note',
         error: error.message
      });
   }
};



// Get upload queue statistics
export const getUploadQueueStatus = async (req, res) => {
   try {
      const stats = uploadQueue.getStatistics();

      res.status(200).json({
         success: true,
         message: 'Upload queue statistics',
         statistics: stats,
         timestamp: new Date().toISOString()
      });
   } catch (error) {
      console.error('Error getting queue status:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to get queue status',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

// Check note processing status
export const checkNoteStatus = async (req, res) => {
   try {
      const { id } = req.params;

      // Validate note ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid note ID format'
         });
      }

      // Find note (including processing notes)
      const note = await Note.findById(id)
         .populate({
            path: 'uploader',
            select: 'profile.firstName profile.lastName username'
         })
         .select('title status uploadDate uploader file.driveFileName');

      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      // Check if user is the owner (only owner can check processing status)
      const currentUserId = req.user?.id;
      const isOwner = currentUserId && note.uploader._id.toString() === currentUserId;

      if (!isOwner) {
         return res.status(403).json({
            success: false,
            message: 'Only the note owner can check processing status'
         });
      }

      res.json({
         success: true,
         note: {
            _id: note._id,
            title: note.title,
            status: note.status,
            fileName: note.file.driveFileName,
            uploadDate: note.uploadDate,
            isProcessing: note.status === 'processing',
            isReady: note.status === 'approved'
         }
      });

   } catch (error) {
      console.error('Check note status error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to check note status',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Delete note (owner only)
export const deleteNote = async (req, res) => {
   try {
      const { id } = req.params;
      const currentUserId = req.user._id;

      // Validate note ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid note ID format'
         });
      }

      // Find the note and verify ownership
      const note = await Note.findOne({
         _id: id,
         uploader: currentUserId
      });

      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found or you do not have permission to delete this note'
         });
      }

      // CRITICAL: Delete from Google Drive FIRST, then database
      // This prevents orphaned files in Drive if database deletion succeeds but Drive deletion fails

      // Step 1: Attempt to delete from Google Drive (if user has connected Google Drive)
      let driveDeleteResult = null;
      let shouldProceedWithDatabaseDeletion = false;
      const { googleDriveToken } = req.body;

      if (googleDriveToken && note.file.driveFileId) {
         try {
            // Decode the Google Drive token
            const tokenData = JSON.parse(Buffer.from(googleDriveToken, 'base64').toString('utf-8'));
            driveDeleteResult = await deleteFromUserDrive(note.file.driveFileId, tokenData);

            // Check if Drive deletion was successful
            if (driveDeleteResult.success) {
               shouldProceedWithDatabaseDeletion = true;
            } else {
               // IMPORTANT: Do NOT proceed with database deletion if Drive deletion failed
               return res.status(500).json({
                  success: false,
                  message: 'Failed to delete file from Google Drive. Database record preserved to prevent orphaned files.',
                  error: driveDeleteResult.error,
                  note: {
                     _id: note._id,
                     title: note.title,
                     driveFileId: note.file.driveFileId
                  },
                  recommendation: 'Please try again or manually delete the file from Google Drive before retrying.'
               });
            }
         } catch (tokenError) {
            return res.status(400).json({
               success: false,
               message: 'Invalid Google Drive token. Cannot delete file safely.',
               error: tokenError.message,
               recommendation: 'Please reconnect your Google Drive account and try again.'
            });
         }
      } else if (!googleDriveToken) {
         // User didn't provide token - allow deletion with warning
         driveDeleteResult = {
            success: true,
            message: 'Google Drive deletion skipped (no token provided)',
            skipped: true
         };
         shouldProceedWithDatabaseDeletion = true;
      } else if (!note.file.driveFileId) {
         // No Drive file ID - safe to delete from database
         driveDeleteResult = {
            success: true,
            message: 'Google Drive deletion skipped (no file ID found)',
            skipped: true
         };
         shouldProceedWithDatabaseDeletion = true;
      }

      // Step 2: Only proceed with database deletion if Drive deletion succeeded or was skipped
      if (!shouldProceedWithDatabaseDeletion) {
         return res.status(500).json({
            success: false,
            message: 'Cannot delete note from database. File still exists in Google Drive.',
            error: 'Drive deletion failed - preventing orphaned files'
         });
      }

      // Step 3: Remove from uploader's notesUploaded array (immediate)
      await User.findByIdAndUpdate(
         currentUserId,
         {
            $pull: { 'activity.notesUploaded': id },
            $inc: { 'activity.totalUploads': -1 }
         }
      );

      // Step 4: Delete the note from database
      await Note.findByIdAndDelete(id);

      // Step 5: Start background cleanup process for user associations (non-blocking)
      setImmediate(async () => {
         try {
            await cleanupNoteAssociations(id, note.title);
         } catch (bgError) {
            console.error('Background cleanup failed:', bgError.message);
         }
      });

      // Prepare response message
      let message = `Note "${note.title}" has been successfully deleted`;
      if (driveDeleteResult) {
         if (driveDeleteResult.success && !driveDeleteResult.skipped) {
            message = `✅ Note "${note.title}" deleted successfully from both Google Drive and database`;
         } else if (driveDeleteResult.skipped) {
            message = `✅ Note "${note.title}" deleted from database. Google Drive file was not deleted (${driveDeleteResult.message})`;
         }
      }
      message += '. User associations are being cleaned up in the background.';

      const warnings = [];
      if (driveDeleteResult?.skipped) {
         warnings.push({
            type: 'info',
            message: 'File may still exist in your Google Drive. You can manually delete it if needed.'
         });
      }

      res.status(200).json({
         success: true,
         message,
         data: {
            deletedNote: {
               _id: note._id,
               title: note.title,
               fileName: note.file.driveFileName
            },
            googleDriveResult: driveDeleteResult,
            backgroundCleanup: {
               status: 'in_progress',
               message: 'User associations are being cleaned up in the background for optimal performance'
            }
         },
         warnings: warnings.length > 0 ? warnings : undefined
      });

   } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete note',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Optimized background cleanup function for user associations
const cleanupNoteAssociations = async (noteId, noteTitle) => {
   const startTime = Date.now();

   try {
      // Use bulk operations with batching for better performance
      const BATCH_SIZE = 1000; // Process in batches to avoid memory issues
      let totalFavoritesRemoved = 0;
      let totalWishlistsUpdated = 0;
      let totalLegacyRemoved = 0;

      // 1. Clean up favorites in batches using efficient bulk operations
      const favoritesResult = await User.updateMany(
         { 'activity.favoriteNotes': noteId },
         {
            $pull: { 'activity.favoriteNotes': noteId }
         },
         {
            // Use writeConcern for better performance
            writeConcern: { w: 1, j: false }
         }
      );
      totalFavoritesRemoved = favoritesResult.modifiedCount;

      // 2. Clean up wishlists in batches using efficient aggregation
      const wishlistsResult = await User.updateMany(
         { 'activity.wishlists.notes.note': noteId },
         {
            $pull: { 'activity.wishlists.$[].notes': { note: noteId } },
            $set: { 'activity.wishlists.$[].updatedAt': new Date() }
         },
         {
            writeConcern: { w: 1, j: false },
            multi: true
         }
      );
      totalWishlistsUpdated = wishlistsResult.modifiedCount;

      // 3. Clean up legacy wishlist (single operation)
      const legacyResult = await User.updateMany(
         { 'activity.wishlistNotes': noteId },
         { $pull: { 'activity.wishlistNotes': noteId } },
         { writeConcern: { w: 1, j: false } }
      );
      totalLegacyRemoved = legacyResult.modifiedCount;

      const endTime = Date.now();
      const duration = endTime - startTime;

      return {
         success: true,
         stats: {
            favoritesRemoved: totalFavoritesRemoved,
            wishlistsUpdated: totalWishlistsUpdated,
            legacyRemoved: totalLegacyRemoved,
            duration,
            operationsPerSecond: Math.round((totalFavoritesRemoved + totalWishlistsUpdated + totalLegacyRemoved) / (duration / 1000))
         }
      };

   } catch (error) {
      // In production, you might want to:
      // 1. Retry the operation with exponential backoff
      // 2. Store failed operations in a dead letter queue
      // 3. Send alerts to monitoring system
      // 4. Create a cleanup job that can be run manually

      throw error;
   }
};

// Export the multer upload middleware
export const uploadMiddleware = upload.single('noteFile');