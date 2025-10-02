import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Note, User } from '../models/index.js';
import { generateDriveUrls, uploadToUserDrive } from '../utils/googleDrive.js';

// In-memory store for upload sessions (in production, use Redis)
const uploadSessions = new Map();

/**
 * Initialize chunked upload session
 */
export const initializeChunkedUpload = async (req, res) => {
   try {
      const {
         fileName,
         fileSize,
         totalChunks,
         chunkSize,
         fileHash,
         // Note metadata
         title,
         description,
         subject,
         university,
         department,
         course,
         semester,
         academicYear,
         category,
         difficulty = 'intermediate',
         tags = [],
         chapters = [],
         visibility = 'public'
      } = req.body;

      // Validate required fields
      if (!fileName || !fileSize || !totalChunks || !chunkSize || !fileHash) {
         return res.status(400).json({
            success: false,
            message: 'Missing required upload parameters'
         });
      }

      // Validate note metadata
      if (!title || !description || !subject) {
         return res.status(400).json({
            success: false,
            message: 'Missing required note fields: title, description, subject'
         });
      }

      // Check file size limits (100MB)
      if (fileSize > 100 * 1024 * 1024) {
         return res.status(400).json({
            success: false,
            message: 'File size exceeds 100MB limit'
         });
      }

      // Generate unique upload session ID
      const uploadId = crypto.randomUUID();

      // Create temp directory for this upload
      const tempDir = path.join(process.cwd(), 'temp', 'uploads', uploadId);
      await fs.promises.mkdir(tempDir, { recursive: true });

      // Store upload session
      const uploadSession = {
         uploadId,
         fileName,
         fileSize: parseInt(fileSize),
         totalChunks: parseInt(totalChunks),
         chunkSize: parseInt(chunkSize),
         fileHash,
         tempDir,
         uploadedChunks: new Set(),
         metadata: {
            title,
            description,
            subject,
            university,
            department,
            course,
            semester,
            academicYear,
            category,
            difficulty,
            tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : []),
            chapters: Array.isArray(chapters) ? chapters : (typeof chapters === 'string' ? chapters.split(',').map(c => c.trim()) : []),
            visibility
         },
         userId: req.user._id,
         createdAt: new Date(),
         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      uploadSessions.set(uploadId, uploadSession);

      // Clean up expired sessions
      cleanupExpiredSessions();

      res.status(200).json({
         success: true,
         uploadId,
         message: 'Upload session initialized',
         session: {
            uploadId,
            totalChunks: uploadSession.totalChunks,
            chunkSize: uploadSession.chunkSize,
            expiresAt: uploadSession.expiresAt
         }
      });

   } catch (error) {
      console.error('Initialize chunked upload error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to initialize upload session'
      });
   }
};

/**
 * Upload individual chunk
 */
export const uploadChunk = async (req, res) => {
   try {
      const { uploadId } = req.params;
      const { chunkIndex, chunkHash } = req.body;

      if (!req.file) {
         return res.status(400).json({
            success: false,
            message: 'No chunk data received'
         });
      }

      // Get upload session
      const session = uploadSessions.get(uploadId);
      if (!session) {
         return res.status(404).json({
            success: false,
            message: 'Upload session not found or expired'
         });
      }

      // Validate chunk index
      const chunkIdx = parseInt(chunkIndex);
      if (chunkIdx < 0 || chunkIdx >= session.totalChunks) {
         return res.status(400).json({
            success: false,
            message: 'Invalid chunk index'
         });
      }

      // Verify chunk hash for integrity
      const actualHash = crypto.createHash('md5').update(req.file.buffer).digest('hex');
      if (chunkHash && actualHash !== chunkHash) {
         return res.status(400).json({
            success: false,
            message: 'Chunk integrity check failed'
         });
      }

      // Save chunk to temp directory
      const chunkPath = path.join(session.tempDir, `chunk_${chunkIdx}`);
      await fs.promises.writeFile(chunkPath, req.file.buffer);

      // Mark chunk as uploaded
      session.uploadedChunks.add(chunkIdx);

      // Calculate progress
      const progress = (session.uploadedChunks.size / session.totalChunks) * 100;

      res.status(200).json({
         success: true,
         message: 'Chunk uploaded successfully',
         chunkIndex: chunkIdx,
         progress: Math.round(progress),
         uploadedChunks: session.uploadedChunks.size,
         totalChunks: session.totalChunks,
         isComplete: session.uploadedChunks.size === session.totalChunks
      });

   } catch (error) {
      console.error('Upload chunk error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to upload chunk'
      });
   }
};

