import { User } from '../models/index.js';

// Check if user is logged in with Clerk
export const checkLogin = async (req, res) => {
   try {
      // User is authenticated via Clerk middleware
      const response = {
         success: true,
         isLoggedIn: true,
         clerkId: req.clerkId,
         hasProfile: !!req.user, // Check if user exists in our database
      };

      // If user exists in database, include basic info
      if (req.user) {
         response.user = {
            id: req.user._id,
            email: req.user.email,
            username: req.user.username,
            firstName: req.user.profile.firstName,
            lastName: req.user.profile.lastName,
            avatar: req.user.profile.avatar,
            university: req.user.academic.university,
            department: req.user.academic.department,
            isActive: req.user.account.isActive,
         };
      }

      res.status(200).json(response);
   } catch (error) {
      console.error('Login check error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to check login status',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Create user profile in our database
export const createUser = async (req, res) => {
   try {
      // Check if user already exists in our database
      if (req.user) {
         return res.status(409).json({
            success: false,
            message: 'User profile already exists',
            user: {
               id: req.user._id,
               email: req.user.email,
               username: req.user.username,
               firstName: req.user.profile.firstName,
               lastName: req.user.profile.lastName
            }
         });
      }

      // Get user data from Clerk using the clerkUser from middleware
      const clerkUser = req.clerkUser;

      if (!clerkUser) {
         return res.status(404).json({
            success: false,
            message: 'Clerk user not found'
         });
      }

      // Extract data from request body (optional fields for profile customization)
      const {
         university = '',
         department = '',
         currentSemester,
         bio = '',
         phone = ''
      } = req.body;

      // Generate username from Clerk data
      let username = clerkUser.username ||
         clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] ||
         `user_${Date.now()}`;

      // Ensure username is unique
      let uniqueUsername = username;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
         uniqueUsername = `${username}_${counter}`;
         counter++;
      }

      // Create new user in our database
      const newUser = new User({
         clerkId: req.clerkId,
         email: clerkUser.emailAddresses[0]?.emailAddress || '',
         username: uniqueUsername,

         profile: {
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || '',
            avatar: clerkUser.imageUrl || null,
            bio: bio
         },

         academic: {
            university: university,
            department: department,
            currentSemester: currentSemester || null,
            degree: 'bachelor'
         },

         contact: {
            phone: phone
         },

         account: {
            isVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified' || false,
            createdViaClerk: true,
            clerkMetadata: {
               createdAt: clerkUser.createdAt,
               lastSignInAt: clerkUser.lastSignInAt
            }
         }
      });

      // Save user to database
      await newUser.save();

      // Update last login
      await newUser.updateLastLogin();

      // Return success response with user data
      res.status(201).json({
         success: true,
         message: 'User profile created successfully',
         user: {
            id: newUser._id,
            clerkId: newUser.clerkId,
            email: newUser.email,
            username: newUser.username,
            firstName: newUser.profile.firstName,
            lastName: newUser.profile.lastName,
            avatar: newUser.profile.avatar,
            university: newUser.academic.university,
            department: newUser.academic.department,
            isVerified: newUser.account.isVerified,
            createdAt: newUser.createdAt
         }
      });

   } catch (error) {
      console.error('Create user error:', error);

      // Handle duplicate key errors
      if (error.code === 11000) {
         const field = Object.keys(error.keyPattern)[0];
         return res.status(409).json({
            success: false,
            message: `${field} already exists. Please choose a different ${field}.`,
            field: field
         });
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
         const validationErrors = Object.values(error.errors).map(err => err.message);
         return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors
         });
      }

      res.status(500).json({
         success: false,
         message: 'Failed to create user profile',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};