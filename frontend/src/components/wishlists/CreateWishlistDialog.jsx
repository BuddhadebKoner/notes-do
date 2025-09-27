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
import { Badge } from '../ui/badge.jsx'
import {
  useGetUploadedNotes,
  useCreateWishlist,
} from '../../lib/react-query/queriesAndMutation.js'
import { Loader2, Search, X } from 'lucide-react'

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

const CreateWishlistDialog = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    color: 'blue',
    noteIds: [],
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [notesPage, setNotesPage] = useState(1)
  const [selectedNotes, setSelectedNotes] = useState([])

  // Fetch user's uploaded notes with pagination
  const {
    data: notesData,
    isLoading: notesLoading,
    error: notesError,
  } = useGetUploadedNotes(notesPage, 12, 'uploadDate', 'desc')

  // Create wishlist mutation
  const {
    mutate: createWishlist,
    isPending: isCreating,
    error: createError,
  } = useCreateWishlist()

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        description: '',
        isPrivate: false,
        color: 'blue',
        noteIds: [],
      })
      setSelectedNotes([])
      setSearchTerm('')
      setNotesPage(1)
    }
  }, [open])

  // Filter notes based on search term
  const filteredNotes =
    notesData?.success && notesData.data.notes
      ? notesData.data.notes.filter(
          note =>
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.subject?.name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            note.academic?.university
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
        )
      : []

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNoteSelection = (note, isSelected) => {
    if (isSelected) {
      setSelectedNotes(prev => [...prev, note])
      setFormData(prev => ({
        ...prev,
        noteIds: [...prev.noteIds, note._id],
      }))
    } else {
      setSelectedNotes(prev => prev.filter(n => n._id !== note._id))
      setFormData(prev => ({
        ...prev,
        noteIds: prev.noteIds.filter(id => id !== note._id),
      }))
    }
  }

  const removeSelectedNote = noteId => {
    setSelectedNotes(prev => prev.filter(n => n._id !== noteId))
    setFormData(prev => ({
      ...prev,
      noteIds: prev.noteIds.filter(id => id !== noteId),
    }))
  }

  const handleSubmit = e => {
    e.preventDefault()

    if (!formData.name.trim()) {
      return
    }

    createWishlist(formData, {
      onSuccess: data => {
        if (data.success) {
          onOpenChange(false)
        }
      },
    })
  }

  const selectedColor = colorOptions.find(c => c.value === formData.color)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <div className={`w-4 h-4 rounded-full ${selectedColor?.color}`} />
            Create New Wishlist
          </DialogTitle>
          <DialogDescription>
            Create a new wishlist to organize your favorite notes. You can
            create up to 10 wishlists.
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-hidden flex flex-col'>
          <form
            onSubmit={handleSubmit}
            className='flex-1 flex flex-col space-y-4'
          >
            {/* Basic Information */}
            <div className='flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Wishlist Name *</Label>
                <Input
                  id='name'
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
                <Label htmlFor='color'>Color Theme</Label>
                <Select
                  value={formData.color}
                  onValueChange={value => handleInputChange('color', value)}
                >
                  <SelectTrigger className='focus:ring-purple-500 focus:border-purple-500'>
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

            <div className='flex-shrink-0 space-y-2'>
              <Label htmlFor='description'>Description (Optional)</Label>
              <Textarea
                id='description'
                placeholder="Describe what kind of notes you'll save in this wishlist..."
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                maxLength={500}
                rows={3}
              />
              <div className='text-xs text-muted-foreground'>
                {formData.description.length}/500 characters
              </div>
            </div>

            {/* Privacy Setting */}
            <div className='flex-shrink-0 flex items-center space-x-2'>
              <Checkbox
                id='private'
                checked={formData.isPrivate}
                onCheckedChange={checked =>
                  handleInputChange('isPrivate', checked)
                }
              />
              <Label htmlFor='private' className='text-sm'>
                Make this wishlist private (only visible to you)
              </Label>
            </div>

            {/* Selected Notes Display */}
            {selectedNotes.length > 0 && (
              <div className='flex-shrink-0 space-y-2'>
                <Label>Selected Notes ({selectedNotes.length})</Label>
                <div className='max-h-32 overflow-y-auto border rounded-lg p-3 space-y-2'>
                  {selectedNotes.map(note => (
                    <div
                      key={note._id}
                      className='flex items-center justify-between bg-muted p-2 rounded'
                    >
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>
                          {note.title}
                        </p>
                        <p className='text-xs text-muted-foreground truncate'>
                          {note.subject?.name} • {note.academic?.university}
                        </p>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeSelectedNote(note._id)}
                        className='text-red-500 hover:text-red-700 flex-shrink-0'
                      >
                        <X className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Selection */}
            <div className='flex-1 flex flex-col space-y-4'>
              <div>
                <Label>Add Notes to Wishlist (Optional)</Label>
                <p className='text-sm text-muted-foreground mb-3'>
                  Select notes from your uploads to add to this wishlist. You
                  can add more notes later.
                </p>

                {/* Search Notes */}
                <div className='relative'>
                  <Search className='w-4 h-4 absolute left-3 top-3 text-muted-foreground' />
                  <Input
                    placeholder='Search your notes...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              {/* Notes List */}
              <div className='flex-1 overflow-y-auto border rounded-lg'>
                {notesLoading ? (
                  <div className='flex items-center justify-center p-8'>
                    <Loader2 className='w-6 h-6 animate-spin' />
                    <span className='ml-2'>Loading your notes...</span>
                  </div>
                ) : notesError ? (
                  <div className='p-4 text-center text-red-500'>
                    Error loading notes: {notesError.message}
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className='p-8 text-center text-muted-foreground'>
                    {searchTerm
                      ? 'No notes found matching your search.'
                      : "You haven't uploaded any notes yet."}
                  </div>
                ) : (
                  <div className='divide-y'>
                    {filteredNotes.map(note => {
                      const isSelected = selectedNotes.some(
                        n => n._id === note._id
                      )
                      return (
                        <div key={note._id} className='p-4 hover:bg-muted/50'>
                          <div className='flex items-start space-x-3'>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={checked =>
                                handleNoteSelection(note, checked)
                              }
                            />
                            <div className='flex-1 min-w-0'>
                              <h4 className='text-sm font-medium truncate'>
                                {note.title}
                              </h4>
                              <p className='text-xs text-muted-foreground truncate mt-1'>
                                {note.description}
                              </p>
                              <div className='flex items-center gap-2 mt-2'>
                                <Badge variant='outline' className='text-xs'>
                                  {note.subject?.name}
                                </Badge>
                                <Badge variant='secondary' className='text-xs'>
                                  {note.academic?.university}
                                </Badge>
                                <span className='text-xs text-muted-foreground'>
                                  {new Date(
                                    note.uploadDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {notesData?.success &&
                notesData.data.pagination &&
                notesData.data.pagination.totalPages > 1 && (
                  <div className='flex-shrink-0 flex justify-between items-center px-4 py-2 border-t bg-muted/30'>
                    <div className='text-xs text-muted-foreground'>
                      Page {notesData.data.pagination.currentPage} of{' '}
                      {notesData.data.pagination.totalPages}
                    </div>
                    <div className='flex space-x-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setNotesPage(prev => Math.max(prev - 1, 1))
                        }
                        disabled={
                          !notesData.data.pagination.hasPrevPage || notesLoading
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => setNotesPage(prev => prev + 1)}
                        disabled={
                          !notesData.data.pagination.hasNextPage || notesLoading
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          </form>
        </div>

        {/* Error Display */}
        {createError && (
          <div className='text-red-500 text-sm'>
            {createError.message || 'Failed to create wishlist'}
          </div>
        )}

        <DialogFooter className='gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isCreating}
            className='bg-purple-500 hover:bg-purple-600 min-w-[140px]'
          >
            {isCreating ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
                Creating...
              </>
            ) : (
              'Create Wishlist'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateWishlistDialog
