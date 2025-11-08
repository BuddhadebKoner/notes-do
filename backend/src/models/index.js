// Central export file for all models
import User from './user.js';
import Note from './notes.js';
import Notification from './notification.js';

// Export models
export { User, Note, Notification };

// You can also add model relationship setup here if needed
export default {
   User,
   Note,
   Notification
};