/**
 * Get upload progress
 */
export const getUploadProgress = async (req, res) => {
   try {
      const { uploadId } = req.params;

      const session = uploadSessions.get(uploadId);
      if (!session) {
         return res.status(404).json({
            success: false,
            message: 'Upload session not found'
         });
      }

      const progress = (session.uploadedChunks.size / session.totalChunks) * 100;

      res.status(200).json({
         success: true,
         uploadId,
         progress: Math.round(progress),
         uploadedChunks: session.uploadedChunks.size,
         totalChunks: session.totalChunks,
         isComplete: session.uploadedChunks.size === session.totalChunks,
         missingChunks: Array.from(
            { length: session.totalChunks },
            (_, i) => i
         ).filter(i => !session.uploadedChunks.has(i))
      });

   } catch (error) {
      console.error('Get upload progress error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to get upload progress'
      });
   }
};

/**
 * Complete upload and merge chunks
 */
export const completeChunkedUpload = async (req, res) => {
   try {
      const { uploadId } = req.params;
      const { googleDriveToken } = req.body;

      const session = uploadSessions.get(uploadId);
      if (!session) {
         return res.status(404).json({
            success: false,
            message: 'Upload session not found'
         });
      }

      // Check if all chunks are uploaded
      if (session.uploadedChunks.size !== session.totalChunks) {
         return res.status(400).json({
            success: false,
            message: 'Not all chunks uploaded',
            uploadedChunks: session.uploadedChunks.size,
            totalChunks: session.totalChunks
         });
      }

      // Merge chunks into final file
      const finalFilePath = path.join(session.tempDir, session.fileName);
      const writeStream = fs.createWriteStream(finalFilePath);

      try {
         for (let i = 0; i < session.totalChunks; i++) {
            const chunkPath = path.join(session.tempDir, `chunk_${i}`);
            const chunkData = await fs.promises.readFile(chunkPath);
            writeStream.write(chunkData);
         }
         writeStream.end();

         // Wait for write to complete
         await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
         });

         // Verify final file integrity
         const finalFileBuffer = await fs.promises.readFile(finalFilePath);
         const finalFileHash = crypto.createHash('md5').update(finalFileBuffer).digest('hex');

         if (session.fileHash && finalFileHash !== session.fileHash) {
            throw new Error('Final file integrity check failed');
         }

         // Create note in database with 'processing' status first
         // This allows immediate response to user while Google Drive upload happens in background

         // Create temporary note data with local file info for immediate response
         const tempFileData = {
            id: 'temp_' + Date.now(),
            name: session.fileName,
            mimeType: 'application/pdf',
            size: finalFileBuffer.length.toString(),
            webViewLink: `http://localhost:3000/uploads/${session.fileName}`,
            webContentLink: `http://localhost:3000/uploads/${session.fileName}`,
            thumbnailLink: null
         };

         const noteData = createNoteData(session, { success: true, file: tempFileData });
         // Set status to 'processing' initially
         noteData.status = 'processing';
         noteData.uploadSource = 'web';

         const note = new Note(noteData);
         const savedNote = await note.save();

         // Start background Google Drive upload process
         // Decode Google Drive token if provided
         let tokenData = null;
         if (googleDriveToken) {
            try {
               tokenData = JSON.parse(Buffer.from(googleDriveToken, 'base64').toString());
            } catch (error) {
               console.error('Failed to decode Google Drive token:', error);
            }
         }

         // Background processing (non-blocking)
         processGoogleDriveUpload(savedNote._id, finalFileBuffer, session, tokenData)
            .catch(error => {
               console.error('Background Google Drive upload failed:', error);
               // Set note status to approved with local storage fallback
               updateNoteToApproved(savedNote._id, tempFileData, 'local');
            });

         // Update user activity
         await User.findByIdAndUpdate(
            session.userId,
            {
               $push: { 'activity.notesUploaded': savedNote._id },
               $inc: { 'activity.totalUploads': 1 }
            },
            { new: true }
         );

         // Clean up temp files
         await cleanupTempFiles(session.tempDir);

         // Remove session
         uploadSessions.delete(uploadId);

         res.status(201).json({
            success: true,
            message: 'Note uploaded successfully! Processing for Google Drive storage...',
            note: savedNote,
            file: tempFileData,
            storageLocation: 'processing',
            status: 'processing'
         });

      } catch (mergeError) {
         throw new Error(`Failed to merge chunks: ${mergeError.message}`);
      }

   } catch (error) {
      console.error('Complete chunked upload error:', error);
      res.status(500).json({
         success: false,
         message: error.message || 'Failed to complete upload'
      });
   }
};

