import express from 'express';
import multer from 'multer';
import { requireAuth, requireUserInDB, optionalAuth } from '../middleware/auth.js';
import { uploadNote, getNotes, getNoteById, downloadNote } from '../controllers/notes.js';

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

// Get notes with filters (optional authentication for better results)
router.get('/', optionalAuth, getNotes);

// Get single note by ID (optional authentication for view tracking)
router.get('/:id', optionalAuth, getNoteById);

// Download note file (optional authentication for download tracking)
router.get('/:id/download', optionalAuth, downloadNote);

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