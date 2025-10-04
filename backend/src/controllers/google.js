import { google } from 'googleapis';
import { getGoogleDriveAccountInfo } from '../utils/googleDriveAccount.js';

/**
 * Get Google OAuth authorization URL
 * Public endpoint - no authentication required
 */
export const getGoogleAuthUrl = async (req, res) => {
   try {
      const auth = new google.auth.OAuth2(
         process.env.GOOGLE_CLIENT_ID,
         process.env.GOOGLE_CLIENT_SECRET,
         process.env.GOOGLE_REDIRECT_URI
      );

      const scopes = ['https://www.googleapis.com/auth/drive.file'];

      const authUrl = auth.generateAuthUrl({
         access_type: 'offline',
         scope: scopes,
         prompt: 'consent'
      });

      res.json({
         success: true,
         authUrl: authUrl,
         message: 'Visit this URL to connect your Google Drive'
      });

   } catch (error) {
      console.error('Get auth URL error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to generate authorization URL',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

/**
 * Handle OAuth callback and exchange code for tokens
 * Public endpoint - no authentication required
 */
export const handleOAuthCallback = async (req, res) => {
   try {
      const { code } = req.body;

      if (!code) {
         return res.status(400).json({
            success: false,
            message: 'No authorization code received'
         });
      }

      const auth = new google.auth.OAuth2(
         process.env.GOOGLE_CLIENT_ID,
         process.env.GOOGLE_CLIENT_SECRET,
         process.env.GOOGLE_REDIRECT_URI
      );

      const { tokens } = await auth.getToken(code);

      // Create token data for client storage
      const tokenData = {
         access_token: tokens.access_token,
         refresh_token: tokens.refresh_token,
         expiry_date: tokens.expiry_date
      };

      // Encode token as base64 for secure client-side storage
      const tokenString = Buffer.from(JSON.stringify(tokenData)).toString('base64');

      res.json({
         success: true,
         message: 'Google Drive connected successfully',
         token: tokenString
      });

   } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to connect Google Drive',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

/**
 * Handle OAuth callback redirect (for direct browser access)
 * Public endpoint - no authentication required
 */
export const handleOAuthRedirect = async (req, res) => {
   try {
      const { code, error } = req.query;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      if (error) {
         return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error)}`);
      }

      if (!code) {
         return res.redirect(`${frontendUrl}/auth/google/callback?error=No authorization code received`);
      }

      // Redirect to frontend callback with the code
      res.redirect(`${frontendUrl}/auth/google/callback?code=${encodeURIComponent(code)}`);

   } catch (error) {
      console.error('OAuth redirect error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message)}`);
   }
};

/**
 * Get Google Drive account information
 * Protected route - requires authentication
 */
export const getAccountInfo = async (req, res) => {
   try {
      const { googleDriveToken } = req.body;

      if (!googleDriveToken) {
         return res.status(400).json({
            success: false,
            message: 'Google Drive token is required'
         });
      }

      // Decode token from base64
      let tokenData;
      try {
         tokenData = JSON.parse(Buffer.from(googleDriveToken, 'base64').toString('utf-8'));
      } catch (decodeError) {
         return res.status(400).json({
            success: false,
            message: 'Invalid Google Drive token format'
         });
      }

      const accountInfo = await getGoogleDriveAccountInfo(tokenData);

      if (!accountInfo.success) {
         return res.status(400).json({
            success: false,
            message: accountInfo.error,
            needsReauth: accountInfo.needsReauth || false
         });
      }

      res.json({
         success: true,
         accountInfo: accountInfo.accountInfo,
         message: 'Google Drive account information retrieved successfully'
      });

   } catch (error) {
      console.error('Get account info error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to retrieve Google Drive account information',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

/**
 * Get Notes-Do folder structure from Google Drive
 * Protected route - requires authentication
 */
export const getFolderStructure = async (req, res) => {
   try {
      const { googleDriveToken } = req.body;

      if (!googleDriveToken) {
         return res.status(400).json({
            success: false,
            message: 'Google Drive token is required'
         });
      }

      // Decode token from base64
      let tokenData;
      try {
         tokenData = JSON.parse(Buffer.from(googleDriveToken, 'base64').toString('utf-8'));
      } catch (decodeError) {
         return res.status(400).json({
            success: false,
            message: 'Invalid Google Drive token format'
         });
      }

      // Create OAuth2 client
      const auth = new google.auth.OAuth2(
         process.env.GOOGLE_CLIENT_ID,
         process.env.GOOGLE_CLIENT_SECRET,
         process.env.GOOGLE_REDIRECT_URI
      );

      auth.setCredentials({
         access_token: tokenData.access_token,
         refresh_token: tokenData.refresh_token,
         expiry_date: tokenData.expiry_date
      });

      const drive = google.drive({ version: 'v3', auth });

      // Find Notes-Do folder
      const notesFolderResponse = await drive.files.list({
         q: "name='Notes-Do' and mimeType='application/vnd.google-apps.folder' and trashed=false",
         fields: 'files(id, name)',
         spaces: 'drive'
      });

      if (!notesFolderResponse.data.files || notesFolderResponse.data.files.length === 0) {
         return res.json({
            success: true,
            folderStructure: [],
            totalFiles: 0,
            totalSize: 0,
            message: 'Notes-Do folder not found'
         });
      }

      const notesFolderId = notesFolderResponse.data.files[0].id;

      // Get year folders
      const yearFoldersResponse = await drive.files.list({
         q: `'${notesFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
         fields: 'files(id, name)',
         orderBy: 'name desc'
      });

      const folderStructure = [];
      let totalFiles = 0;
      let totalSize = 0;

      // For each year folder, get subject folders and files
      for (const yearFolder of yearFoldersResponse.data.files || []) {
         const yearData = {
            name: yearFolder.name,
            id: yearFolder.id,
            subjects: []
         };

         // Get subject folders
         const subjectFoldersResponse = await drive.files.list({
            q: `'${yearFolder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            orderBy: 'name'
         });

         for (const subjectFolder of subjectFoldersResponse.data.files || []) {
            // Get files in subject folder
            const filesResponse = await drive.files.list({
               q: `'${subjectFolder.id}' in parents and trashed=false`,
               fields: 'files(id, name, size, mimeType, createdTime, webViewLink)',
               orderBy: 'name'
            });

            const files = filesResponse.data.files || [];
            const subjectSize = files.reduce((sum, file) => sum + (parseInt(file.size) || 0), 0);

            totalFiles += files.length;
            totalSize += subjectSize;

            yearData.subjects.push({
               name: subjectFolder.name,
               id: subjectFolder.id,
               fileCount: files.length,
               size: subjectSize,
               files: files.map(file => ({
                  id: file.id,
                  name: file.name,
                  size: parseInt(file.size) || 0,
                  mimeType: file.mimeType,
                  createdTime: file.createdTime,
                  webViewLink: file.webViewLink
               }))
            });
         }

         folderStructure.push(yearData);
      }

      res.json({
         success: true,
         folderStructure,
         totalFiles,
         totalSize,
         message: 'Folder structure retrieved successfully'
      });

   } catch (error) {
      console.error('Get folder structure error:', error);

      // Handle authentication errors
      if (error.code === 401) {
         return res.status(401).json({
            success: false,
            message: 'Google Drive authentication expired',
            needsReauth: true
         });
      }

      res.status(500).json({
         success: false,
         message: 'Failed to retrieve folder structure',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};
