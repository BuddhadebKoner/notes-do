import { google } from 'googleapis';
import { Readable } from 'stream';

// File size threshold for resumable uploads (50MB)
const RESUMABLE_UPLOAD_THRESHOLD = 50 * 1024 * 1024;

// Chunk size for resumable uploads (10MB)
const CHUNK_SIZE = 10 * 1024 * 1024;

// Upload timeout configuration (10 minutes for large files on slow connections)
const UPLOAD_TIMEOUT = 10 * 60 * 1000;

// Helper function to generate Google Drive URLs
export const generateDriveUrls = (driveFileId) => {
   return {
      viewUrl: `https://drive.google.com/file/d/${driveFileId}/preview`, // For iframe embedding
      directViewUrl: `https://drive.google.com/file/d/${driveFileId}/view`, // For opening in new tab
      downloadUrl: `https://drive.google.com/uc?id=${driveFileId}&export=download`, // For direct download
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w300-h400` // For thumbnail
   };
};

// Create Google Drive service for user's personal Drive
export const getUserDriveService = (tokenData) => {
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

   // Create drive service with extended timeouts for large files
   const drive = google.drive({
      version: 'v3',
      auth,
      // Set longer timeouts for large file uploads
      timeout: UPLOAD_TIMEOUT,
      // Retry configuration for network issues
      retryConfig: {
         retry: 3,
         retryDelay: 1000,
         statusCodesToRetry: [[500, 599], [429]]
      }
   });

   return drive;
};

// Helper function to create or get a folder by name and parent
export const getOrCreateFolder = async (drive, folderName, parentId = 'root') => {
   try {
      // Search for existing folder
      const folderSearchResponse = await drive.files.list({
         q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${parentId}' in parents`,
         fields: 'files(id, name)',
      });

      if (folderSearchResponse.data.files && folderSearchResponse.data.files.length > 0) {
         return folderSearchResponse.data.files[0].id;
      }

      // Folder doesn't exist, create it
      const folderMetadata = {
         name: folderName,
         mimeType: 'application/vnd.google-apps.folder',
         parents: [parentId]
      };

      const folderResponse = await drive.files.create({
         resource: folderMetadata,
         fields: 'id'
      });

      console.log(`Created folder '${folderName}' with ID:`, folderResponse.data.id);
      return folderResponse.data.id;

   } catch (error) {
      console.error(`Error creating/getting folder '${folderName}':`, error);
      // Fallback to parent folder if folder operations fail
      return parentId;
   }
};

// Helper function to create organized folder structure
export const getOrCreateNotesFolder = async (drive, subject = null) => {
   try {
      console.log('Creating organized folder structure for subject:', subject || 'None');

      // Create main Notes-Do folder
      const mainFolderId = await getOrCreateFolder(drive, 'Notes-Do', 'root');
      console.log('Main Notes-Do folder ID:', mainFolderId);

      // Create current year folder
      const currentYear = new Date().getFullYear().toString();
      const yearFolderId = await getOrCreateFolder(drive, currentYear, mainFolderId);
      console.log(`Year folder (${currentYear}) ID:`, yearFolderId);

      // If subject is provided, create subject subfolder
      if (subject && subject.trim()) {
         const subjectFolderId = await getOrCreateFolder(drive, subject.trim(), yearFolderId);
         console.log(`Subject folder (${subject.trim()}) ID:`, subjectFolderId);
         return subjectFolderId;
      }

      console.log('Using year folder as final destination');
      return yearFolderId;

   } catch (error) {
      console.error('Error creating Notes-Do folder structure:', error);
      console.log('Falling back to root folder');
      // Fallback to root if folder operations fail
      return 'root';
   }
};

