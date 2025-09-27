import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx'
import { Button } from '../ui/button.jsx'
import { Badge } from '../ui/badge.jsx'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.jsx'
import { Card, CardContent } from '../ui/card.jsx'
import { Input } from '../ui/input.jsx'
import { Checkbox } from '../ui/checkbox.jsx'
import { Separator } from '../ui/separator.jsx'
import {
  useGetWishlistById,
  useRemoveNotesFromWishlist,
  useGetUploadedNotes,
  useAddNotesToWishlist,
} from '../../lib/react-query/queriesAndMutation.js'
import {
  FolderOpen,
  Lock,
  Globe,
  Calendar,
  Download,
  Eye,
  Heart,
  Trash2,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  pink: 'bg-pink-500',
  gray: 'bg-gray-500',
}

const WishlistDetailsDialog = ({ wishlist, open, onOpenChange }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedNotes, setSelectedNotes] = useState([])
  const [showAddNotes, setShowAddNotes] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [notesPage, setNotesPage] = useState(1)
  const [selectedNotesToAdd, setSelectedNotesToAdd] = useState([])
  const limit = 10

  // Fetch wishlist details with notes
  const { data, isLoading, error } = useGetWishlistById(
    wishlist?._id,
    currentPage,
    limit
  )

  // Fetch user's uploaded notes for adding
  const {
    data: availableNotesData,
    isLoading: availableNotesLoading,
    error: availableNotesError,
  } = useGetUploadedNotes(notesPage, 12, 'uploadDate', 'desc')

  // Remove notes mutation
  const { mutate: removeNotes, isPending: isRemoving } =
    useRemoveNotesFromWishlist()

  // Add notes mutation
  const { mutate: addNotesToWishlist, isPending: isAdding } =
    useAddNotesToWishlist()

  const wishlistData = data?.success ? data.data.wishlist : null
  const notes = data?.success ? data.data.notes : []
  const pagination = data?.success ? data.data.pagination : null

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setShowAddNotes(false)
      setSelectedNotes([])
      setSelectedNotesToAdd([])
      setSearchTerm('')
      setNotesPage(1)
      setCurrentPage(1)
    }
  }, [open])

  // Filter available notes based on search term and exclude notes already in wishlist
  const filteredAvailableNotes =
    availableNotesData?.success && availableNotesData.data.notes
      ? availableNotesData.data.notes.filter(note => {
          // Filter by search term
          const matchesSearch =
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.subject?.name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            note.academic?.university
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())

          // Exclude notes already in wishlist
          const notInWishlist = !notes.some(wNote => wNote._id === note._id)

          return matchesSearch && notInWishlist
        })
      : []

  const handleRemoveNotes = () => {
    if (selectedNotes.length > 0 && wishlist?._id) {
      removeNotes(
        {
          wishlistId: wishlist._id,
          noteIds: selectedNotes,
        },
        {
          onSuccess: () => {
            setSelectedNotes([])
          },
        }
      )
    }
  }

  const toggleNoteSelection = noteId => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }

  const handleNoteSelectionForAdd = (note, isSelected) => {
    if (isSelected) {
      setSelectedNotesToAdd(prev => [...prev, note])
    } else {
      setSelectedNotesToAdd(prev => prev.filter(n => n._id !== note._id))
    }
  }

  const handleAddNotesToWishlist = () => {
    if (selectedNotesToAdd.length === 0 || !wishlist?._id) {
      return
    }

    const noteIds = selectedNotesToAdd.map(note => note._id)

    addNotesToWishlist(
      {
        wishlistId: wishlist._id,
        noteIds: noteIds,
      },
      {
        onSuccess: data => {
          if (data.success) {
            setSelectedNotesToAdd([])
            setSearchTerm('')
            setNotesPage(1)
          }
        },
      }
    )
  }

  const NoteCard = ({ note, showCheckbox = false }) => {
    const isSelected = selectedNotes.includes(note._id)

    return (
      <Card
        className={`hover:shadow-sm transition-shadow ${isSelected ? 'ring-1 ring-black' : ''}`}
      >
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleNoteSelection(note._id)}
                className='mt-1'
              />
            )}

            <div className='flex-1 min-w-0'>
              <div className='flex items-start justify-between mb-2'>
                <h4 className='font-medium text-sm line-clamp-2 pr-2'>
                  {note.title}
                </h4>
                {note.file?.viewUrl && (
                  <Button
                    size='sm'
                    variant='outline'
                    className='h-7 px-2 text-xs shrink-0'
                    asChild
                  >
                    <a
                      href={note.file.viewUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <ExternalLink className='w-3 h-3 mr-1' />
                      View
                    </a>
                  </Button>
                )}
              </div>

              {note.description && (
                <p className='text-xs text-muted-foreground mb-3 line-clamp-2'>
                  {note.description}
                </p>
              )}

              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <div className='flex items-center gap-3'>
                  {note.subject?.name && (
                    <Badge variant='outline' className='text-xs'>
                      {note.subject.name}
                    </Badge>
                  )}
                  {note.social && (
                    <div className='flex items-center gap-2'>
                      <span className='flex items-center gap-1'>
                        <Eye className='w-3 h-3' />
                        {note.social.views || 0}
                      </span>
                      <span className='flex items-center gap-1'>
                        <Download className='w-3 h-3' />
                        {note.social.downloads || 0}
                      </span>
                    </div>
                  )}
                </div>
                <span>Added {new Date(note.addedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const Pagination = ({ pagination }) => {
    if (!pagination || pagination.totalPages <= 1) return null

    return (
      <div className='flex justify-between items-center mt-6'>
        <div className='text-sm text-muted-foreground'>
          Page {pagination.currentPage} of {pagination.totalPages} •{' '}
          {pagination.totalNotes} notes
        </div>
        <div className='flex gap-2'>
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrevPage}
            variant='outline'
            size='sm'
          >
            <ChevronLeft className='w-4 h-4' />
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!pagination.hasNextPage}
            variant='default'
            size='sm'
          >
            Next
            <ChevronRight className='w-4 h-4' />
          </Button>
        </div>
      </div>
    )
  }

  if (!wishlist) return null

  const colorClass = colorClasses[wishlist.color] || colorClasses.blue

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <div className={`w-4 h-4 rounded-full ${colorClass}`} />
            {wishlistData?.name || wishlist.name}
            {wishlistData?.isPrivate || wishlist.isPrivate ? (
              <Lock className='w-4 h-4 text-muted-foreground' />
            ) : (
              <Globe className='w-4 h-4 text-muted-foreground' />
            )}
          </DialogTitle>
          {(wishlistData?.description || wishlist.description) && (
            <DialogDescription>
              {wishlistData?.description || wishlist.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className='space-y-4'>
          {/* Stats */}
          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <span className='flex items-center gap-1'>
              <FolderOpen className='w-4 h-4' />
              {wishlistData?.totalNotes || wishlist.notesCount || 0} notes
            </span>
            <span className='flex items-center gap-1'>
              <Calendar className='w-4 h-4' />
              Created{' '}
              {new Date(
                wishlistData?.createdAt || wishlist.createdAt
              ).toLocaleDateString()}
            </span>
          </div>

          <Separator />

          {/* Toggle View */}
          <div className='flex items-center justify-between'>
            <div className='flex gap-2'>
              <Button
                onClick={() => setShowAddNotes(!showAddNotes)}
                variant={showAddNotes ? 'default' : 'outline'}
                size='sm'
              >
                <Plus className='w-4 h-4 mr-2' />
                {showAddNotes ? 'Hide Add Notes' : 'Add Notes'}
              </Button>
              {selectedNotes.length > 0 && (
                <Button
                  onClick={handleRemoveNotes}
                  disabled={isRemoving}
                  variant='destructive'
                  size='sm'
                >
                  {isRemoving ? (
                    <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  ) : (
                    <Trash2 className='w-4 h-4 mr-2' />
                  )}
                  Remove ({selectedNotes.length})
                </Button>
              )}
            </div>
            {selectedNotes.length > 0 && (
              <Button
                onClick={() => setSelectedNotes([])}
                variant='outline'
                size='sm'
              >
                Clear Selection
              </Button>
            )}
          </div>

          {/* Add Notes Section */}
          {showAddNotes && (
            <Card>
              <CardContent className='p-4 space-y-4'>
                <div className='flex items-center justify-between'>
                  <h4 className='font-medium'>Add Notes to Wishlist</h4>
                  {selectedNotesToAdd.length > 0 && (
                    <Badge variant='secondary'>
                      {selectedNotesToAdd.length} selected
                    </Badge>
                  )}
                </div>

                {/* Search */}
                <div className='relative'>
                  <Search className='w-4 h-4 absolute left-3 top-3 text-muted-foreground' />
                  <Input
                    placeholder='Search your notes...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>

                {/* Available Notes */}
                <div className='max-h-60 overflow-y-auto border rounded-lg'>
                  {availableNotesLoading ? (
                    <div className='flex items-center justify-center p-8'>
                      <Loader2 className='w-6 h-6 animate-spin mr-2' />
                      Loading notes...
                    </div>
                  ) : filteredAvailableNotes.length === 0 ? (
                    <div className='p-8 text-center text-muted-foreground'>
                      <FolderOpen className='w-12 h-12 mx-auto mb-4' />
                      <p>
                        {searchTerm
                          ? 'No matching notes found'
                          : 'No available notes'}
                      </p>
                    </div>
                  ) : (
                    <div className='divide-y'>
                      {filteredAvailableNotes.map(note => {
                        const isSelected = selectedNotesToAdd.some(
                          n => n._id === note._id
                        )
                        return (
                          <div key={note._id} className='p-3 hover:bg-muted/50'>
                            <div className='flex items-start gap-3'>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={checked =>
                                  handleNoteSelectionForAdd(note, checked)
                                }
                                className='mt-1'
                              />
                              <div className='flex-1 min-w-0'>
                                <h5 className='font-medium text-sm line-clamp-1'>
                                  {note.title}
                                </h5>
                                {note.description && (
                                  <p className='text-xs text-muted-foreground line-clamp-1 mt-1'>
                                    {note.description}
                                  </p>
                                )}
                                <div className='flex items-center gap-2 mt-2'>
                                  {note.subject?.name && (
                                    <Badge
                                      variant='outline'
                                      className='text-xs'
                                    >
                                      {note.subject.name}
                                    </Badge>
                                  )}
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

                {/* Add Notes Button */}
                {selectedNotesToAdd.length > 0 && (
                  <Button
                    onClick={handleAddNotesToWishlist}
                    disabled={isAdding}
                    className='w-full'
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin mr-2' />
                        Adding Notes...
                      </>
                    ) : (
                      <>
                        <Plus className='w-4 h-4 mr-2' />
                        Add {selectedNotesToAdd.length} Note
                        {selectedNotesToAdd.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Wishlist Notes */}
          <div className='max-h-96 overflow-y-auto'>
            {isLoading ? (
              <div className='space-y-3'>
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className='p-4'>
                      <div className='animate-pulse space-y-2'>
                        <div className='h-4 bg-muted rounded w-3/4' />
                        <div className='h-3 bg-muted rounded w-1/2' />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className='p-6 text-center text-destructive'>
                  Error loading wishlist: {error.message}
                </CardContent>
              </Card>
            ) : notes.length > 0 ? (
              <div className='space-y-3'>
                {notes.map(note => (
                  <NoteCard key={note._id} note={note} showCheckbox={true} />
                ))}
                <Pagination pagination={pagination} />
              </div>
            ) : (
              <Card>
                <CardContent className='p-8 text-center'>
                  <FolderOpen className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
                  <h3 className='font-medium mb-2'>
                    No notes in this wishlist
                  </h3>
                  <p className='text-muted-foreground mb-4'>
                    This wishlist is empty. Add some notes to get started!
                  </p>
                  <Button onClick={() => setShowAddNotes(true)}>
                    <Plus className='w-4 h-4 mr-2' />
                    Add Notes
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default WishlistDetailsDialog
