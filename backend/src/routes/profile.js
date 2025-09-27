import express from 'express';
import {
   getUserProfile,
   getUserUploadedNotes,
   getUserWishlist,
   getUserFavorites,
   getUserFollowers,
   getUserFollowing,
   updateUserProfile,
   getUserActivityStats,
   getPublicUserProfile,
   getPublicUserNotes,
   getPublicUserFollowers,
   followUser,
   unfollowUser,
   updateNoteDetails
} from '../controllers/profile.js';
import {
   createWishlist,
   getUserWishlists,
   getWishlistById,
   updateWishlist,
   deleteWishlist,
   addNotesToWishlist,
   removeNotesFromWishlist
} from '../controllers/wishlist.js';
import { requireAuth, requireUserInDB, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes for viewing user profiles and notes (optional auth to check privacy settings)
router.get('/user/:username', optionalAuth, getPublicUserProfile);
router.get('/user/:username/notes', optionalAuth, getPublicUserNotes);
router.get('/user/:username/followers', optionalAuth, getPublicUserFollowers);

// Apply authentication middleware to all other routes
router.use(requireAuth);
router.use(requireUserInDB);

// Get complete user profile information
router.get('/', getUserProfile);

// Get user's uploaded notes with pagination
router.get('/uploaded-notes', getUserUploadedNotes);

// Legacy wishlist endpoint (kept for backward compatibility)
router.get('/wishlist', getUserWishlist);

// New multiple wishlists endpoints
router.post('/wishlists', createWishlist);
router.get('/wishlists', getUserWishlists);
router.get('/wishlists/:wishlistId', getWishlistById);
router.put('/wishlists/:wishlistId', updateWishlist);
router.delete('/wishlists/:wishlistId', deleteWishlist);
router.post('/wishlists/:wishlistId/notes', addNotesToWishlist);
router.delete('/wishlists/:wishlistId/notes', removeNotesFromWishlist);

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

// Update note details (excluding file)
router.put('/note/:noteId', updateNoteDetails);

// Follow/Unfollow user routes
router.post('/follow/:username', followUser);
router.delete('/follow/:username', unfollowUser);

export default router;