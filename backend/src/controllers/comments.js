import Note from '../models/notes.js';
import User from '../models/user.js';

// Get comments for a note with pagination
export const getCommentsByNoteId = async (req, res) => {
   try {
      const { noteId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Validate noteId
      if (!noteId) {
         return res.status(400).json({
            success: false,
            message: 'Note ID is required'
         });
      }

      // Check if note exists
      const note = await Note.findById(noteId);
      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const totalComments = note.comments.length;
      const totalPages = Math.ceil(totalComments / parseInt(limit));

      // Get paginated comments with populated user data
      const paginatedComments = note.comments
         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by newest first
         .slice(skip, skip + parseInt(limit));

      // Populate user data for comments and replies
      await Note.populate(paginatedComments, {
         path: 'user',
         select: 'username profile.firstName profile.lastName profile.avatar account.isVerified'
      });

      await Note.populate(paginatedComments, {
         path: 'replies.user',
         select: 'username profile.firstName profile.lastName profile.avatar account.isVerified'
      });

      await Note.populate(paginatedComments, {
         path: 'likes.user',
         select: 'username'
      });

      // Format comments for frontend
      const formattedComments = paginatedComments.map(comment => ({
         id: comment._id,
         content: comment.content,
         author: {
            id: comment.user._id,
            name: `${comment.user.profile.firstName} ${comment.user.profile.lastName}`.trim(),
            username: comment.user.username,
            avatar: comment.user.profile.avatar,
            isVerified: comment.user.account.isVerified
         },
         createdAt: comment.createdAt,
         updatedAt: comment.updatedAt,
         likes: comment.likes.length,
         isLiked: req.user ? comment.likes.some(like => like.user._id.toString() === req.user._id.toString()) : false,
         canEdit: req.user ? comment.user._id.toString() === req.user._id.toString() : false,
         canDelete: req.user ? comment.user._id.toString() === req.user._id.toString() : false,
         replies: comment.replies.map(reply => ({
            id: reply._id,
            content: reply.content,
            author: {
               id: reply.user._id,
               name: `${reply.user.profile.firstName} ${reply.user.profile.lastName}`.trim(),
               username: reply.user.username,
               avatar: reply.user.profile.avatar,
               isVerified: reply.user.account.isVerified
            },
            createdAt: reply.createdAt,
            canEdit: req.user ? reply.user._id.toString() === req.user._id.toString() : false,
            canDelete: req.user ? reply.user._id.toString() === req.user._id.toString() : false
         }))
      }));

      res.status(200).json({
         success: true,
         data: {
            comments: formattedComments,
            pagination: {
               currentPage: parseInt(page),
               totalPages,
               totalComments,
               hasMore: parseInt(page) < totalPages,
               limit: parseInt(limit)
            }
         }
      });

   } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch comments',
         error: error.message
      });
   }
};

// Add a new comment to a note
export const addComment = async (req, res) => {
   try {
      const { noteId } = req.params;
      const { content } = req.body;

      // Validate input
      if (!noteId) {
         return res.status(400).json({
            success: false,
            message: 'Note ID is required'
         });
      }

      if (!content || content.trim().length === 0) {
         return res.status(400).json({
            success: false,
            message: 'Comment content is required'
         });
      }

      if (content.length > 1000) {
         return res.status(400).json({
            success: false,
            message: 'Comment content must be less than 1000 characters'
         });
      }

      // Check if user is authenticated
      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required'
         });
      }

      // Check if note exists and user can comment
      const note = await Note.findById(noteId);
      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      if (!note.permissions.canComment) {
         return res.status(403).json({
            success: false,
            message: 'Comments are not allowed on this note'
         });
      }

      // Create new comment
      const newComment = {
         user: req.user._id,
         content: content.trim(),
         likes: [],
         replies: []
      };

      // Add comment to note
      note.comments.push(newComment);
      await note.save();

      // Get the created comment with populated user data
      const savedNote = await Note.findById(noteId)
         .populate({
            path: 'comments.user',
            select: 'username profile.firstName profile.lastName profile.avatar account.isVerified'
         });

      const createdComment = savedNote.comments[savedNote.comments.length - 1];

      // Format response
      const formattedComment = {
         id: createdComment._id,
         content: createdComment.content,
         author: {
            id: createdComment.user._id,
            name: `${createdComment.user.profile.firstName} ${createdComment.user.profile.lastName}`.trim(),
            username: createdComment.user.username,
            avatar: createdComment.user.profile.avatar,
            isVerified: createdComment.user.account.isVerified
         },
         createdAt: createdComment.createdAt,
         updatedAt: createdComment.updatedAt,
         likes: 0,
         isLiked: false,
         canEdit: true,
         canDelete: true,
         replies: []
      };

      res.status(201).json({
         success: true,
         message: 'Comment added successfully',
         data: {
            comment: formattedComment
         }
      });

   } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to add comment',
         error: error.message
      });
   }
};

