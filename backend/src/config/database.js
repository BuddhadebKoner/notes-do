import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

// Database connection class
class DatabaseConnection {
   constructor() {
      this.retryCount = 0;
      this.isConnected = false;
      this.isRetrying = false;

      // Configure mongoose settings
      mongoose.set('strictQuery', true);

      mongoose.connection.on('connected', () => {
         this.isConnected = true;
         if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Database connected successfully');
         }
      });

      mongoose.connection.on('error', err => {
         console.error('❌ Database connection error:', err);
         this.isConnected = false;
         if (!this.isRetrying) {
            this.retryConnection();
         }
      });

      mongoose.connection.on('disconnected', () => {
         this.isConnected = false;
         if (!this.isRetrying) {
            this.retryConnection();
         }
      });

      // Handle both SIGTERM and SIGINT for graceful shutdown
      process.on('SIGTERM', this.handleAppTermination.bind(this));
      process.on('SIGINT', this.handleAppTermination.bind(this));
   }

   async connect() {
      try {
         // Check for environment variable
         const mongoUri = process.env.MONGODB_URI;
         if (!mongoUri) {
            throw new Error(
               'MONGODB_URI environment variable is not defined'
            );
         }

         const connectOptions = {
            maxPoolSize: 10,
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4, // Use IPv4
         };

         if (process.env.NODE_ENV === 'development') {
            mongoose.set('debug', true);
         }

         await mongoose.connect(mongoUri, connectOptions);
         this.retryCount = 0; // Reset retry count on successful connection
         this.isRetrying = false;
      } catch (error) {
         console.error('❌ Failed to connect to the database:', error);
         this.isConnected = false;
         await this.retryConnection();
      }
   }

   async retryConnection() {
      if (this.isRetrying) {
         return; // Prevent multiple retry attempts
      }

      this.isRetrying = true;

      if (this.retryCount < MAX_RETRIES) {
         this.retryCount++;
         if (process.env.NODE_ENV !== 'production') {
            console.log(`🔄 Retrying connection (${this.retryCount}/${MAX_RETRIES})...`);
         }
         await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

         return this.connect();
      } else {
         console.error('💥 Max retries reached. Could not connect to the database.');
         this.isRetrying = false;

         // In serverless environments, don't exit the process
         if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
            throw new Error('Database connection failed after maximum retries');
         } else {
            process.exit(1); // Exit the process if max retries are reached
         }
      }
   }

   async disconnect() {
      if (this.isConnected) {
         await mongoose.connection.close();
         this.isConnected = false;
      }
   }

   async handleAppTermination() {
      try {
         await mongoose.connection.close();
         if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Database connection closed gracefully');
         }
         process.exit(0);
      } catch (error) {
         console.error('❌ Error closing database connection:', error);
         process.exit(1);
      }
   }

   getConnectionStatus() {
      return {
         isConnected: this.isConnected,
         readyState: mongoose.connection.readyState,
         host: mongoose.connection.host,
         name: mongoose.connection.name,
         databaseName: mongoose.connection.db?.databaseName || 'Unknown',
      };
   }
}

// Create and export a singleton instance
const dbConnection = new DatabaseConnection();

// Export the connect function as default and named exports
export default dbConnection.connect.bind(dbConnection);
export const connectDB = dbConnection.connect.bind(dbConnection);
export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);
export const disconnectDB = dbConnection.disconnect.bind(dbConnection);