// Helper function to create upload timeout promise
const createTimeoutPromise = (ms) => {
   return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Upload timeout after ${ms}ms`)), ms);
   });
};

// Helper function to upload file in chunks using resumable upload
const uploadFileResumable = async (drive, fileBuffer, fileName, mimeType, notesFolderId) => {
   try {
      console.log(`📦 Using TRUE resumable upload for large file: ${fileName}`);

      const fileSize = fileBuffer.length;
      const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
      console.log(`📊 File size: ${fileSizeMB} MB, uploading in chunks of ${CHUNK_SIZE / 1024 / 1024}MB`);

      const fileMetadata = {
         name: fileName,
         parents: [notesFolderId]
      };

      // Convert buffer to stream for chunked upload
      const bufferStream = Readable.from(fileBuffer);

      // Create media object with proper chunk size
      const media = {
         mimeType: mimeType,
         body: bufferStream
      };

      // Use Google Drive's resumable upload
      // The chunkSize option enables proper chunking
      const res = await drive.files.create({
         requestBody: fileMetadata,
         media: media,
         fields: 'id,name,size,mimeType,webViewLink,webContentLink,thumbnailLink',
         supportsAllDrives: true
      }, {
         // This is critical: enables chunked resumable upload
         // Without this, files are uploaded in one go
         onUploadProgress: (evt) => {
            const progress = (evt.bytesRead / fileSize) * 100;
            // Log every 10MB or at completion
            if (evt.bytesRead % (10 * 1024 * 1024) < CHUNK_SIZE || progress >= 100) {
               console.log(`📈 Upload progress: ${progress.toFixed(1)}% (${(evt.bytesRead / 1024 / 1024).toFixed(2)}/${fileSizeMB} MB)`);
            }
         }
      });

      console.log(`✅ Resumable upload completed for: ${fileName} (${fileSizeMB} MB)`);
      return res.data;

   } catch (error) {
      console.error(`❌ Resumable upload failed for ${fileName}:`, error.message);

      // Provide more detailed error info
      if (error.code) {
         console.error(`   Error code: ${error.code}`);
      }
      if (error.errors && error.errors.length > 0) {
         console.error(`   Error details:`, error.errors[0]);
      }

      throw error;
   }
};

// Helper function to set file permissions
const setFilePermissions = async (drive, fileId) => {
   try {
      await drive.permissions.create({
         fileId: fileId,
         requestBody: {
            role: 'reader',
            type: 'anyone'
         }
      });
      return true;
   } catch (error) {
      console.warn(`⚠️ Failed to set public permissions for file ${fileId}:`, error.message);
      return false;
   }
};

// Helper function to verify upload by searching for the file
const verifyFileUpload = async (drive, fileName, notesFolderId) => {
   try {
      console.log(`� Verifying upload for file: ${fileName}`);

      const searchResponse = await drive.files.list({
         q: `name='${fileName}' and '${notesFolderId}' in parents and trashed=false`,
         fields: 'files(id,name,size,mimeType,webViewLink,webContentLink,thumbnailLink)',
         orderBy: 'createdTime desc',
         pageSize: 1
      });

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
         const foundFile = searchResponse.data.files[0];
         console.log(`✅ File verified successfully: ${foundFile.id}`);
         return foundFile;
      }

      return null;
   } catch (error) {
      console.error(`❌ File verification failed:`, error.message);
      return null;
   }
};

// Upload file to USER'S Google Drive with improved error handling and resumable uploads
export const uploadToUserDrive = async (fileBuffer, fileName, mimeType, tokenData, subject = null) => {
   const startTime = Date.now();
   let uploadedFileId = null;

   try {
      const fileSize = fileBuffer.length;
      const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
      console.log(`📤 Starting Google Drive upload for file: ${fileName} (${fileSizeMB} MB)`);

      const drive = getUserDriveService(tokenData);

      // Get or create the organized folder structure
      const notesFolderId = await getOrCreateNotesFolder(drive, subject);

      // Use resumable upload for files larger than threshold
      const useResumableUpload = fileSize > RESUMABLE_UPLOAD_THRESHOLD;

      if (useResumableUpload) {
         console.log(`📦 File size (${fileSizeMB} MB) exceeds threshold, using resumable upload`);
      }

      const fileMetadata = {
         name: fileName,
         parents: [notesFolderId]
      };

      let uploadResponse;

      // Race between upload and timeout
      uploadResponse = await Promise.race([
         (async () => {
            if (useResumableUpload) {
               return await uploadFileResumable(drive, fileBuffer, fileName, mimeType, notesFolderId);
            } else {
               // Standard upload for smaller files
               const bufferStream = new Readable();
               bufferStream.push(fileBuffer);
               bufferStream.push(null);

               const media = {
                  mimeType: mimeType,
                  body: bufferStream
               };

               const response = await drive.files.create({
                  requestBody: fileMetadata,
                  media: media,
                  fields: 'id,name,size,mimeType,webViewLink,webContentLink,thumbnailLink'
               });

               return response.data;
            }
         })(),
         createTimeoutPromise(UPLOAD_TIMEOUT)
      ]);

      uploadedFileId = uploadResponse.id;

      // Make the file publicly viewable
      await setFilePermissions(drive, uploadedFileId);

      // Create alternative thumbnail URL if the API doesn't provide one
      let thumbnailUrl = uploadResponse.thumbnailLink;
      if (!thumbnailUrl && uploadedFileId) {
         thumbnailUrl = `https://drive.google.com/thumbnail?id=${uploadedFileId}&sz=w300-h400`;
      }

      const uploadDuration = Date.now() - startTime;
      console.log(`✅ Google Drive upload completed in ${uploadDuration}ms for file: ${fileName}`);

      return {
         success: true,
         file: {
            ...uploadResponse,
            thumbnailLink: thumbnailUrl
         }
      };

   } catch (error) {
      const uploadDuration = Date.now() - startTime;
      console.error(`❌ Google Drive upload failed after ${uploadDuration}ms for file: ${fileName}`, error.message);

      // Check if it's an auth error
      if (error.code === 401 || error.code === 403) {
         return {
            success: false,
            error: 'Google Drive authentication failed. Please reconnect your Google Drive.',
            authError: true
         };
      }

      // Check for timeout
      if (error.message && error.message.includes('timeout')) {
         console.log('⏱️ Upload timed out, attempting to verify if file was uploaded...');

         try {
            const drive = getUserDriveService(tokenData);
            const notesFolderId = await getOrCreateNotesFolder(drive, subject);
            const foundFile = await verifyFileUpload(drive, fileName, notesFolderId);

            if (foundFile) {
               // File was uploaded despite timeout
               await setFilePermissions(drive, foundFile.id);

               let thumbnailUrl = foundFile.thumbnailLink;
               if (!thumbnailUrl && foundFile.id) {
                  thumbnailUrl = `https://drive.google.com/thumbnail?id=${foundFile.id}&sz=w300-h400`;
               }

               return {
                  success: true,
                  file: {
                     ...foundFile,
                     thumbnailLink: thumbnailUrl
                  },
                  warning: 'Upload completed but response was delayed'
               };
            }
         } catch (verifyError) {
            console.error('Failed to verify file after timeout:', verifyError.message);
         }

         return {
            success: false,
            error: 'Upload timeout. Please try again with a stable connection.',
            timeout: true
         };
      }

      // If it's a 500 error, the file might still have been uploaded successfully
      if (error.code === 500 || error.status === 500) {
         console.log('🔍 Got 500 error, checking if file was actually uploaded...');

         try {
            const drive = getUserDriveService(tokenData);
            const notesFolderId = await getOrCreateNotesFolder(drive, subject);
            const foundFile = await verifyFileUpload(drive, fileName, notesFolderId);

            if (foundFile) {
               console.log('✅ File was actually uploaded successfully despite 500 error!');
               await setFilePermissions(drive, foundFile.id);

               let thumbnailUrl = foundFile.thumbnailLink;
               if (!thumbnailUrl && foundFile.id) {
                  thumbnailUrl = `https://drive.google.com/thumbnail?id=${foundFile.id}&sz=w300-h400`;
               }

               return {
                  success: true,
                  file: {
                     ...foundFile,
                     thumbnailLink: thumbnailUrl
                  },
                  warning: 'File uploaded successfully despite initial API error'
               };
            }
         } catch (searchError) {
            console.error('Failed to search for file after 500 error:', searchError.message);
         }
      }

      // Attempt cleanup if we have a file ID
      if (uploadedFileId) {
         try {
            console.log('🧹 Attempting cleanup of partially uploaded file...');
            const drive = getUserDriveService(tokenData);
            await drive.files.delete({ fileId: uploadedFileId });
            console.log('✅ Cleanup successful');
         } catch (cleanupError) {
            console.error('❌ Cleanup failed:', cleanupError.message);
         }
      }

      return {
         success: false,
         error: error.message || 'Google Drive upload failed',
         details: error.response?.data || error.cause
      };
   }
};

