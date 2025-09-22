import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { checkLogin, createUser } from '../controllers/user.js';

const router = express.Router();

// Route to check if user is logged in (with Clerk authentication)
router.get('/check-login', requireAuth, checkLogin);

// Route to create user profile (requires Clerk authentication)
router.post('/create-user', requireAuth, createUser);

export default router;