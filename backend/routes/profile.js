import express from 'express';
import {
   getUserProfile,
   getUserUploadedNotes,
   getUserWishlist,
   getUserFavorites,
   getUserFollowers,
   getUserFollowing,
   updateUserProfile,
   getUserActivityStats
} from '../controllers/profile.js';
import { requireAuth, requireUserInDB } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);
router.use(requireUserInDB);

// Get complete user profile information
router.get('/', getUserProfile);

// Get user's uploaded notes with pagination
router.get('/uploaded-notes', getUserUploadedNotes);

// Get user's wishlist with pagination
router.get('/wishlist', getUserWishlist);

// Get user's favorite notes with pagination
router.get('/favorites', getUserFavorites);

// Get user's followers
router.get('/followers', getUserFollowers);

// Get user's following
router.get('/following', getUserFollowing);

// Get user activity statistics
router.get('/stats', getUserActivityStats);

// Update user profile
router.put('/', updateUserProfile);

export default router;