/**
 * Cancel upload session
 */
export const cancelChunkedUpload = async (req, res) => {
   try {
      const { uploadId } = req.params;

      const session = uploadSessions.get(uploadId);
      if (!session) {
         return res.status(404).json({
            success: false,
            message: 'Upload session not found'
         });
      }

      // Clean up temp files
      await cleanupTempFiles(session.tempDir);

      // Remove session
      uploadSessions.delete(uploadId);

      res.status(200).json({
         success: true,
         message: 'Upload session cancelled'
      });

   } catch (error) {
      console.error('Cancel upload error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to cancel upload'
      });
   }
};

/**
 * Helper function to create note data
 */
function createNoteData(session, driveResult) {
   const { metadata } = session;

   return {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,

      academic: {
         university: metadata.university || 'ALL',
         department: metadata.department || 'ALL',
         course: {
            code: metadata.course || `${metadata.subject.substring(0, 10).toUpperCase()}${metadata.semester || 'ALL'}`,
            name: metadata.course || `${metadata.subject}${metadata.semester ? ` - Semester ${metadata.semester}` : ' - All Semesters'}`,
            credits: 3
         },
         semester: metadata.semester ? parseInt(metadata.semester) : 0,
         academicYear: metadata.academicYear || '2024-25',
         degree: 'bachelor'
      },

      subject: {
         name: metadata.subject,
         category: metadata.category || 'lecture-notes',
         difficulty: metadata.difficulty,
         chapters: metadata.chapters.map(chapter => ({ name: chapter }))
      },

      file: {
         driveFileId: driveResult.file.id,
         driveFileName: driveResult.file.name,
         mimeType: driveResult.file.mimeType || 'application/pdf',
         size: parseInt(driveResult.file.size) || session.fileSize,
         downloadUrl: generateDriveUrls(driveResult.file.id).downloadUrl,
         viewUrl: generateDriveUrls(driveResult.file.id).viewUrl,
         directViewUrl: generateDriveUrls(driveResult.file.id).directViewUrl,
         thumbnailUrl: generateDriveUrls(driveResult.file.id).thumbnailUrl,
         lastModified: new Date()
      },

      uploader: session.userId,
      uploadDate: new Date(),
      uploadSource: 'web',

      content: {
         language: 'en',
         isHandwritten: false,
         hasImages: false,
         hasFormulas: false
      },

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

      visibility: metadata.visibility,
      permissions: {
         canDownload: true,
         canComment: true,
         canShare: true,
         requiresApproval: false
      },

      status: 'approved',

      moderation: {
         isReviewed: true,
         reviewedAt: new Date(),
         reportCount: 0
      }
   };
}

/**
 * Background Google Drive upload processing
 */
