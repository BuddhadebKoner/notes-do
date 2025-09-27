import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'
import { Label } from '../ui/label.jsx'
import { Badge } from '../ui/badge.jsx'
import { Copy, Check, Share2, Mail, MessageCircle } from 'lucide-react'

const ShareNoteDialog = ({ isOpen, onClose, note }) => {
  const [copied, setCopied] = useState(false)

  const shareUrl = note ? `${window.location.origin}/notes/${note._id}` : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleEmailShare = () => {
    const subject = `Check out this note: ${note?.title}`
    const body = `I thought you might find this note interesting:\n\n${note?.title}\n\n${shareUrl}`
    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    )
  }

  const handleWhatsAppShare = () => {
    const text = `Check out this note: ${note?.title}\n${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)
  }

  const handleTwitterShare = () => {
    const text = `Check out this note: ${note?.title}`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[450px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Share2 className='h-5 w-5' />
            Share Note
          </DialogTitle>
          <DialogDescription>
            Share "{note?.title}" with others
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Share Link */}
          <div className='space-y-2'>
            <Label>Share Link</Label>
            <div className='flex gap-2'>
              <Input value={shareUrl} readOnly className='flex-1' />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleCopyLink}
                className='px-3'
              >
                {copied ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className='space-y-3'>
            <Label>Share via</Label>
            <div className='grid grid-cols-2 gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={handleEmailShare}
                className='justify-center gap-2'
              >
                <Mail className='h-4 w-4' />
                Email
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={handleWhatsAppShare}
                className='justify-center gap-2'
              >
                <MessageCircle className='h-4 w-4' />
                WhatsApp
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={handleTwitterShare}
                className='justify-center gap-2 col-span-2'
              >
                <Share2 className='h-4 w-4' />
                Twitter
              </Button>
            </div>
          </div>

          {/* Note Info */}
          <div className='p-3 bg-muted rounded-lg'>
            <h4 className='font-medium text-sm mb-2'>{note?.title}</h4>
            <div className='flex items-center gap-2'>
              <Badge
                variant={note?.visibility?.isPublic ? 'default' : 'secondary'}
              >
                {note?.visibility?.isPublic ? 'Public' : 'Private'}
              </Badge>
              <span className='text-xs text-muted-foreground'>
                Uploaded:{' '}
                {note?.uploadDate
                  ? new Date(note.uploadDate).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShareNoteDialog
