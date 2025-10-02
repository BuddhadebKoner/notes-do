import React, { useState, useEffect } from 'react'
import ConfirmationDialog from '../ui/confirmation-dialog.jsx'
import { useDeleteNote } from '../../lib/react-query/queriesAndMutation.js'
import { Button } from '../ui/button.jsx'
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const DeleteNoteDialog = ({ isOpen, onClose, note, onSuccess = () => { } }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [googleDriveToken, setGoogleDriveToken] = useState(null)
  const { mutate: deleteNote } = useDeleteNote()

  // Get Google Drive token from localStorage when dialog opens
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('googleDriveToken')
      setGoogleDriveToken(token)

    }
  }, [isOpen])

  const handleConfirmDelete = async () => {
    if (!note?._id) {
      toast.error('Invalid note selected for deletion')
      return
    }

    setIsDeleting(true)

    try {
      await deleteNote(
        {
          noteId: note._id,
          googleDriveToken,
        },
        {
          onSuccess: data => {
            toast.success(data.message || 'Note deleted successfully!')

            // Show additional warnings if any
            if (data.warnings && data.warnings.length > 0) {
              data.warnings.forEach(warning => {
                toast.warning(warning)
              })
            }

            onSuccess()
            onClose()
          },
          onError: error => {
            console.error('Delete note error:', error)
            toast.error(
              error.message || 'Failed to delete note. Please try again.'
            )
          },
          onSettled: () => {
            setIsDeleting(false)
          },
        }
      )
    } catch (error) {
      console.error('Delete note error:', error)
      toast.error('Failed to delete note. Please try again.')
      setIsDeleting(false)
    }
  }

  const getDialogDescription = () => {
    if (!note) return 'Are you sure you want to delete this note?'

    let description = `Are you sure you want to delete "${note.title}"? `
    description += 'This action cannot be undone and will:\n\n'
    description += '• Remove the note from your uploaded notes\n'
    description += "• Remove it from all users' favorites and wishlists\n"
    description += '• Delete all comments and interactions\n'

    if (googleDriveToken) {
      description += '• Delete the file from your Google Drive\n'
      description += '\n✅ Google Drive connected - file will be deleted'
    } else {
      description += '• Keep the file in your Google Drive\n'
      description +=
        '\n⚠️ Google Drive not connected - file will remain in Drive'
    }

    return description
  }

  const DialogContent = () => (
    <div className='space-y-4'>
      <div className='text-sm text-muted-foreground whitespace-pre-line'>
        {getDialogDescription()}
      </div>

      {!googleDriveToken && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
          <div className='flex items-start gap-2'>
            <div className='text-yellow-600 text-xs font-medium'>
              ⚠️ Google Drive Not Connected
            </div>
          </div>
          <div className='text-xs text-yellow-700 mt-1'>
            To also delete the file from Google Drive, connect your account
            first.
          </div>
          <Button
            size='sm'
            variant='outline'
            className='mt-2 h-7 text-xs'
            onClick={() => {
              window.open('/google-drive-connect', '_blank')
            }}
          >
            <ExternalLink className='h-3 w-3 mr-1' />
            Connect Google Drive
          </Button>
        </div>
      )}

      {googleDriveToken && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
          <div className='flex items-center gap-2'>
            <div className='text-green-600 text-xs font-medium'>
              ✅ Google Drive Connected
            </div>
          </div>
          <div className='text-xs text-green-700 mt-1'>
            File will be deleted from both database and your Google Drive.
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ConfirmationDialog
      open={isOpen}
      onClose={onClose}
      onConfirm={handleConfirmDelete}
      title='Delete Note'
      description={<DialogContent />}
      confirmText={
        googleDriveToken ? 'Delete Note & Drive File' : 'Delete Note Only'
      }
      cancelText='Cancel'
      variant='destructive'
      loading={isDeleting}
    />
  )
}

export default DeleteNoteDialog
