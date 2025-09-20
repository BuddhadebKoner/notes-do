import express from 'express';
import { verifyClerkToken, optionalAuth, clerk } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/auth/status
// @desc    Check if user is authenticated
// @access  Public (with optional auth)
router.get('/status', optionalAuth, (req, res) => {
   try {
      if (req.user) {
         return res.status(200).json({
            success: true,
            isAuthenticated: true,
            user: req.user,
            message: 'User is authenticated',
         });
      }

      return res.status(200).json({
         success: true,
         isAuthenticated: false,
         user: null,
         message: 'User is not authenticated',
      });
   } catch (error) {
      console.error('Auth status error:', error);
      return res.status(500).json({
         success: false,
         message: 'Error checking authentication status',
      });
   }
});

// @route   GET /api/auth/me
// @desc    Get current user information
// @access  Protected
router.get('/me', verifyClerkToken, (req, res) => {
   try {
      return res.status(200).json({
         success: true,
         user: req.user,
         message: 'User information retrieved successfully',
      });
   } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({
         success: false,
         message: 'Error retrieving user information',
      });
   }
});

// @route   POST /api/auth/verify
// @desc    Verify token and return user info
// @access  Protected
router.post('/verify', verifyClerkToken, (req, res) => {
   try {
      return res.status(200).json({
         success: true,
         valid: true,
         user: req.user,
         session: {
            id: req.session.sid,
            createdAt: req.session.iat,
            expiresAt: req.session.exp,
         },
         message: 'Token is valid',
      });
   } catch (error) {
      console.error('Token verification error:', error);
      return res.status(500).json({
         success: false,
         message: 'Error verifying token',
      });
   }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate session)
// @access  Protected
router.post('/logout', verifyClerkToken, async (req, res) => {
   try {
      // Note: Clerk handles session invalidation on the client side
      // This endpoint is mainly for server-side cleanup if needed

      return res.status(200).json({
         success: true,
         message: 'Logout successful',
      });
   } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
         success: false,
         message: 'Error during logout',
      });
   }
});

// @route   GET /api/auth/users/:userId
// @desc    Get user by ID (admin functionality)
// @access  Protected
router.get('/users/:userId', verifyClerkToken, async (req, res) => {
   try {
      const { userId } = req.params;

      // You might want to add admin role checking here
      const user = await clerk.users.getUser(userId);

      return res.status(200).json({
         success: true,
         user: {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            imageUrl: user.imageUrl,
            createdAt: user.createdAt,
            lastActiveAt: user.lastActiveAt,
         },
         message: 'User retrieved successfully',
      });
   } catch (error) {
      console.error('Get user by ID error:', error);

      if (error.status === 404) {
         return res.status(404).json({
            success: false,
            message: 'User not found',
         });
      }

      return res.status(500).json({
         success: false,
         message: 'Error retrieving user',
      });
   }
});

export default router;