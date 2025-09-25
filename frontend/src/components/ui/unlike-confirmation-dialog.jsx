import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog'
import { Button } from './button'
import { Heart, AlertTriangle } from 'lucide-react'

const UnlikeConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  noteTitle = 'this note',
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='flex items-center gap-3 mb-2'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
              <AlertTriangle className='h-6 w-6 text-red-600' />
            </div>
            <div>
              <DialogTitle className='text-lg font-semibold text-gray-900'>
                Remove Like
              </DialogTitle>
              <DialogDescription className='text-sm text-gray-600 mt-1'>
                Are you sure you want to unlike "{noteTitle}"?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='py-4'>
          <div className='flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg'>
            <Heart className='h-4 w-4 text-red-500' />
            <span>
              This will remove the note from your liked items and decrease the
              like count.
            </span>
          </div>
        </div>

        <DialogFooter className='flex gap-3 sm:space-x-0'>
          <Button
            variant='outline'
            onClick={onClose}
            disabled={isLoading}
            className='flex-1'
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={onConfirm}
            disabled={isLoading}
            className='flex-1'
          >
            {isLoading ? (
              <div className='flex items-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                Removing...
              </div>
            ) : (
              <>
                <Heart className='h-4 w-4 mr-2' />
                Remove Like
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UnlikeConfirmationDialog
