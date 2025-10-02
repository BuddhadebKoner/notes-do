import { google } from 'googleapis';
import { getUserDriveService } from './googleDrive.js';

// Get user's Google Drive account information
export const getGoogleDriveAccountInfo = async (tokenData) => {
   try {
      console.log('🔍 Fetching Google Drive account information...');

      if (!tokenData) {
         return {
            success: false,
            error: 'No Google Drive token provided'
         };
      }

      const drive = getUserDriveService(tokenData);

      // Get user's account information
      const aboutResponse = await drive.about.get({
         fields: 'user(displayName,emailAddress,photoLink),storageQuota(limit,usage)'
      });

      const userInfo = aboutResponse.data.user;
      const storageQuota = aboutResponse.data.storageQuota;

      console.log('✅ Successfully retrieved Google Drive account info');

      // Calculate if user has enough space (minimum 100MB available)
      const usedSpace = storageQuota.usage ? parseInt(storageQuota.usage) : 0;
      const totalSpace = storageQuota.limit ? parseInt(storageQuota.limit) : Number.MAX_SAFE_INTEGER;
      const availableSpace = totalSpace - usedSpace;
      const minRequiredSpace = 100 * 1024 * 1024; // 100MB in bytes
      const hasEnoughSpace = availableSpace >= minRequiredSpace;

      console.log(`💾 Storage check: ${formatBytes(availableSpace)} available (${hasEnoughSpace ? 'sufficient' : 'insufficient'})`);

      return {
         success: true,
         accountInfo: {
            name: userInfo.displayName,
            email: userInfo.emailAddress,
            photoUrl: userInfo.photoLink,
            hasEnoughSpace,
            storage: {
               used: usedSpace,
               total: totalSpace,
               available: availableSpace,
               hasEnoughSpace
            }
         }
      };

   } catch (error) {
      console.error('❌ Error fetching Google Drive account info:', error);

      // Handle specific Google Drive API errors
      if (error.code === 401) {
         return {
            success: false,
            error: 'Google Drive token expired or invalid',
            needsReauth: true
         };
      }

      if (error.code === 403) {
         return {
            success: false,
            error: 'Permission denied to access Google Drive account information'
         };
      }

      return {
         success: false,
         error: error.message || 'Failed to fetch Google Drive account information'
      };
   }
};

// Helper function to format bytes
const formatBytes = (bytes) => {
   if (bytes === 0) return '0 Bytes';

   const k = 1024;
   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   const i = Math.floor(Math.log(bytes) / Math.log(k));

   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};