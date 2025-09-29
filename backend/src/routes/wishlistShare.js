import express from 'express';
import {
   createWishlistShareLink,
   getWishlistShareLinkInfo,
   disableWishlistShareLink,
   accessSharedWishlist,
   getWishlistShareAnalytics
} from '../controllers/wishlistShare.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (require authentication)
router.post('/wishlists/:wishlistId/share', requireAuth, createWishlistShareLink);
router.get('/wishlists/:wishlistId/share-info', requireAuth, getWishlistShareLinkInfo);
router.delete('/wishlists/:wishlistId/share', requireAuth, disableWishlistShareLink);
router.get('/wishlists/:wishlistId/analytics', requireAuth, getWishlistShareAnalytics);

// Public route for accessing shared wishlists (optional auth for better tracking)
router.get('/wishlists/:wishlistId/access', optionalAuth, accessSharedWishlist);

export default router;