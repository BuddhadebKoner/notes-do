import { User, Note } from '../models/index.js';
import mongoose from 'mongoose';
import { z } from 'zod';

// Validation schemas
const createWishlistSchema = z.object({
   name: z.string()
      .min(1, 'Wishlist name is required')
      .max(100, 'Wishlist name must be less than 100 characters')
      .trim(),
   description: z.string()
      .max(500, 'Description must be less than 500 characters')
      .trim()
      .optional(),
   isPrivate: z.boolean().optional().default(false),
   color: z.enum(['blue', 'green', 'purple', 'red', 'orange', 'yellow', 'pink', 'gray']).optional().default('blue'),
   noteIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid note ID format')).optional().default([])
});

const updateWishlistSchema = z.object({
   name: z.string()
      .min(1, 'Wishlist name is required')
      .max(100, 'Wishlist name must be less than 100 characters')
      .trim()
      .optional(),
   description: z.string()
      .max(500, 'Description must be less than 500 characters')
      .trim()
      .optional(),
   isPrivate: z.boolean().optional(),
   color: z.enum(['blue', 'green', 'purple', 'red', 'orange', 'yellow', 'pink', 'gray']).optional()
});

const addNotesToWishlistSchema = z.object({
   noteIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid note ID format'))
      .min(1, 'At least one note ID is required')
      .max(50, 'Cannot add more than 50 notes at once')
});

