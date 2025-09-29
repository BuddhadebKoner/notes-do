import express from 'express';
import {
   createShareLink,
   getShareLinkInfo,
   disableShareLink,
   accessSharedNote,
   getShareAnalytics
} from '../controllers/share.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (require authentication)
router.post('/notes/:noteId/share', requireAuth, createShareLink);
router.get('/notes/:noteId/share-info', requireAuth, getShareLinkInfo);
router.delete('/notes/:noteId/share', requireAuth, disableShareLink);
router.get('/notes/:noteId/analytics', requireAuth, getShareAnalytics);

// Public route for accessing shared notes (optional auth for better tracking)
router.get('/notes/:noteId/access', requireAuth, accessSharedNote);

export default router;