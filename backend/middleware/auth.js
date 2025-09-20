import { createClerkClient } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Clerk
const clerk = createClerkClient({
   secretKey: process.env.CLERK_SECRET_KEY,
});

// Middleware to verify Clerk token
export const verifyClerkToken = async (req, res, next) => {
   try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      const clerkToken = req.headers['x-clerk-auth-token'];

      let token = null;

      // Check Authorization header first (Bearer token)
      if (authHeader && authHeader.startsWith('Bearer ')) {
         token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
      // Check custom clerk header
      else if (clerkToken) {
         token = clerkToken;
      }

      if (!token) {
         return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.',
         });
      }

      // Verify the token with Clerk
      const session = await clerk.verifyToken(token, {
         secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (!session) {
         return res.status(401).json({
            success: false,
            message: 'Invalid token.',
         });
      }

      // Get user information from Clerk
      const user = await clerk.users.getUser(session.sub);

      // Add user and session info to request object
      req.user = {
         id: user.id,
         email: user.emailAddresses[0]?.emailAddress,
         firstName: user.firstName,
         lastName: user.lastName,
         username: user.username,
         imageUrl: user.imageUrl,
      };
      req.session = session;

      next();
   } catch (error) {
      console.error('Clerk token verification error:', error);

      // Handle different types of Clerk errors
      if (error.message.includes('Invalid token')) {
         return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.',
         });
      }

      if (error.message.includes('Token expired')) {
         return res.status(401).json({
            success: false,
            message: 'Token has expired. Please log in again.',
         });
      }

      return res.status(500).json({
         success: false,
         message: 'Token verification failed.',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// Optional middleware to check if user exists (for protected routes that don't require auth)
export const optionalAuth = async (req, res, next) => {
   try {
      const authHeader = req.headers.authorization;
      const clerkToken = req.headers['x-clerk-auth-token'];

      let token = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
         token = authHeader.substring(7);
      } else if (clerkToken) {
         token = clerkToken;
      }

      if (token) {
         try {
            const session = await clerk.verifyToken(token, {
               secretKey: process.env.CLERK_SECRET_KEY,
            });

            if (session) {
               const user = await clerk.users.getUser(session.sub);
               req.user = {
                  id: user.id,
                  email: user.emailAddresses[0]?.emailAddress,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  username: user.username,
                  imageUrl: user.imageUrl,
               };
               req.session = session;
            }
         } catch (error) {
            // Token is invalid, but we continue without setting user
            console.log('Optional auth failed:', error.message);
         }
      }

      next();
   } catch (error) {
      console.error('Optional auth error:', error);
      next(); // Continue without authentication
   }
};

export { clerk };