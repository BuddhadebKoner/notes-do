import express from 'express';
import { google } from 'googleapis';

const router = express.Router();

// Get Google OAuth URL for user to authorize their Drive access
router.get('/google-drive-auth', (req, res) => {
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
});

// Handle Google OAuth callback and exchange code for tokens
router.post('/callback', async (req, res) => {
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

      // Create a token string for localStorage
      const tokenData = {
         access_token: tokens.access_token,
         refresh_token: tokens.refresh_token,
         expiry_date: tokens.expiry_date
      };

      const tokenString = Buffer.from(JSON.stringify(tokenData)).toString('base64');

      res.json({
         success: true,
         message: 'Google Drive connected successfully!',
         token: tokenString
      });

   } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to connect Google Drive',
         error: error.message
      });
   }
});

// Also keep the GET route for direct browser redirects
router.get('/callback', async (req, res) => {
   try {
      const { code, error } = req.query;

      // Use FRONTEND_URL environment variable instead of hardcoded localhost
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
      console.error('Google OAuth callback error:', error);
      res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message)}`);
   }
});

export default router;