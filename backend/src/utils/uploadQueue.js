/**
 * Upload Queue Manager
 * Manages sequential upload operations to prevent overwhelming the server
 * Serverless-compatible (uses in-memory queue)
 */

class UploadQueue {
   constructor() {
      this.queue = [];
      this.processing = false;
      this.activeUploads = 0;
      this.maxConcurrentUploads = 3; // Max concurrent uploads
      this.statistics = {
         totalProcessed: 0,
         totalFailed: 0,
         totalSuccess: 0,
         averageProcessingTime: 0
      };
   }

   /**
    * Add an upload task to the queue
    * @param {Function} uploadFunction - Async function that performs the upload
    * @param {string} taskId - Unique identifier for the task
    * @returns {Promise} - Resolves when upload completes
    */
   async addToQueue(uploadFunction, taskId = Date.now().toString()) {
      return new Promise((resolve, reject) => {
         const task = {
            id: taskId,
            uploadFunction,
            resolve,
            reject,
            addedAt: Date.now(),
            startedAt: null,
            completedAt: null
         };

         this.queue.push(task);
         console.log(`📋 Upload task ${taskId} added to queue. Queue length: ${this.queue.length}`);

         // Start processing if not already processing
         if (!this.processing) {
            this.processQueue();
         }
      });
   }

   /**
    * Process the upload queue
    */
   async processQueue() {
      if (this.processing) {
         return;
      }

      this.processing = true;

      while (this.queue.length > 0 || this.activeUploads > 0) {
         // Check if we can start more uploads
         if (this.queue.length > 0 && this.activeUploads < this.maxConcurrentUploads) {
            const task = this.queue.shift();
            this.activeUploads++;

            // Process task without blocking
            this.processTask(task).finally(() => {
               this.activeUploads--;
            });
         } else {
            // Wait a bit before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
         }
      }

      this.processing = false;
      console.log('✅ Upload queue processing completed');
   }

   /**
    * Process a single upload task
    * @param {Object} task - The upload task
    */
   async processTask(task) {
      const startTime = Date.now();
      task.startedAt = startTime;

      console.log(`🚀 Starting upload task ${task.id}. Active uploads: ${this.activeUploads}`);

      try {
         const result = await task.uploadFunction();

         task.completedAt = Date.now();
         const processingTime = task.completedAt - task.startedAt;

         console.log(`✅ Upload task ${task.id} completed in ${processingTime}ms`);

         // Update statistics
         this.statistics.totalProcessed++;
         this.statistics.totalSuccess++;
         this.updateAverageProcessingTime(processingTime);

         task.resolve(result);
      } catch (error) {
         task.completedAt = Date.now();
         const processingTime = task.completedAt - task.startedAt;

         console.error(`❌ Upload task ${task.id} failed after ${processingTime}ms:`, error.message);

         // Update statistics
         this.statistics.totalProcessed++;
         this.statistics.totalFailed++;
         this.updateAverageProcessingTime(processingTime);

         task.reject(error);
      }
   }

   /**
    * Update average processing time
    * @param {number} newTime - New processing time to add to average
    */
   updateAverageProcessingTime(newTime) {
      const currentAvg = this.statistics.averageProcessingTime;
      const total = this.statistics.totalProcessed;

      this.statistics.averageProcessingTime =
         ((currentAvg * (total - 1)) + newTime) / total;
   }

   /**
    * Get queue statistics
    * @returns {Object} - Queue statistics
    */
   getStatistics() {
      return {
         ...this.statistics,
         queueLength: this.queue.length,
         activeUploads: this.activeUploads,
         isProcessing: this.processing,
         maxConcurrentUploads: this.maxConcurrentUploads
      };
   }

   /**
    * Get current queue length
    * @returns {number} - Number of pending tasks
    */
   getQueueLength() {
      return this.queue.length;
   }

   /**
    * Check if queue is processing
    * @returns {boolean} - True if processing
    */
   isProcessing() {
      return this.processing || this.activeUploads > 0;
   }

   /**
    * Clear the queue (emergency use only)
    */
   clearQueue() {
      const clearedTasks = this.queue.length;
      this.queue.forEach(task => {
         task.reject(new Error('Queue cleared by administrator'));
      });
      this.queue = [];
      console.log(`🧹 Cleared ${clearedTasks} tasks from upload queue`);
      return clearedTasks;
   }

   /**
    * Set maximum concurrent uploads
    * @param {number} max - Maximum concurrent uploads (1-5)
    */
   setMaxConcurrentUploads(max) {
      if (max < 1 || max > 5) {
         throw new Error('Max concurrent uploads must be between 1 and 5');
      }
      this.maxConcurrentUploads = max;
      console.log(`⚙️ Max concurrent uploads set to ${max}`);
   }
}

// Create singleton instance
const uploadQueue = new UploadQueue();

export default uploadQueue;
