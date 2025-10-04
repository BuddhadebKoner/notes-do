import express from 'express';
import multer from 'multer';
import { requireAuth, requireUserInDB, optionalAuth } from '../middleware/auth.js';
import { uploadNote, getNotesFeed, getNoteById, downloadNote, likeNote, unlikeNote, checkNoteStatus, deleteNote, getUploadQueueStatus } from '../controllers/notes.js';

const router = express.Router();

// Configure multer for file uploads with optimized settings
const storage = multer.memoryStorage(); // Store files in memory for Google Drive upload
const upload = multer({
   storage: storage,
   limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
      files: 1, // Only one file at a time
      fieldSize: 100 * 1024 * 1024, // 100MB field size limit
      parts: 1000 // Max number of non-file fields
   },
   fileFilter: (req, file, cb) => {
      // Only allow PDF files
      if (file.mimetype === 'application/pdf') {
         cb(null, true);
      } else {
         cb(new Error('Only PDF files are allowed'), false);
      }
   }
});

// Routes
// Upload note (requires authentication and user profile)
router.post('/upload',
   requireAuth,
   requireUserInDB,
   upload.single('noteFile'),
   uploadNote
);

// Get notes feed - optimized for cards display (public access, optional auth for like status)
router.get('/feed', optionalAuth, getNotesFeed);

// Get single note by ID (public access for public notes, optional auth for like status and permissions)
router.get('/:id', optionalAuth, getNoteById);

// Download note file (public access for public notes)
router.get('/:id/download', downloadNote);

// Like/Unlike note (requires authentication)
router.post('/:id/like', requireAuth, requireUserInDB, likeNote);
router.delete('/:id/like', requireAuth, requireUserInDB, unlikeNote);

// Get upload queue statistics (authenticated users only)
router.get('/queue/status', requireAuth, getUploadQueueStatus);

// Check note processing status (owner only)
router.get('/:id/status', requireAuth, requireUserInDB, checkNoteStatus);

// Delete note (owner only)
router.delete('/:id', requireAuth, requireUserInDB, deleteNote);

// Error handling middleware for multer
router.use((error, req, res, next) => {
   if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
         return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 100MB.'
         });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
         return res.status(400).json({
            success: false,
            message: 'Unexpected file field. Use "noteFile" as the field name.'
         });
      }
   }

   if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({
         success: false,
         message: 'Only PDF files are allowed for upload.'
      });
   }

   // Pass other errors to global error handler
   next(error);
});

export default router;