// Like/Unlike a comment
export const toggleCommentLike = async (req, res) => {
   try {
      const { noteId, commentId } = req.params;

      // Validate input
      if (!noteId || !commentId) {
         return res.status(400).json({
            success: false,
            message: 'Note ID and Comment ID are required'
         });
      }

      // Check if user is authenticated
      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required'
         });
      }

      // Find the note and comment
      const note = await Note.findById(noteId);
      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      const comment = note.comments.id(commentId);
      if (!comment) {
         return res.status(404).json({
            success: false,
            message: 'Comment not found. Note: Only main comments can be liked, not replies.'
         });
      }

      // Check if user already liked the comment
      const existingLikeIndex = comment.likes.findIndex(
         like => like.user.toString() === req.user._id.toString()
      );

      let isLiked = false;
      let action = '';

      if (existingLikeIndex > -1) {
         // Unlike the comment
         comment.likes.splice(existingLikeIndex, 1);
         action = 'unliked';
         isLiked = false;
      } else {
         // Like the comment
         comment.likes.push({
            user: req.user._id,
            createdAt: new Date()
         });
         action = 'liked';
         isLiked = true;
      }

      await note.save();

      res.status(200).json({
         success: true,
         message: `Comment ${action} successfully`,
         data: {
            commentId: commentId,
            isLiked,
            likesCount: comment.likes.length,
            action
         }
      });

   } catch (error) {
      console.error('Error toggling comment like:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to toggle comment like',
         error: error.message
      });
   }
};

// Add a reply to a comment
export const addReply = async (req, res) => {
   try {
      const { noteId, commentId } = req.params;
      const { content } = req.body;

      // Validate input
      if (!noteId || !commentId) {
         return res.status(400).json({
            success: false,
            message: 'Note ID and Comment ID are required'
         });
      }

      if (!content || content.trim().length === 0) {
         return res.status(400).json({
            success: false,
            message: 'Reply content is required'
         });
      }

      if (content.length > 500) {
         return res.status(400).json({
            success: false,
            message: 'Reply content must be less than 500 characters'
         });
      }

      // Check if user is authenticated
      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: 'Authentication required'
         });
      }

      // Find the note and comment
      const note = await Note.findById(noteId);
      if (!note) {
         return res.status(404).json({
            success: false,
            message: 'Note not found'
         });
      }

      if (!note.permissions.canComment) {
         return res.status(403).json({
            success: false,
            message: 'Comments are not allowed on this note'
         });
      }

      const comment = note.comments.id(commentId);
      if (!comment) {
         return res.status(404).json({
            success: false,
            message: 'Comment not found'
         });
      }

      // Create new reply
      const newReply = {
         user: req.user._id,
         content: content.trim(),
         createdAt: new Date()
      };

      // Add reply to comment
      comment.replies.push(newReply);
      await note.save();

      // Get the created reply with populated user data
      const savedNote = await Note.findById(noteId)
         .populate({
            path: 'comments.replies.user',
            select: 'username profile.firstName profile.lastName profile.avatar account.isVerified'
         });

      const updatedComment = savedNote.comments.id(commentId);
      const createdReply = updatedComment.replies[updatedComment.replies.length - 1];

      // Format response
      const formattedReply = {
         id: createdReply._id,
         content: createdReply.content,
         author: {
            id: createdReply.user._id,
            name: `${createdReply.user.profile.firstName} ${createdReply.user.profile.lastName}`.trim(),
            username: createdReply.user.username,
            avatar: createdReply.user.profile.avatar,
            isVerified: createdReply.user.account.isVerified
         },
         createdAt: createdReply.createdAt,
         canEdit: true,
         canDelete: true
      };

      res.status(201).json({
         success: true,
         message: 'Reply added successfully',
         data: {
            reply: formattedReply,
            commentId: commentId
         }
      });

   } catch (error) {
      console.error('Error adding reply:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to add reply',
         error: error.message
      });
   }
};