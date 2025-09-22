import express from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import authRoutes from '../routes/auth.js';
import noteRoutes from '../routes/notes.js';
import googleRoutes from '../routes/google.js';
import profileRoutes from '../routes/profile.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Trust proxy for rate limiting (if behind proxy/load balancer)
app.set('trust proxy', 1);

// Database connection for serverless
let isConnected = false;

const connectDB = async () => {
   if (isConnected) {
      return;
   }

   try {
      const opts = {
         bufferCommands: false,
         serverSelectionTimeoutMS: 5000,
         socketTimeoutMS: 45000,
      };

      await mongoose.connect(process.env.MONGODB_URI, opts);
      isConnected = true;
      console.log('MongoDB Connected for serverless function');
   } catch (error) {
      console.error('Error connecting to MongoDB:', error.message);
      throw error;
   }
};

// Security Middleware
app.use(helmet({
   contentSecurityPolicy: {
      directives: {
         defaultSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         scriptSrc: ["'self'"],
         imgSrc: ["'self'", "data:", "https:"],
      },
   },
}));

// Rate limiting
const limiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 100, // limit each IP to 100 requests per windowMs
   message: 'Too many requests from this IP, please try again later.',
   standardHeaders: true,
   legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
   origin: [
      process.env.FRONTEND_URL || 'https://notes-do.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
   ],
   credentials: true,
   optionsSuccessStatus: 200,
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization', 'x-clerk-auth-token'],
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Manual sanitization function as alternative
const sanitizeObject = (obj) => {
   if (obj && typeof obj === 'object') {
      for (let key in obj) {
         if (typeof key === 'string' && key.startsWith('$')) {
            delete obj[key];
         } else if (typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
         }
      }
   }
};

// Custom sanitization middleware
app.use((req, res, next) => {
   sanitizeObject(req.body);
   sanitizeObject(req.query);
   sanitizeObject(req.params);
   next();
});

// Prevent parameter pollution
app.use(hpp());

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
   app.use(morgan('combined'));
}

// Connect to database before handling requests
app.use(async (req, res, next) => {
   try {
      await connectDB();
      next();
   } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({
         success: false,
         error: 'Database connection failed'
      });
   }
});

// Health check endpoint
app.get('/health', (req, res) => {
   res.status(200).json({
      success: true,
      message: 'Server is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
   });
});

// API Routes
app.get('/api', (req, res) => {
   res.status(200).json({
      success: true,
      message: 'Notes-Do API is running!',
      version: '1.0.0',
      endpoints: {
         health: '/health',
         auth: '/api/auth',
         notes: '/api/notes',
         profile: '/api/profile',
         google: '/api/google'
      },
   });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/profile', profileRoutes);

// Global error handler
app.use((err, req, res, next) => {
   console.error(err.stack);

   // Default error
   let error = { ...err };
   error.message = err.message;

   // Mongoose bad ObjectId
   if (err.name === 'CastError') {
      const message = 'Resource not found';
      error = { message, statusCode: 404 };
   }

   // Mongoose duplicate key
   if (err.code === 11000) {
      const message = 'Duplicate field value entered';
      error = { message, statusCode: 400 };
   }

   // Mongoose validation error
   if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      error = { message, statusCode: 400 };
   }

   res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Server Error'
   });
});

// Handle 404 routes
app.use((req, res) => {
   res.status(404).json({
      success: false,
      message: 'Route not found'
   });
});

// Export the Express app for Vercel
export default app;