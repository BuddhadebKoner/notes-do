import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

      const conn = await mongoose.connect(process.env.MONGODB_URI, opts);
      isConnected = true;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
   } catch (error) {
      console.error('Error connecting to MongoDB:', error.message);
      // Don't exit process in serverless environment
      throw error;
   }
};

export default connectDB;