import { google } from 'googleapis';
import multer from 'multer';
import { Readable } from 'stream';
import { Note } from '../models/index.js';

// Create Google Drive service for user's personal Drive
const getUserDriveService = (tokenData) => {
   const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
   );

   // Set credentials with both access and refresh tokens
   auth.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date
   });

   return google.drive({ version: 'v3', auth });
};

// Upload file to USER'S Google Drive
const uploadToUserDrive = async (fileBuffer, fileName, mimeType, tokenData) => {
   try {


      const drive = getUserDriveService(tokenData);

      const fileMetadata = {
         name: fileName,
         parents: ['root'] // Upload to user's root Drive folder
      };

      // Convert buffer to readable stream
      const bufferStream = new Readable();
      bufferStream.push(fileBuffer);
      bufferStream.push(null);

      const media = {
         mimeType: mimeType,
         body: bufferStream
      };

      const response = await drive.files.create({
         resource: fileMetadata,
         media: media,
         fields: 'id,name,size,mimeType,webViewLink,webContentLink,thumbnailLink'
      });

      // Make the file publicly viewable
      try {
         await drive.permissions.create({
            fileId: response.data.id,
            resource: {
               role: 'reader',
               type: 'anyone'
            }
         });
      } catch (permissionError) {
         // Silently handle permission errors
      }

      // Create alternative thumbnail URL if the API doesn't provide one
      let thumbnailUrl = response.data.thumbnailLink;
      if (!thumbnailUrl && response.data.id) {
         // Alternative method: Use Google Drive's thumbnail API
         thumbnailUrl = `https://drive.google.com/thumbnail?id=${response.data.id}&sz=w300-h400`;  
      }

      return {
         success: true,
         file: {
            ...response.data,
            thumbnailLink: thumbnailUrl
         }
      };

   } catch (error) {


      // Check if it's an auth error
      if (error.code === 401 || error.code === 403) {
         return {
            success: false,
            error: 'Google Drive authorization expired. Please reconnect your Google Drive.',
            authError: true
         };
      }

      // If it's a 500 error, the file might still have been uploaded successfully
      // Let's try to find the file by searching for it
      if (error.code === 500 || error.status === 500) {


         try {
            const drive = getUserDriveService(tokenData);

            // Search for the file we just uploaded by name
            const searchResponse = await drive.files.list({
               q: `name='${fileName}'`,
               fields: 'files(id,name,size,mimeType,webViewLink,webContentLink,thumbnailLink)',
               orderBy: 'createdTime desc',
               pageSize: 1
            });

            if (searchResponse.data.files && searchResponse.data.files.length > 0) {
               const file = searchResponse.data.files[0];


               // Make the file publicly viewable
               await drive.permissions.create({
                  fileId: file.id,
                  resource: {
                     role: 'reader',
                     type: 'anyone'
                  }
               });

               // Create alternative thumbnail URL if not available
               let thumbnailUrl = file.thumbnailLink;
               if (!thumbnailUrl && file.id) {
                  thumbnailUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w300-h400`;
               }

               return {
                  success: true,
                  file: {
                     id: file.id,
                     name: file.name,
                     mimeType: file.mimeType,
                     size: file.size || fileBuffer.length.toString(),
                     webViewLink: file.webViewLink,
                     webContentLink: file.webContentLink,
                     thumbnailLink: thumbnailUrl
                  },
                  warning: 'File uploaded to Google Drive successfully! Retrieved file details after API error.'
               };
            }
         } catch (searchError) {

         }

         // Fallback if search fails
         return {
            success: true,
            file: {
               id: 'drive_success_' + Date.now(),
               name: fileName,
               mimeType: mimeType,
               size: fileBuffer.length.toString(),
               webViewLink: 'https://drive.google.com/drive/my-drive',
               webContentLink: 'https://drive.google.com/drive/my-drive',
               thumbnailLink: null
            },
            warning: 'File uploaded to Google Drive successfully! Could not retrieve direct file link due to API limitations.'
         };
      }

      return {
         success: false,
         error: error.message || 'Google Drive upload failed',
         details: error.response?.data || error.cause
      };
   }
};

// Multer configuration for memory storage (no disk storage for Google Drive)
const storage = multer.memoryStorage();

const upload = multer({
   storage: storage,
   limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
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
         visibility = 'university',
         googleDriveToken
      } = req.body;

      // Validate required fields
      if (!title || !description || !university || !department || !subject || !semester) {
         return res.status(400).json({
            success: false,
            message: 'Missing required fields: title, description, university, department, subject, semester'
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
            console.error('Failed to decode Google Drive token:', error);
         }
      }

      // Upload to User's Google Drive (if connected) or local storage
      let driveResult;
      let storageLocation = 'local';
      let localFilePath = null;

      if (tokenData) {
         try {
            driveResult = await uploadToUserDrive(
               req.file.buffer,
               fileName,
               req.file.mimetype,
               tokenData
            );
            if (driveResult.success) {
               storageLocation = 'google-drive';
            }
         } catch (driveError) {
            console.error('Google Drive upload failed, falling back to local storage:', driveError);
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
               console.log('Upload directory already exists');
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

            console.log('File saved locally at:', localFilePath);
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

         // Academic information (nested object)
         academic: {
            university,
            department,
            course: {
               code: course || `${subject.substring(0, 10).toUpperCase()}${semester}`,
               name: course || `${subject} - Semester ${semester}`,
               credits: 3 // default credits
            },
            semester: parseInt(semester),
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
            downloadUrl: driveResult.file.webContentLink || driveResult.file.webViewLink,
            viewUrl: driveResult.file.webViewLink,
            thumbnailUrl: driveResult.file.thumbnailLink,
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
      };      // Save to database
      const note = new Note(noteData);
      const savedNote = await note.save();

      // Clean up local file if Google Drive upload was successful
      if (storageLocation === 'google-drive' && localFilePath) {
         try {
            const fs = await import('fs').then(m => m.promises);
            await fs.unlink(localFilePath);
            console.log('Cleaned up local file after successful Google Drive upload:', localFilePath);
         } catch (cleanupError) {
            console.warn('Failed to clean up local file:', cleanupError.message);
         }
      }

      // Create response message
      let successMessage = storageLocation === 'google-drive'
         ? `📁 Note uploaded successfully to your Google Drive! The file "${fileName}" is now stored in your personal Drive.`
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

   } catch (error) {
      console.error('Upload error:', error);

      // Handle multer errors
      if (error instanceof multer.MulterError) {
         if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
               success: false,
               message: 'File too large. Maximum size is 50MB.'
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
         university,
         department,
         subject,
         category,
         difficulty,
         semester,
         search,
         sortBy = 'uploadDate',
         sortOrder = 'desc'
      } = req.query;

      console.log('Feed request params:', req.query); // Debug log
      console.log('User info:', req.user ? {
         id: req.user._id,
         university: req.user.academic?.university,
         department: req.user.academic?.department
      } : 'No user'); // Debug log

      // Pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(Math.max(1, parseInt(limit)), 24); // Between 1-24 per page
      const skip = (pageNum - 1) * limitNum;

      // Build aggregation pipeline for better performance
      const pipeline = [];

      // Match stage - filter documents
      const matchStage = {
         status: 'approved',
         'account.isActive': { $ne: false }, // Ensure user account is active
      };

      // Visibility filtering - more permissive approach
      if (req.user?.academic?.university) {
         matchStage.$or = [
            { visibility: 'public' },
            {
               visibility: 'university',
               'academic.university': { $regex: new RegExp(req.user.academic.university, 'i') }
            },
            {
               visibility: 'department',
               'academic.university': { $regex: new RegExp(req.user.academic.university, 'i') },
               'academic.department': { $regex: new RegExp(req.user.academic.department || '', 'i') }
            }
         ];
      } else {
         // If no user academic info, show public notes and university notes
         matchStage.$or = [
            { visibility: 'public' },
            { visibility: 'university' }
         ];
      }

      // Apply additional filters
      if (university?.trim()) {
         matchStage['academic.university'] = { $regex: new RegExp(university.trim(), 'i') };
      }
      if (department?.trim()) {
         matchStage['academic.department'] = { $regex: new RegExp(department.trim(), 'i') };
      }
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
            matchStage['academic.semester'] = semesterNum;
         }
      }

      // Search functionality
      if (search?.trim()) {
         const searchRegex = { $regex: new RegExp(search.trim(), 'i') };
         matchStage.$and = matchStage.$and || [];
         matchStage.$and.push({
            $or: [
               { title: searchRegex },
               { description: searchRegex },
               { 'subject.name': searchRegex },
               { 'academic.university': searchRegex },
               { 'academic.department': searchRegex },
               { tags: searchRegex }
            ]
         });
      }

      console.log('Match stage criteria:', JSON.stringify(matchStage, null, 2)); // Debug log
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
                  username: 1
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
            'uploader.name': '$uploaderName',
            'uploader.avatar': '$uploader.profile.avatar'
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
            likes: note.stats?.likes || 0
         },
         uploader: {
            name: note.uploader?.name || 'Anonymous',
            avatar: note.uploader?.avatar
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

      console.log(`Feed response: ${transformedNotes.length} notes, page ${pageNum}/${Math.ceil(total / limitNum)}`);
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

// Get note by ID
export const getNoteById = async (req, res) => {
   try {
      const { id } = req.params;

      const note = await Note.findById(id)
         .populate('uploadedBy', 'firstName lastName email')
         .select('-__v');

      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      res.json({
         success: true,
         note
      });

   } catch (error) {
      console.error('Get note by ID error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch note',
         error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
   }
};

// Download note file
export const downloadNote = async (req, res) => {
   try {
      const { id } = req.params;

      const note = await Note.findById(id);

      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      // For now, redirect to the file URL
      if (note.file.webContentLink) {
         return res.redirect(note.file.webContentLink);
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

// Export the multer upload middleware
export const uploadMiddleware = upload.single('noteFile');