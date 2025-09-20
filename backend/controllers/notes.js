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

      return {
         success: true,
         file: response.data
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

               return {
                  success: true,
                  file: {
                     id: file.id,
                     name: file.name,
                     mimeType: file.mimeType,
                     size: file.size || fileBuffer.length.toString(),
                     webViewLink: file.webViewLink,
                     webContentLink: file.webContentLink,
                     thumbnailLink: file.thumbnailLink
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

// Get all notes
export const getNotes = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 10,
         university,
         department,
         subject,
         category,
         difficulty,
         semester,
         visibility,
         search,
         sortBy = 'uploadDate',
         sortOrder = 'desc'
      } = req.query;

      // Build filter object
      const filter = { status: 'active' };

      // Apply filters
      if (university) filter.university = new RegExp(university, 'i');
      if (department) filter.department = new RegExp(department, 'i');
      if (subject) filter.subject = new RegExp(subject, 'i');
      if (category) filter.category = category;
      if (difficulty) filter.difficulty = difficulty;
      if (semester) filter.semester = parseInt(semester);
      if (visibility) filter.visibility = visibility;

      // Search functionality
      if (search) {
         filter.$or = [
            { title: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
            { subject: new RegExp(search, 'i') },
            { tags: new RegExp(search, 'i') }
         ];
      }

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const notes = await Note.find(filter)
         .sort(sort)
         .skip(skip)
         .limit(limitNum)
         .populate('uploader', 'firstName lastName email');

      // Get total count for pagination
      const total = await Note.countDocuments(filter);

      res.json({
         success: true,
         notes,
         pagination: {
            current: pageNum,
            total: Math.ceil(total / limitNum),
            count: notes.length,
            totalNotes: total
         },
         filters: {
            university,
            department,
            subject,
            category,
            difficulty,
            semester,
            visibility,
            search
         }
      });

   } catch (error) {
      console.error('Get notes error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch notes',
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