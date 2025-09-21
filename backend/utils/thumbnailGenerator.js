import pdf from 'pdf-poppler';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generate thumbnail from PDF first page
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} fileName - Original filename
 * @returns {Promise<{success: boolean, thumbnailPath?: string, error?: string}>}
 */
export const generatePDFThumbnail = async (pdfBuffer, fileName) => {
   try {
      // Create temp directory for processing
      const tempDir = path.join(process.cwd(), 'temp', 'pdf-processing');
      await fs.mkdir(tempDir, { recursive: true });

      // Create thumbnails directory
      const thumbnailsDir = path.join(process.cwd(), 'uploads', 'thumbnails');
      await fs.mkdir(thumbnailsDir, { recursive: true });

      // Generate unique identifiers
      const timestamp = Date.now();
      const sanitizedName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const tempPdfPath = path.join(tempDir, `${sanitizedName}_${timestamp}.pdf`);
      const thumbnailName = `thumbnail_${sanitizedName}_${timestamp}.jpg`;
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);

      try {
         // Save PDF to temp file (required by pdf-poppler)
         await fs.writeFile(tempPdfPath, pdfBuffer);

         // Configure pdf-poppler options
         const options = {
            format: 'jpeg',
            out_dir: tempDir,
            out_prefix: `page_${timestamp}`,
            page: 1, // Only convert first page
            single_file: true
         };

         // Convert PDF first page to image
         const convertResult = await pdf.convert(tempPdfPath, options);

         if (!convertResult || convertResult.length === 0) {
            throw new Error('PDF conversion failed - no pages generated');
         }

         // Find the generated image file
         let tempImagePath = path.join(tempDir, `page_${timestamp}.1.jpg`);

         // Check if the image was created
         try {
            await fs.access(tempImagePath);
         } catch (accessError) {
            // Try alternative naming convention
            const altImagePath = path.join(tempDir, `page_${timestamp}-1.jpg`);
            try {
               await fs.access(altImagePath);
               // Use alternative path
               tempImagePath = altImagePath;
            } catch (altAccessError) {
               throw new Error('Generated thumbnail image not found');
            }
         }

         // Optimize and resize image using sharp
         await sharp(tempImagePath)
            .resize(300, 400, {
               fit: 'cover',
               position: 'top'
            })
            .jpeg({
               quality: 85,
               progressive: true
            })
            .toFile(thumbnailPath);

         // Clean up temp files
         try {
            await fs.unlink(tempPdfPath);
            await fs.unlink(tempImagePath);
         } catch (cleanupError) {
            console.warn('Cleanup warning:', cleanupError.message);
         }

         // Generate thumbnail URL
         const thumbnailUrl = `/api/thumbnails/${thumbnailName}`;

         return {
            success: true,
            thumbnailPath,
            thumbnailName,
            thumbnailUrl
         };

      } catch (processingError) {
         // Clean up temp files on error
         try {
            await fs.unlink(tempPdfPath);
         } catch (cleanupError) {
            // Ignore cleanup errors
         }

         throw processingError;
      }

   } catch (error) {
      console.error('Thumbnail generation error:', error);
      return {
         success: false,
         error: error.message || 'Failed to generate thumbnail'
      };
   }
};

/**
 * Generate fallback thumbnail URL from Google Drive
 * @param {string} driveFileId - Google Drive file ID
 * @returns {string} Thumbnail URL
 */
export const generateDriveThumbnailUrl = (driveFileId) => {
   if (!driveFileId || driveFileId.startsWith('local_')) {
      return null;
   }
   return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w300-h400`;
};

/**
 * Clean up old thumbnail files (utility function)
 * @param {number} maxAgeHours - Maximum age in hours before cleanup
 * @returns {Promise<number>} Number of files cleaned up
 */
export const cleanupOldThumbnails = async (maxAgeHours = 24) => {
   try {
      const thumbnailsDir = path.join(process.cwd(), 'uploads', 'thumbnails');

      try {
         await fs.access(thumbnailsDir);
      } catch {
         return 0; // Directory doesn't exist, nothing to clean
      }

      const files = await fs.readdir(thumbnailsDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      let cleanedCount = 0;

      for (const file of files) {
         const filePath = path.join(thumbnailsDir, file);
         const stats = await fs.stat(filePath);

         if (stats.mtime.getTime() < cutoffTime) {
            await fs.unlink(filePath);
            cleanedCount++;
         }
      }

      return cleanedCount;
   } catch (error) {
      console.error('Thumbnail cleanup error:', error);
      return 0;
   }
};