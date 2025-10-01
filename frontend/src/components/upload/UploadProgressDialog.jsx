import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { CheckCircle, Upload, AlertCircle, Loader2, X } from 'lucide-react'

const UploadProgressDialog = ({
  isOpen,
  onClose,
  uploadStatus,
  fileName,
  uploadResult,
  uploadError,
}) => {
  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Loader2 className='w-6 h-6 text-blue-500 animate-spin' />
      case 'success':
        return <CheckCircle className='w-6 h-6 text-green-500' />
      case 'error':
        return <AlertCircle className='w-6 h-6 text-red-500' />
      default:
        return <Upload className='w-6 h-6 text-gray-500' />
    }
  }

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading to Google Drive...'
      case 'success':
        return 'Upload Successful!'
      case 'error':
        return 'Upload Failed'
      default:
        return 'Preparing upload...'
    }
  }

  const getStatusDescription = () => {
    switch (uploadStatus) {
      case 'uploading':
        return `Uploading "${fileName}" to your Google Drive. Please don't close this tab or navigate away.`
      case 'success':
        return (
          uploadResult?.message ||
          'Your note has been successfully uploaded and is now available in the feed.'
        )
      case 'error':
        // Handle specific error types
        if (uploadError?.message?.includes('timeout')) {
          return 'Upload timed out due to network issues. This usually happens with large files or slow internet. Please try again with a better connection.'
        }
        if (uploadError?.message?.includes('Network Error')) {
          return 'Network connection lost during upload. Please check your internet connection and try again.'
        }
        return (
          uploadError?.message ||
          'Something went wrong during the upload. Please try again.'
        )
      default:
        return 'Getting ready to upload your file...'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className='sm:max-w-md'
        showCloseButton={uploadStatus !== 'uploading'}
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3'>
            {getStatusIcon()}
            {getStatusText()}
          </DialogTitle>
          <DialogDescription>{getStatusDescription()}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* File Info */}
          {fileName && (
            <div className='bg-muted p-3 rounded-lg'>
              <p className='text-sm font-medium truncate'>{fileName}</p>
            </div>
          )}
          {/* Upload Status */}
          {uploadStatus === 'uploading' && (
            <div className='flex items-center justify-center py-4'>
              <div className='flex items-center space-x-3'>
                <Loader2 className='w-5 h-5 text-blue-500 animate-spin' />
                <span className='text-sm text-muted-foreground'>
                  Uploading to Google Drive...
                </span>
              </div>
            </div>
          )}{' '}
          {/* Success Details */}
          {uploadStatus === 'success' && uploadResult?.driveInfo && (
            <div className='bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800'>
              <h4 className='font-medium text-green-800 dark:text-green-200 mb-2'>
                Google Drive Upload Details
              </h4>
              <div className='text-sm text-green-700 dark:text-green-300 space-y-1'>
                <p>
                  <strong>File Name:</strong> {uploadResult.driveInfo.fileName}
                </p>
                <p>
                  <strong>Storage:</strong> Your Personal Google Drive
                </p>
                {uploadResult.driveInfo.viewUrl && (
                  <a
                    href={uploadResult.driveInfo.viewUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                  >
                    View in Google Drive
                    <svg
                      className='w-3 h-3'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                      />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}
          {/* Error Details */}
          {uploadStatus === 'error' && uploadError && (
            <div className='bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800'>
              <h4 className='font-medium text-red-800 dark:text-red-200 mb-2'>
                {uploadError.message?.includes('timeout')
                  ? 'Upload Timeout'
                  : 'Upload Error'}
              </h4>
              <p className='text-sm text-red-700 dark:text-red-300'>
                {getStatusDescription()}
              </p>
              {uploadError.message?.includes('timeout') && (
                <div className='mt-3 text-xs text-red-600 dark:text-red-400'>
                  <p>
                    <strong>Tips to resolve:</strong>
                  </p>
                  <ul className='list-disc list-inside mt-1 space-y-1'>
                    <li>Check your internet connection</li>
                    <li>Try uploading during off-peak hours</li>
                    <li>Consider reducing file size if possible</li>
                    <li>Ensure you have stable Wi-Fi connection</li>
                  </ul>
                </div>
              )}
            </div>
          )}{' '}
          {/* Action Buttons */}
          <div className='flex justify-end gap-2 pt-4'>
            {uploadStatus === 'uploading' ? (
              <Button variant='outline' disabled>
                <Upload className='w-4 h-4 mr-2 animate-spin' />
                Uploading...
              </Button>
            ) : (
              <Button
                onClick={onClose}
                variant={uploadStatus === 'success' ? 'default' : 'outline'}
              >
                {uploadStatus === 'success' ? 'Done' : 'Close'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UploadProgressDialog
