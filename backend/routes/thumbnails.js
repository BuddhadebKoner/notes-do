import express from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Serve thumbnail images
router.get('/:thumbnailName', async (req, res) => {
   try {
      const { thumbnailName } = req.params;

      // Validate filename to prevent directory traversal
      if (!thumbnailName || thumbnailName.includes('..') || thumbnailName.includes('/') || thumbnailName.includes('\\')) {
         return res.status(400).json({
            success: false,
            message: 'Invalid thumbnail name'
         });
      }

      // Check if filename has valid extension
      if (!thumbnailName.toLowerCase().endsWith('.jpg') && !thumbnailName.toLowerCase().endsWith('.jpeg')) {
         return res.status(400).json({
            success: false,
            message: 'Invalid thumbnail format'
         });
      }

      const thumbnailsDir = path.join(process.cwd(), 'uploads', 'thumbnails');
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);

      // Check if file exists
      try {
         await fs.access(thumbnailPath);
      } catch (accessError) {
         return res.status(404).json({
            success: false,
            message: 'Thumbnail not found'
         });
      }

      // Get file stats for caching
      const stats = await fs.stat(thumbnailPath);

      // Set appropriate headers
      res.set({
         'Content-Type': 'image/jpeg',
         'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
         'Last-Modified': stats.mtime.toUTCString(),
         'ETag': `"${stats.mtime.getTime()}-${stats.size}"`
      });

      // Check if client has cached version
      const clientETag = req.headers['if-none-match'];
      if (clientETag && clientETag === `"${stats.mtime.getTime()}-${stats.size}"`) {
         return res.status(304).end();
      }

      // Stream the file
      const fileBuffer = await fs.readFile(thumbnailPath);
      res.send(fileBuffer);

   } catch (error) {
      console.error('Thumbnail serve error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to serve thumbnail'
      });
   }
});

export default router;