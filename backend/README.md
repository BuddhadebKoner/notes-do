# Backend - Notes-Do API Server

Express.js API server with MongoDB and Clerk authentication for the Notes-Do application.

## Features

- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - Document database with Mongoose ODM
- **Clerk Authentication** - Complete user authentication and management
- **Security** - Helmet, rate limiting, CORS, data sanitization
- **Error Handling** - Comprehensive error handling and logging
- **Environment Configuration** - Secure environment variable management

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   
   Update `.env` file:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/notes-do
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   CLERK_SECRET_KEY=your_clerk_secret_key_here
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start MongoDB**
   
   Make sure MongoDB is running locally or update `MONGODB_URI` for MongoDB Atlas.

4. **Start the server**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `GET /api/auth/status` - Check authentication status
- `GET /api/auth/me` - Get current user information (protected)
- `POST /api/auth/verify` - Verify token (protected)
- `POST /api/auth/logout` - Logout user (protected)
- `GET /api/auth/users/:userId` - Get user by ID (protected)

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection configuration
├── middleware/
│   └── auth.js              # Clerk authentication middleware
├── routes/
│   └── auth.js              # Authentication routes
├── .env                     # Environment variables
├── package.json            # Dependencies and scripts
└── server.js               # Main server file
```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/notes-do

# Clerk Configuration
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# JWT Configuration (if needed)
JWT_SECRET=your_jwt_secret_here
```

## Security Features

- **Helmet** - Sets various HTTP headers for security
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS** - Configured for frontend origin
- **Data Sanitization** - Prevents NoSQL injection attacks
- **Parameter Pollution Prevention** - HPP middleware

## Authentication Flow

1. Frontend sends Clerk token in Authorization header or x-clerk-auth-token
2. Backend verifies token with Clerk API
3. User information is attached to request object
4. Protected routes can access user data via `req.user`

## Error Handling

The server includes comprehensive error handling for:
- MongoDB connection errors
- Clerk authentication errors
- Validation errors
- 404 routes
- Unhandled promise rejections
- Uncaught exceptions

## Development

- Uses ES modules (type: "module" in package.json)
- Nodemon for automatic restart during development
- Morgan for HTTP request logging in development mode
- Comprehensive error logging

## Deployment

1. Set production environment variables
2. Ensure MongoDB is accessible
3. Update CORS settings for production frontend URL
4. Use PM2 or similar for process management

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (not implemented yet)

For more information, see the main README in the root directory.