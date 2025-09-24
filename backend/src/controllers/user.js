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

      // If user exists in database, include basic info in consistent structure
      if (req.user) {
         response.user = {
            id: req.user._id,
            email: req.user.email,
            username: req.user.username,

            profile: {
               firstName: req.user.profile.firstName,
               lastName: req.user.profile.lastName,
               fullName: `${req.user.profile.firstName} ${req.user.profile.lastName}`,
               avatar: req.user.profile.avatar,
               bio: req.user.profile.bio
            },

            academic: {
               university: req.user.academic.university,
               department: req.user.academic.department
            },

            contact: {
               phone: req.user.contact?.phone,
               address: req.user.contact?.address,
               socialLinks: req.user.contact?.socialLinks
            },

            account: {
               role: req.user.account.role,
               isActive: req.user.account.isActive,
               isVerified: req.user.account.isVerified
            }
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

      // Extract data from request body (only role is required initially)
      const {
         role,
         bio = '',
         phone = ''
      } = req.body;

      // Validate required role
      if (!role || !['student', 'teacher'].includes(role)) {
         return res.status(400).json({
            success: false,
            message: 'Role is required and must be either "student" or "teacher"'
         });
      }

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

      // Create new user with basic info only - academic details can be added later
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
            degree: role === 'teacher' ? 'master' : 'bachelor'
         },

         contact: {
            phone: phone
         },

         account: {
            role: role,
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

      // Return success response with user data - match profile structure
      res.status(201).json({
         success: true,
         message: 'User profile created successfully',
         user: {
            id: newUser._id,
            clerkId: newUser.clerkId,
            email: newUser.email,
            username: newUser.username,

            // Profile Info - match the structure from profile endpoint
            profile: {
               firstName: newUser.profile.firstName,
               lastName: newUser.profile.lastName,
               fullName: `${newUser.profile.firstName} ${newUser.profile.lastName}`,
               avatar: newUser.profile.avatar,
               bio: newUser.profile.bio,
               dateOfBirth: newUser.profile.dateOfBirth,
               gender: newUser.profile.gender
            },

            // Academic Info
            academic: {
               university: newUser.academic.university,
               department: newUser.academic.department,
               degree: newUser.academic.degree,
               currentSemester: newUser.academic.currentSemester,
               studentId: newUser.academic.studentId,
               graduationYear: newUser.academic.graduationYear,
               teacherInfo: newUser.academic.teacherInfo
            },

            // Contact Info
            contact: {
               phone: newUser.contact?.phone,
               address: newUser.contact?.address,
               socialLinks: newUser.contact?.socialLinks
            },

            // Account Info
            account: {
               role: newUser.account.role,
               isVerified: newUser.account.isVerified,
               isActive: newUser.account.isActive
            },

            // Activity stats - initialize with zeros
            activity: {
               totalUploads: 0,
               totalFollowers: 0,
               totalFollowing: 0,
               totalLikesReceived: 0,
               totalDownloads: 0
            },

            // Preferences - initialize with defaults
            preferences: {
               theme: 'auto',
               language: 'en',
               emailNotifications: {
                  newNotes: true,
                  comments: true,
                  likes: true,
                  weeklyDigest: false
               },
               privacy: {
                  profileVisibility: 'public',
                  showEmail: false
               }
            },

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