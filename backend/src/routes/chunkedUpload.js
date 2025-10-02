import express from 'express';
import multer from 'multer';
import { requireAuth, requireUserInDB } from '../middleware/auth.js';
import {
   initializeChunkedUpload,
   uploadChunk,
   getUploadProgress,
   completeChunkedUpload,
   cancelChunkedUpload
} from '../controllers/chunkedUpload.js';

const router = express.Router();

// Configure multer for chunk uploads (smaller memory usage)
const chunkStorage = multer.memoryStorage();
const chunkUpload = multer({
   storage: chunkStorage,
   limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per chunk
      files: 1
   }
});

// Initialize chunked upload session
router.post('/init',
   requireAuth,
   requireUserInDB,
   initializeChunkedUpload
);

// Upload individual chunk
router.post('/chunk/:uploadId',
   requireAuth,
   requireUserInDB,
   chunkUpload.single('chunk'),
   uploadChunk
);

// Get upload progress
router.get('/progress/:uploadId',
   requireAuth,
   getUploadProgress
);

// Complete chunked upload
router.post('/complete/:uploadId',
   requireAuth,
   requireUserInDB,
   completeChunkedUpload
);

// Cancel upload session
router.delete('/cancel/:uploadId',
   requireAuth,
   cancelChunkedUpload
);

// Error handling middleware for chunk uploads
router.use((error, req, res, next) => {
   if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
         return res.status(400).json({
            success: false,
            message: 'Chunk size too large. Maximum chunk size is 5MB.'
         });
      }
   }

   next(error);
});

export default router;