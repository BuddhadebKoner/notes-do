import { clerkClient, getAuth } from '@clerk/express';
import { User } from '../models/index.js';

// Environment variables validation
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
   throw new Error('CLERK_SECRET_KEY environment variable is required');
}

// Middleware to verify Clerk authentication and get user data
export const requireAuth = async (req, res, next) => {
   try {
      // Use the new getAuth() function from @clerk/express
      const auth = getAuth(req);

      if (!auth.userId) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required. Please provide a valid token.'
         });
      }

      const userId = auth.userId;
      console.log('UserAuth middleware - Token verified, userId:', userId);

      // Get user details from Clerk
      const clerkUser = await clerkClient.users.getUser(userId);

      // Try to find user in our database
      const user = await User.findOne({ clerkId: userId }).populate('activity.notesUploaded', 'title createdAt');

      // Attach user info to request
      req.user = user;
      req.clerkId = userId;
      req.clerkUser = clerkUser; // Full Clerk user data
      req.auth = auth; // Add the auth object to the request

      next();
   } catch (error) {
      console.error('Authentication middleware error:', error);

      // Handle specific Clerk errors
      if (error.code === 'session_token_invalid' || error.code === 'session_token_expired') {
         return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please log in again.'
         });
      }

      return res.status(500).json({
         success: false,
         message: 'Authentication verification failed',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Optional middleware - doesn't require authentication but populates user if available
export const optionalAuth = async (req, res, next) => {
   try {
      // Use the new getAuth() function from @clerk/express
      const auth = getAuth(req);

      if (auth.userId) {
         try {
            const userId = auth.userId;
            const clerkUser = await clerkClient.users.getUser(userId);
            const user = await User.findOne({ clerkId: userId });

            req.user = user;
            req.clerkId = userId;
            req.clerkUser = clerkUser;
            req.auth = auth;
         } catch (error) {
            // Token invalid or expired, but don't block the request
            console.log('Optional auth - Invalid token, continuing without auth');
         }
      }

      next();
   } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Don't block the request, just continue without user data
      next();
   }
};

// Middleware to check if user exists in our database
export const requireUserInDB = async (req, res, next) => {
   try {
      if (!req.user) {
         return res.status(404).json({
            success: false,
            message: 'User not found in database. Please create your profile first.',
            needsProfileCreation: true
         });
      }

      // Check if user account is active
      if (!req.user.account.isActive) {
         return res.status(403).json({
            success: false,
            message: 'Your account has been deactivated. Please contact support.'
         });
      }

      next();
   } catch (error) {
      console.error('User database check error:', error);
      return res.status(500).json({
         success: false,
         message: 'User verification failed',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Middleware to check user role
export const requireRole = (roles) => {
   return (req, res, next) => {
      try {
         if (!req.user) {
            return res.status(401).json({
               success: false,
               message: 'Authentication required'
            });
         }

         if (!roles.includes(req.user.account.role)) {
            return res.status(403).json({
               success: false,
               message: `Access denied. Required role: ${roles.join(' or ')}`
            });
         }

         next();
      } catch (error) {
         console.error('Role check error:', error);
         return res.status(500).json({
            success: false,
            message: 'Role verification failed'
         });
      }
   };
};

export default {
   requireAuth,
   optionalAuth,
   requireUserInDB,
   requireRole
};