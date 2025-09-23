import express from 'express';
import multer from 'multer';
import { requireAuth, requireUserInDB, optionalAuth } from '../middleware/auth.js';
import { uploadNote, getNotesFeed, getNoteById, downloadNote } from '../controllers/notes.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for Google Drive upload
const upload = multer({
   storage: storage,
   limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
      files: 1 // Only one file at a time
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

// Get notes feed - optimized for cards display (public access)
router.get('/feed', getNotesFeed);

// Get single note by ID (public access for public notes)
router.get('/:id', getNoteById);

// Download note file (public access for public notes)
router.get('/:id/download', downloadNote);

// Error handling middleware for multer
router.use((error, req, res, next) => {
   if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
         return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 50MB.'
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