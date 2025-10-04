import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
   getGoogleAuthUrl,
   handleOAuthCallback,
   handleOAuthRedirect,
   getAccountInfo,
   getFolderStructure
} from '../controllers/google.js';

const router = express.Router();

// Public routes
router.get('/google-drive-auth', getGoogleAuthUrl);
router.post('/callback', handleOAuthCallback);
router.get('/callback', handleOAuthRedirect);

// Protected routes
router.post('/account-info', requireAuth, getAccountInfo);
router.post('/folder-structure', requireAuth, getFolderStructure);

export default router;