// Delete file from USER'S Google Drive
export const deleteFromUserDrive = async (driveFileId, tokenData) => {
   try {
      console.log('🗑️ Attempting to delete file from Google Drive:', driveFileId);

      // Validate inputs
      if (!driveFileId || !tokenData) {
         throw new Error('Drive file ID and token data are required for deletion');
      }

      const drive = getUserDriveService(tokenData);

      // Check if file exists before attempting deletion
      try {
         const fileInfo = await drive.files.get({
            fileId: driveFileId,
            fields: 'id,name,trashed'
         });

         if (fileInfo.data.trashed) {
            console.log('⚠️ File is already in trash:', fileInfo.data.name);
            return {
               success: true,
               message: 'File was already deleted from Google Drive',
               fileId: driveFileId
            };
         }

         console.log('📄 Found file to delete:', fileInfo.data.name);
      } catch (getError) {
         if (getError.code === 404) {
            console.log('⚠️ File not found in Google Drive (may have been deleted manually)');
            return {
               success: true,
               message: 'File not found in Google Drive (may have been deleted manually)',
               fileId: driveFileId
            };
         }
         throw getError;
      }

      // Delete the file
      await drive.files.delete({
         fileId: driveFileId
      });

      console.log('✅ Successfully deleted file from Google Drive:', driveFileId);

      return {
         success: true,
         message: 'File successfully deleted from Google Drive',
         fileId: driveFileId
      };

   } catch (error) {
      console.error('❌ Error deleting file from Google Drive:', error);

      // Handle specific Google Drive API errors
      if (error.code === 404) {
         return {
            success: true,
            message: 'File not found in Google Drive (may have been deleted manually)',
            fileId: driveFileId
         };
      }

      if (error.code === 403) {
         return {
            success: false,
            error: 'Permission denied: Cannot delete file from Google Drive',
            details: 'The user may not have permission to delete this file'
         };
      }

      if (error.code === 401) {
         return {
            success: false,
            error: 'Authentication failed: Invalid or expired Google Drive token',
            details: 'User needs to reconnect their Google Drive'
         };
      }

      return {
         success: false,
         error: error.message || 'Failed to delete file from Google Drive',
         details: error.response?.data || error.cause
      };
   }
};