async function processGoogleDriveUpload(noteId, fileBuffer, session, tokenData) {
   try {
      console.log(`🔄 Starting background Google Drive upload for note: ${noteId}`);

      let driveResult;
      let storageLocation = 'local';

      if (tokenData) {
         try {
            driveResult = await uploadToUserDrive(
               fileBuffer,
               session.fileName,
               'application/pdf',
               tokenData,
               session.metadata.subject
            );
            if (driveResult.success) {
               storageLocation = 'google-drive';
               console.log(`✅ Google Drive upload completed for note: ${noteId}`);
            }
         } catch (driveError) {
            console.error('Google Drive upload failed in background:', driveError);
            driveResult = null;
         }
      }

      // Local storage fallback
      if (!driveResult || !driveResult.success) {
         console.log(`📁 Using local storage fallback for note: ${noteId}`);
         const uploadsDir = path.join(process.cwd(), 'uploads');
         await fs.promises.mkdir(uploadsDir, { recursive: true });

         const localFilePath = path.join(uploadsDir, session.fileName);
         await fs.promises.writeFile(localFilePath, fileBuffer);

         driveResult = {
            success: true,
            file: {
               id: 'local_' + Date.now(),
               name: session.fileName,
               mimeType: 'application/pdf',
               size: fileBuffer.length.toString(),
               webViewLink: `http://localhost:3000/uploads/${session.fileName}`,
               webContentLink: `http://localhost:3000/uploads/${session.fileName}`,
               thumbnailLink: null
            }
         };
         storageLocation = 'local';
      }

      // Update note with final file information and set status to 'approved'
      await updateNoteToApproved(noteId, driveResult.file, storageLocation);

   } catch (error) {
      console.error(`❌ Background processing failed for note: ${noteId}`, error);
      // Even if processing fails, we'll approve the note with local storage
      const fallbackFileData = {
         id: 'local_' + Date.now(),
         name: session.fileName,
         mimeType: 'application/pdf',
         size: session.fileSize.toString(),
         webViewLink: `http://localhost:3000/uploads/${session.fileName}`,
         webContentLink: `http://localhost:3000/uploads/${session.fileName}`,
         thumbnailLink: null
      };
      await updateNoteToApproved(noteId, fallbackFileData, 'local');
   }
}

/**
 * Update note status to approved with final file information
 */
async function updateNoteToApproved(noteId, fileData, storageLocation) {
   try {
      const updateData = {
         status: 'approved',
         'file.driveFileId': fileData.id,
         'file.driveFileName': fileData.name,
         'file.mimeType': fileData.mimeType,
         'file.size': parseInt(fileData.size),
         'file.downloadUrl': storageLocation === 'google-drive'
            ? generateDriveUrls(fileData.id).downloadUrl
            : fileData.webContentLink,
         'file.viewUrl': storageLocation === 'google-drive'
            ? generateDriveUrls(fileData.id).viewUrl
            : fileData.webViewLink,
         'file.directViewUrl': storageLocation === 'google-drive'
            ? generateDriveUrls(fileData.id).directViewUrl
            : fileData.webViewLink,
         'file.thumbnailUrl': storageLocation === 'google-drive'
            ? generateDriveUrls(fileData.id).thumbnailUrl
            : fileData.thumbnailLink,
         'file.lastModified': new Date()
      };

      await Note.findByIdAndUpdate(noteId, updateData);

      console.log(`✅ Note ${noteId} updated to approved status with ${storageLocation} storage`);
   } catch (error) {
      console.error(`❌ Failed to update note ${noteId} to approved:`, error);
   }
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions() {
   const now = new Date();
   for (const [uploadId, session] of uploadSessions.entries()) {
      if (session.expiresAt < now) {
         cleanupTempFiles(session.tempDir).catch(console.error);
         uploadSessions.delete(uploadId);
      }
   }
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles(tempDir) {
   try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
      console.log('Cleaned up temp directory:', tempDir);
   } catch (error) {
      console.error('Failed to clean up temp directory:', tempDir, error);
   }
}

