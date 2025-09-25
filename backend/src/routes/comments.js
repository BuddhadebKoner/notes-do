import express from 'express';
import {
   getCommentsByNoteId,
   addComment,
   toggleCommentLike,
   addReply
} from '../controllers/comments.js';
import { requireAuth, requireUserInDB, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get comments for a note with pagination
// GET /api/comments/:noteId?page=1&limit=10
// Use optionalAuth to get user context for like status and permissions
router.get('/:noteId', optionalAuth, getCommentsByNoteId);

// Add a new comment to a note
// POST /api/comments/:noteId
router.post('/:noteId', requireAuth, requireUserInDB, addComment);

// Like/Unlike a comment
// PUT /api/comments/:noteId/:commentId/like
router.put('/:noteId/:commentId/like', requireAuth, requireUserInDB, toggleCommentLike);

// Add a reply to a comment
// POST /api/comments/:noteId/:commentId/reply
router.post('/:noteId/:commentId/reply', requireAuth, requireUserInDB, addReply); export default router;