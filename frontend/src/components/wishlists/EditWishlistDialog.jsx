import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'
import { Label } from '../ui/label.jsx'
import { Textarea } from '../ui/textarea.jsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.jsx'
import { Checkbox } from '../ui/checkbox.jsx'
import { useUpdateWishlist } from '../../lib/react-query/queriesAndMutation.js'
import { Loader2 } from 'lucide-react'

const colorOptions = [
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'red', label: 'Red', color: 'bg-red-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
  { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
  { value: 'gray', label: 'Gray', color: 'bg-gray-500' },
]

const EditWishlistDialog = ({ wishlist, open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    color: 'blue',
  })

  // Update wishlist mutation
  const {
    mutate: updateWishlist,
    isPending: isUpdating,
    error: updateError,
  } = useUpdateWishlist()

  // Initialize form data when wishlist changes
  useEffect(() => {
    if (wishlist) {
      setFormData({
        name: wishlist.name || '',
        description: wishlist.description || '',
        isPrivate: wishlist.isPrivate || false,
        color: wishlist.color || 'blue',
      })
    }
  }, [wishlist])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open && wishlist) {
      setFormData({
        name: wishlist.name || '',
        description: wishlist.description || '',
        isPrivate: wishlist.isPrivate || false,
        color: wishlist.color || 'blue',
      })
    }
  }, [open, wishlist])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = e => {
    e.preventDefault()

    if (!formData.name.trim() || !wishlist) {
      return
    }

    // Only send changed fields
    const updateData = {}
    if (formData.name !== wishlist.name) updateData.name = formData.name
    if (formData.description !== wishlist.description)
      updateData.description = formData.description
    if (formData.isPrivate !== wishlist.isPrivate)
      updateData.isPrivate = formData.isPrivate
    if (formData.color !== wishlist.color) updateData.color = formData.color

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      onOpenChange(false)
      return
    }

    updateWishlist(
      {
        wishlistId: wishlist._id,
        updateData,
      },
      {
        onSuccess: data => {
          if (data.success) {
            onOpenChange(false)
          }
        },
      }
    )
  }

  const selectedColor = colorOptions.find(c => c.value === formData.color)

  if (!wishlist) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <div className={`w-4 h-4 rounded-full ${selectedColor?.color}`} />
            Edit "{wishlist.name}"
          </DialogTitle>
          <DialogDescription>
            Update your wishlist details. Changes will be saved automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-name'>Wishlist Name *</Label>
              <Input
                id='edit-name'
                placeholder='e.g., Data Structures Notes'
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                maxLength={100}
                required
                className='focus:ring-purple-500 focus:border-purple-500'
              />
              <div className='text-xs text-muted-foreground'>
                {formData.name.length}/100 characters
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-color'>Color Theme</Label>
              <Select
                value={formData.color}
                onValueChange={value => handleInputChange('color', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-3 h-3 rounded-full ${color.color}`}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-description'>Description</Label>
            <Textarea
              id='edit-description'
              placeholder="Describe what kind of notes you'll save in this wishlist..."
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              maxLength={500}
              rows={3}
              className='focus:ring-purple-500 focus:border-purple-500'
            />
            <div className='text-xs text-muted-foreground'>
              {formData.description.length}/500 characters
            </div>
          </div>

          {/* Privacy Setting */}
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='edit-private'
              checked={formData.isPrivate}
              onCheckedChange={checked =>
                handleInputChange('isPrivate', checked)
              }
            />
            <Label htmlFor='edit-private' className='text-sm cursor-pointer'>
              Make this wishlist private (only visible to you)
            </Label>
          </div>

          {/* Wishlist Stats */}
          <div className='bg-muted/50 p-4 rounded-lg'>
            <div className='text-sm text-muted-foreground space-y-1'>
              <div className='flex justify-between'>
                <span>Total notes:</span>
                <span className='font-medium'>{wishlist.notesCount || 0}</span>
              </div>
              <div className='flex justify-between'>
                <span>Created:</span>
                <span>{new Date(wishlist.createdAt).toLocaleDateString()}</span>
              </div>
              {wishlist.updatedAt !== wishlist.createdAt && (
                <div className='flex justify-between'>
                  <span>Last updated:</span>
                  <span>
                    {new Date(wishlist.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Error Display */}
        {updateError && (
          <div className='text-red-500 text-sm bg-red-50 p-3 rounded-lg'>
            {updateError.message || 'Failed to update wishlist'}
          </div>
        )}

        <DialogFooter className='gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isUpdating}
            className='bg-purple-500 hover:bg-purple-600'
          >
            {isUpdating ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditWishlistDialog
