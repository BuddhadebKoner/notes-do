import api, { API_ENDPOINTS } from '../config/api.js'
import crypto from 'crypto-js'

/**
 * Production-grade chunked file upload implementation
 * Handles large files (90MB+) with resumability and progress tracking
 */
class ChunkedUploadService {
  constructor() {
    this.CHUNK_SIZE = 4 * 1024 * 1024 // 4MB chunks for optimal performance
    this.MAX_RETRIES = 3
    this.RETRY_DELAY = 1000 // 1 second
    this.activeUploads = new Map() // Track active uploads
  }

  /**
   * Calculate file hash for integrity verification
   */
  async calculateFileHash(file) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => {
        const wordArray = crypto.lib.WordArray.create(e.target.result)
        const hash = crypto.MD5(wordArray).toString()
        resolve(hash)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Calculate chunk hash for integrity verification
   */
  async calculateChunkHash(chunk) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => {
        const wordArray = crypto.lib.WordArray.create(e.target.result)
        const hash = crypto.MD5(wordArray).toString()
        resolve(hash)
      }
      reader.readAsArrayBuffer(chunk)
    })
  }

  /**
   * Initialize chunked upload session
   */
  async initializeUpload(file, metadata) {
    try {
      const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE)
      const fileHash = await this.calculateFileHash(file)

      const response = await api.post(API_ENDPOINTS.CHUNKED_UPLOAD.INIT, {
        fileName: file.name,
        fileSize: file.size,
        totalChunks,
        chunkSize: this.CHUNK_SIZE,
        fileHash,
        ...metadata,
      })

      if (response.data.success) {
        const uploadSession = {
          uploadId: response.data.uploadId,
          file,
          metadata,
          totalChunks,
          fileHash,
          uploadedChunks: new Set(),
          progress: 0,
          status: 'initialized',
          retryAttempts: 0,
        }

        this.activeUploads.set(response.data.uploadId, uploadSession)
        return uploadSession
      } else {
        throw new Error(response.data.message || 'Failed to initialize upload')
      }
    } catch (error) {
      console.error('Initialize upload error:', error)
      throw error
    }
  }

  /**
   * Upload file chunk with retry logic
   */
  async uploadChunk(uploadId, chunkIndex, retryCount = 0) {
    const session = this.activeUploads.get(uploadId)
    if (!session) {
      throw new Error('Upload session not found')
    }

    try {
      const start = chunkIndex * this.CHUNK_SIZE
      const end = Math.min(start + this.CHUNK_SIZE, session.file.size)
      const chunk = session.file.slice(start, end)

      // Calculate chunk hash for integrity
      const chunkHash = await this.calculateChunkHash(chunk)

      // Create FormData for chunk upload
      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append('chunkIndex', chunkIndex.toString())
      formData.append('chunkHash', chunkHash)

      const response = await api.post(
        `${API_ENDPOINTS.CHUNKED_UPLOAD.CHUNK}/${uploadId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 1 minute timeout per chunk
          onUploadProgress: progressEvent => {
            // Calculate chunk-specific progress
            const chunkProgress =
              (progressEvent.loaded / progressEvent.total) * 100
            this.updateChunkProgress(uploadId, chunkIndex, chunkProgress)
          },
        }
      )

      if (response.data.success) {
        session.uploadedChunks.add(chunkIndex)
        session.progress =
          (session.uploadedChunks.size / session.totalChunks) * 100
        return response.data
      } else {
        throw new Error(response.data.message || 'Chunk upload failed')
      }
    } catch (error) {
      console.error(
        `Chunk ${chunkIndex} upload error (attempt ${retryCount + 1}):`,
        error
      )

      // Retry logic for network errors
      if (retryCount < this.MAX_RETRIES && this.isRetryableError(error)) {
        console.log(`Retrying chunk ${chunkIndex} in ${this.RETRY_DELAY}ms...`)
        await this.delay(this.RETRY_DELAY * (retryCount + 1)) // Exponential backoff
        return this.uploadChunk(uploadId, chunkIndex, retryCount + 1)
      }

      throw error
    }
  }

  /**
   * Upload all chunks with concurrent processing and progress tracking
   */
  async uploadAllChunks(uploadId, onProgress, concurrency = 3) {
    const session = this.activeUploads.get(uploadId)
    if (!session) {
      throw new Error('Upload session not found')
    }

    session.status = 'uploading'

    // Create array of chunk indices
    const chunkIndices = Array.from(
      { length: session.totalChunks },
      (_, i) => i
    )

    // Process chunks with controlled concurrency
    const results = []
    let activePromises = []
    let completedChunks = 0

    for (let i = 0; i < chunkIndices.length; i++) {
      const chunkIndex = chunkIndices[i]

      const uploadPromise = this.uploadChunk(uploadId, chunkIndex)
        .then(result => {
          completedChunks++
          const overallProgress = (completedChunks / session.totalChunks) * 100

          if (onProgress) {
            onProgress({
              uploadId,
              progress: overallProgress,
              completedChunks,
              totalChunks: session.totalChunks,
              currentChunk: chunkIndex,
            })
          }

          return result
        })
        .catch(error => {
          console.error(`Failed to upload chunk ${chunkIndex}:`, error)
          throw error
        })

      activePromises.push(uploadPromise)

      // Control concurrency
      if (
        activePromises.length >= concurrency ||
        i === chunkIndices.length - 1
      ) {
        const batchResults = await Promise.allSettled(activePromises)

        // Check for failures
        const failures = batchResults.filter(
          result => result.status === 'rejected'
        )
        if (failures.length > 0) {
          session.status = 'failed'
          throw new Error(`Failed to upload ${failures.length} chunks`)
        }

        results.push(...batchResults.map(result => result.value))
        activePromises = []
      }
    }

    session.status = 'chunks-completed'
    return results
  }

  /**
   * Complete the upload by merging chunks
   */
  async completeUpload(uploadId, googleDriveToken = null) {
    const session = this.activeUploads.get(uploadId)
    if (!session) {
      throw new Error('Upload session not found')
    }

    try {
      session.status = 'completing'

      const response = await api.post(
        `${API_ENDPOINTS.CHUNKED_UPLOAD.COMPLETE}/${uploadId}`,
        {
          googleDriveToken,
        },
        {
          timeout: 300000, // 5 minutes for file merging and processing
        }
      )

      if (response.data.success) {
        session.status = 'completed'
        this.activeUploads.delete(uploadId)
        return response.data
      } else {
        throw new Error(response.data.message || 'Failed to complete upload')
      }
    } catch (error) {
      session.status = 'failed'
      console.error('Complete upload error:', error)
      throw error
    }
  }

  /**
   * Get upload progress
   */
  async getProgress(uploadId) {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.CHUNKED_UPLOAD.PROGRESS}/${uploadId}`
      )
      return response.data
    } catch (error) {
      console.error('Get progress error:', error)
      throw error
    }
  }

  /**
   * Cancel upload session
   */
  async cancelUpload(uploadId) {
    try {
      const response = await api.delete(
        `${API_ENDPOINTS.CHUNKED_UPLOAD.CANCEL}/${uploadId}`
      )
      this.activeUploads.delete(uploadId)
      return response.data
    } catch (error) {
      console.error('Cancel upload error:', error)
      throw error
    }
  }

  /**
   * Resume interrupted upload
   */
  async resumeUpload(uploadId, onProgress) {
    try {
      // Get current progress from server
      const progressData = await this.getProgress(uploadId)

      if (!progressData.success) {
        throw new Error('Upload session not found or expired')
      }

      // Recreate session data (you might need to store this in localStorage)
      const session = this.activeUploads.get(uploadId)
      if (!session) {
        throw new Error('Local session data not found. Cannot resume upload.')
      }

      // Mark already uploaded chunks
      session.uploadedChunks = new Set(
        Array.from({ length: progressData.uploadedChunks }, (_, i) => i).filter(
          i => !progressData.missingChunks.includes(i)
        )
      )

      // Upload only missing chunks
      const missingChunks = progressData.missingChunks

      if (missingChunks.length === 0) {
        // All chunks uploaded, complete the upload
        return this.completeUpload(uploadId, session.googleDriveToken)
      }

      // Upload missing chunks
      for (const chunkIndex of missingChunks) {
        await this.uploadChunk(uploadId, chunkIndex)

        if (onProgress) {
          const currentProgress =
            ((session.totalChunks -
              missingChunks.length +
              (missingChunks.indexOf(chunkIndex) + 1)) /
              session.totalChunks) *
            100
          onProgress({
            uploadId,
            progress: currentProgress,
            completedChunks:
              session.totalChunks -
              missingChunks.length +
              (missingChunks.indexOf(chunkIndex) + 1),
            totalChunks: session.totalChunks,
            currentChunk: chunkIndex,
            isResuming: true,
          })
        }
      }

      // Complete upload
      return this.completeUpload(uploadId, session.googleDriveToken)
    } catch (error) {
      console.error('Resume upload error:', error)
      throw error
    }
  }

  /**
   * Full upload workflow with progress tracking
   */
  async uploadFile(file, metadata, options = {}) {
    const {
      onProgress,
      googleDriveToken,
      concurrency = 3,
      enableResume = true,
    } = options

    try {
      // Initialize upload
      const session = await this.initializeUpload(file, metadata)
      const { uploadId } = session

      // Store session data in localStorage for resumability
      if (enableResume) {
        localStorage.setItem(
          `upload_${uploadId}`,
          JSON.stringify({
            uploadId,
            fileName: file.name,
            fileSize: file.size,
            totalChunks: session.totalChunks,
            googleDriveToken,
            metadata,
          })
        )
      }

      if (onProgress) {
        onProgress({
          uploadId,
          progress: 0,
          completedChunks: 0,
          totalChunks: session.totalChunks,
          status: 'initialized',
        })
      }

      // Upload all chunks
      await this.uploadAllChunks(uploadId, onProgress, concurrency)

      // Complete upload
      const result = await this.completeUpload(uploadId, googleDriveToken)

      // Clean up localStorage
      if (enableResume) {
        localStorage.removeItem(`upload_${uploadId}`)
      }

      return result
    } catch (error) {
      console.error('Upload file error:', error)
      throw error
    }
  }

  /**
   * Helper methods
   */
  updateChunkProgress(uploadId, chunkIndex, chunkProgress) {
    // You can implement chunk-level progress tracking here if needed
  }

  isRetryableError(error) {
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'NETWORK_ERROR' ||
      error.message?.includes('timeout') ||
      error.message?.includes('Network Error') ||
      (error.response && error.response.status >= 500)
    )
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get all active uploads
   */
  getActiveUploads() {
    return Array.from(this.activeUploads.values())
  }

  /**
   * Get resumable uploads from localStorage
   */
  getResumableUploads() {
    const resumableUploads = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('upload_')) {
        try {
          const uploadData = JSON.parse(localStorage.getItem(key))
          resumableUploads.push(uploadData)
        } catch (error) {
          console.error('Failed to parse resumable upload data:', error)
        }
      }
    }
    return resumableUploads
  }
}

// Create singleton instance
const chunkedUploadService = new ChunkedUploadService()

export default chunkedUploadService