// Create a new wishlist
export const createWishlist = async (req, res) => {
   try {
      // Validate request body
      const validatedData = createWishlistSchema.parse(req.body);

      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      // Check if user already has 10 wishlists (maximum allowed)
      if (user.activity.wishlists.length >= 10) {
         return res.status(400).json({
            success: false,
            message: 'Maximum of 10 wishlists allowed per user'
         });
      }

      // Check if wishlist name already exists for this user
      const existingWishlist = user.activity.wishlists.find(
         wishlist => wishlist.name.toLowerCase() === validatedData.name.toLowerCase()
      );

      if (existingWishlist) {
         return res.status(400).json({
            success: false,
            message: 'A wishlist with this name already exists'
         });
      }

      // Validate notes if provided
      let validNotes = [];
      if (validatedData.noteIds && validatedData.noteIds.length > 0) {
         const notes = await Note.find({
            _id: { $in: validatedData.noteIds },
            uploader: req.user._id, // Only allow user's own notes
            status: 'approved'
         }).select('_id title');

         if (notes.length !== validatedData.noteIds.length) {
            return res.status(400).json({
               success: false,
               message: 'Some notes are invalid or not accessible'
            });
         }

         validNotes = validatedData.noteIds.map(noteId => ({
            note: noteId,
            addedAt: new Date()
         }));
      }

      // Create new wishlist
      const newWishlist = {
         name: validatedData.name,
         description: validatedData.description || '',
         notes: validNotes,
         isPrivate: validatedData.isPrivate,
         color: validatedData.color,
         createdAt: new Date(),
         updatedAt: new Date()
      };

      user.activity.wishlists.push(newWishlist);
      await user.save();

      // Get the created wishlist with populated notes
      const createdWishlist = user.activity.wishlists[user.activity.wishlists.length - 1];

      await user.populate({
         path: 'activity.wishlists.notes.note',
         select: 'title description subject academic file.viewUrl file.thumbnailUrl uploadDate',
         populate: {
            path: 'uploader',
            select: 'username profile.firstName profile.lastName profile.avatar'
         }
      });

      res.status(201).json({
         success: true,
         message: 'Wishlist created successfully',
         wishlist: createdWishlist
      });

   } catch (error) {
      if (error instanceof z.ZodError) {
         return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.errors.map(err => ({
               field: err.path.join('.'),
               message: err.message
            }))
         });
      }

      console.error('Create wishlist error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to create wishlist',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Get all user's wishlists
export const getUserWishlists = async (req, res) => {
   try {
      const { includeNotes = 'false', page = 1, limit = 10 } = req.query;

      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      let wishlists = user.activity.wishlists.sort((a, b) => b.updatedAt - a.updatedAt);

      // Pagination for wishlists
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const totalWishlists = wishlists.length;
      wishlists = wishlists.slice(skip, skip + parseInt(limit));

      // Populate notes if requested
      if (includeNotes === 'true') {
         await user.populate({
            path: 'activity.wishlists.notes.note',
            select: 'title description subject academic file.viewUrl file.thumbnailUrl uploadDate social.views social.downloads',
            populate: {
               path: 'uploader',
               select: 'username profile.firstName profile.lastName profile.avatar'
            }
         });

         // Filter wishlists to only include the paginated ones with populated data
         wishlists = user.activity.wishlists
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(skip, skip + parseInt(limit));
      }

      res.status(200).json({
         success: true,
         data: {
            wishlists: wishlists.map(wishlist => ({
               ...wishlist.toObject(),
               notesCount: wishlist.notes.length
            })),
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(totalWishlists / parseInt(limit)),
               totalWishlists,
               hasNextPage: skip + parseInt(limit) < totalWishlists,
               hasPrevPage: parseInt(page) > 1
            }
         }
      });

   } catch (error) {
      console.error('Get user wishlists error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch wishlists',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Get a specific wishlist by ID
export const getWishlistById = async (req, res) => {
   try {
      const { wishlistId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!mongoose.Types.ObjectId.isValid(wishlistId)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid wishlist ID format'
         });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      const wishlist = user.activity.wishlists.id(wishlistId);
      if (!wishlist) {
         return res.status(404).json({
            success: false,
            message: 'Wishlist not found'
         });
      }

      // Pagination for notes within wishlist
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const totalNotes = wishlist.notes.length;

      // Get paginated note IDs
      const paginatedNoteIds = wishlist.notes
         .sort((a, b) => b.addedAt - a.addedAt)
         .slice(skip, skip + parseInt(limit))
         .map(item => item.note);

      // Populate the notes with fields required by NoteCard component
      const populatedNotes = await Note.find({
         _id: { $in: paginatedNoteIds },
         status: 'approved', // Only show approved notes
         visibility: { $ne: 'private' } // Exclude private notes from wishlists
      })
         .select('title subject file.viewUrl file.downloadUrl file.driveFileId file.thumbnailUrl social.views social.likes')
         .populate('uploader', 'username profile.firstName profile.lastName profile.avatar')
         .lean();

      // Maintain the order and format for NoteCard component
      const orderedNotes = paginatedNoteIds.map(noteId => {
         const note = populatedNotes.find(n => n._id.toString() === noteId.toString());
         if (!note) return null;

         const wishlistItem = wishlist.notes.find(item => item.note.toString() === noteId.toString());

         return {
            _id: note._id,
            title: note.title,
            subject: note.subject?.name || note.subject,
            viewUrl: note.file.viewUrl,
            downloadUrl: note.file.downloadUrl,
            driveFileId: note.file.driveFileId,
            thumbnailUrl: note.file.thumbnailUrl,
            stats: {
               views: note.social.views || 0,
               likes: note.social.likes?.length || 0,
               isLiked: note.social.likes?.some(like => like.user.toString() === req.user._id.toString()) || false
            },
            uploader: {
               username: note.uploader.username,
               name: note.uploader.profile.firstName + ' ' + note.uploader.profile.lastName,
               avatar: note.uploader.profile.avatar
            },
            addedAt: wishlistItem?.addedAt
         };
      }).filter(Boolean);

      res.status(200).json({
         success: true,
         data: {
            wishlist: {
               _id: wishlist._id,
               name: wishlist.name,
               description: wishlist.description,
               isPrivate: wishlist.isPrivate,
               color: wishlist.color,
               createdAt: wishlist.createdAt,
               updatedAt: wishlist.updatedAt,
               totalNotes: totalNotes
            },
            notes: orderedNotes,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(totalNotes / parseInt(limit)),
               totalNotes,
               hasNextPage: skip + parseInt(limit) < totalNotes,
               hasPrevPage: parseInt(page) > 1
            }
         }
      });

   } catch (error) {
      console.error('Get wishlist by ID error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch wishlist',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Update wishlist details
export const updateWishlist = async (req, res) => {
   try {
      const { wishlistId } = req.params;
      const validatedData = updateWishlistSchema.parse(req.body);

      if (!mongoose.Types.ObjectId.isValid(wishlistId)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid wishlist ID format'
         });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      const wishlist = user.activity.wishlists.id(wishlistId);
      if (!wishlist) {
         return res.status(404).json({
            success: false,
            message: 'Wishlist not found'
         });
      }

      // Check if new name conflicts with existing wishlists
      if (validatedData.name) {
         const existingWishlist = user.activity.wishlists.find(
            w => w._id.toString() !== wishlistId &&
               w.name.toLowerCase() === validatedData.name.toLowerCase()
         );

         if (existingWishlist) {
            return res.status(400).json({
               success: false,
               message: 'A wishlist with this name already exists'
            });
         }
      }

      // Update wishlist fields
      Object.keys(validatedData).forEach(key => {
         if (validatedData[key] !== undefined) {
            wishlist[key] = validatedData[key];
         }
      });

      wishlist.updatedAt = new Date();
      await user.save();

      res.status(200).json({
         success: true,
         message: 'Wishlist updated successfully',
         wishlist: {
            _id: wishlist._id,
            name: wishlist.name,
            description: wishlist.description,
            isPrivate: wishlist.isPrivate,
            color: wishlist.color,
            createdAt: wishlist.createdAt,
            updatedAt: wishlist.updatedAt,
            notesCount: wishlist.notes.length
         }
      });

   } catch (error) {
      if (error instanceof z.ZodError) {
         return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.errors.map(err => ({
               field: err.path.join('.'),
               message: err.message
            }))
         });
      }

      console.error('Update wishlist error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update wishlist',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Delete a wishlist
export const deleteWishlist = async (req, res) => {
   try {
      const { wishlistId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(wishlistId)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid wishlist ID format'
         });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      const wishlistIndex = user.activity.wishlists.findIndex(
         w => w._id.toString() === wishlistId
      );

      if (wishlistIndex === -1) {
         return res.status(404).json({
            success: false,
            message: 'Wishlist not found'
         });
      }

      const deletedWishlist = user.activity.wishlists[wishlistIndex];
      user.activity.wishlists.splice(wishlistIndex, 1);
      await user.save();

      res.status(200).json({
         success: true,
         message: 'Wishlist deleted successfully',
         deletedWishlist: {
            _id: deletedWishlist._id,
            name: deletedWishlist.name,
            notesCount: deletedWishlist.notes.length
         }
      });

   } catch (error) {
      console.error('Delete wishlist error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete wishlist',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Add notes to wishlist
export const addNotesToWishlist = async (req, res) => {
   try {
      const { wishlistId } = req.params;
      const validatedData = addNotesToWishlistSchema.parse(req.body);

      if (!mongoose.Types.ObjectId.isValid(wishlistId)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid wishlist ID format'
         });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      const wishlist = user.activity.wishlists.id(wishlistId);
      if (!wishlist) {
         return res.status(404).json({
            success: false,
            message: 'Wishlist not found'
         });
      }

      // Validate that notes exist and belong to the user
      const notes = await Note.find({
         _id: { $in: validatedData.noteIds },
         uploader: req.user._id,
         status: 'approved'
      }).select('_id title');

      if (notes.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'No valid notes found to add'
         });
      }

      // Check which notes are already in the wishlist
      const existingNoteIds = wishlist.notes.map(item => item.note.toString());
      const newNotes = [];
      const alreadyExists = [];

      validatedData.noteIds.forEach(noteId => {
         if (existingNoteIds.includes(noteId)) {
            const note = notes.find(n => n._id.toString() === noteId);
            if (note) alreadyExists.push(note);
         } else {
            const note = notes.find(n => n._id.toString() === noteId);
            if (note) {
               newNotes.push({
                  note: noteId,
                  addedAt: new Date()
               });
            }
         }
      });

      // Add new notes to wishlist
      if (newNotes.length > 0) {
         wishlist.notes.push(...newNotes);
         wishlist.updatedAt = new Date();
         await user.save();
      }

      res.status(200).json({
         success: true,
         message: 'Notes processed for wishlist',
         data: {
            added: newNotes.length,
            alreadyExists: alreadyExists.length,
            totalInWishlist: wishlist.notes.length,
            addedNotes: newNotes
         }
      });

   } catch (error) {
      if (error instanceof z.ZodError) {
         return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.errors.map(err => ({
               field: err.path.join('.'),
               message: err.message
            }))
         });
      }

      console.error('Add notes to wishlist error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to add notes to wishlist',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};

// Remove notes from wishlist
export const removeNotesFromWishlist = async (req, res) => {
   try {
      const { wishlistId } = req.params;
      const { noteIds } = req.body;

      if (!mongoose.Types.ObjectId.isValid(wishlistId)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid wishlist ID format'
         });
      }

      if (!Array.isArray(noteIds) || noteIds.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'Note IDs array is required'
         });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
         return res.status(404).json({
            success: false,
            message: 'User not found'
         });
      }

      const wishlist = user.activity.wishlists.id(wishlistId);
      if (!wishlist) {
         return res.status(404).json({
            success: false,
            message: 'Wishlist not found'
         });
      }

      // Remove notes from wishlist
      const originalCount = wishlist.notes.length;
      wishlist.notes = wishlist.notes.filter(
         item => !noteIds.includes(item.note.toString())
      );

      const removedCount = originalCount - wishlist.notes.length;

      if (removedCount > 0) {
         wishlist.updatedAt = new Date();
         await user.save();
      }

      res.status(200).json({
         success: true,
         message: `${removedCount} note(s) removed from wishlist`,
         data: {
            removed: removedCount,
            remainingCount: wishlist.notes.length
         }
      });

   } catch (error) {
      console.error('Remove notes from wishlist error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to remove notes from wishlist',
         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
   }
};