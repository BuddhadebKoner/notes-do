import React, { useState } from 'react'
import { useGetUploadedNotes } from '../../../lib/react-query/queriesAndMutation.js'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card.jsx'
import { Button } from '../../../components/ui/button.jsx'
import { Badge } from '../../../components/ui/badge.jsx'
import { Checkbox } from '../../../components/ui/checkbox.jsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select.jsx'
import {
  Edit,
  Share2,
  BarChart3,
  Eye,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import EditNoteDialog from '../../../components/notes/EditNoteDialog.jsx'
import ShareNoteDialog from '../../../components/notes/ShareNoteDialog.jsx'
import AnalysisDialog from '../../../components/notes/AnalysisDialog.jsx'
import DeleteNoteDialog from '../../../components/notes/DeleteNoteDialog.jsx'
import GoogleDriveStatus from '../../../components/google/GoogleDriveStatus.jsx'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

const UploadedNotes = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('uploadDate')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedNotes, setSelectedNotes] = useState([])
  const [editDialog, setEditDialog] = useState({ isOpen: false, note: null })
  const [shareDialog, setShareDialog] = useState({ isOpen: false, note: null })
  const [analysisDialog, setAnalysisDialog] = useState({
    isOpen: false,
    note: null,
  })
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    note: null,
  })
  const limit = 10

  const { data, isLoading, error } = useGetUploadedNotes(
    currentPage,
    limit,
    sortBy,
    sortOrder
  )

  // Handle checkbox selection
  const handleSelectNote = (noteId, isChecked) => {
    if (isChecked) {
      setSelectedNotes(prev => [...prev, noteId])
    } else {
      setSelectedNotes(prev => prev.filter(id => id !== noteId))
    }
  }

  // Handle select all
  const handleSelectAll = isChecked => {
    if (isChecked && data?.success) {
      setSelectedNotes(data.data.notes.map(note => note._id))
    } else {
      setSelectedNotes([])
    }
  }

  // Handle dialog actions
  const handleEdit = note => {
    setEditDialog({ isOpen: true, note })
  }

  const handleShare = note => {
    setShareDialog({ isOpen: true, note })
  }

  const handleAnalysis = note => {
    setAnalysisDialog({ isOpen: true, note })
  }

  const handleDelete = note => {
    setDeleteDialog({ isOpen: true, note })
  }

  const handleBulkDelete = () => {
    if (selectedNotes.length === 0) return

    // For bulk delete, we'll show a confirmation for all selected notes
    toast.info(
      `Bulk delete feature coming soon. Please delete notes individually for now.`
    )
  }

  const NoteListItem = ({ note }) => {
    const isSelected = selectedNotes.includes(note._id)

    return (
      <div
        className={`flex items-center p-4 border-b hover:bg-muted/30 transition-colors ${isSelected ? 'bg-muted/50' : ''}`}
      >
        {/* Checkbox */}
        <div className='mr-4'>
          <Checkbox
            checked={isSelected}
            onCheckedChange={checked => handleSelectNote(note._id, checked)}
          />
        </div>

        {/* Note Title */}
        <div className='flex-1 min-w-0'>
          <h3 className='text-sm font-medium text-gray-900 truncate'>
            {note.title}
          </h3>
          <div className='flex items-center gap-3 mt-1'>
            <Badge
              variant={note.visibility === 'public' ? 'default' : 'secondary'}
              className='text-xs'
            >
              {note.visibility === 'public' ? 'Public' : 'Private'}
            </Badge>
            <span className='text-xs text-muted-foreground'>
              {new Date(note.uploadDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2 ml-4'>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => handleEdit(note)}
            className='h-8 w-8 p-0'
            title='Edit'
          >
            <Edit className='h-4 w-4' />
          </Button>

          <Button
            size='sm'
            variant='ghost'
            onClick={() => handleShare(note)}
            className='h-8 w-8 p-0'
            title='Share'
          >
            <Share2 className='h-4 w-4' />
          </Button>

          <Button
            size='sm'
            variant='ghost'
            asChild
            className='h-8 w-8 p-0'
            title='View'
          >
            <a
              href={note.file?.viewUrl}
              target='_blank'
              rel='noopener noreferrer'
            >
              <Eye className='h-4 w-4' />
            </a>
          </Button>

          <Button
            size='sm'
            variant='ghost'
            onClick={() => handleAnalysis(note)}
            className='h-8 w-8 p-0'
            title='Analytics'
          >
            <BarChart3 className='h-4 w-4' />
          </Button>

          <Button
            size='sm'
            variant='ghost'
            onClick={() => handleDelete(note)}
            className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
            title='Delete'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>
    )
  }

  const Pagination = ({ pagination }) => {
    if (!pagination || pagination.totalPages <= 1) return null

    return (
      <div className='flex justify-between items-center mt-6'>
        <div className='text-sm text-muted-foreground'>
          Page {pagination.currentPage} of {pagination.totalPages} •{' '}
          {pagination.totalNotes} notes total
        </div>
        <div className='flex space-x-2'>
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrevPage}
            variant='outline'
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-6 bg-gray-200 rounded w-1/4'></div>
            <div className='space-y-3'>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded w-3/4'></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className='text-center py-8'>
          <p className='text-destructive mb-4'>
            Error loading your notes: {error.message}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Google Drive Status */}
      <GoogleDriveStatus />

      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle className='text-2xl'>My Uploaded Notes</CardTitle>
            <div className='flex space-x-4'>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className='w-40'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='uploadDate'>Upload Date</SelectItem>
                  <SelectItem value='title'>Title</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className='w-32'>
                  <SelectValue placeholder='Order' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='desc'>Descending</SelectItem>
                  <SelectItem value='asc'>Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {data?.success && (
            <div className='flex justify-between items-center'>
              <p className='text-muted-foreground'>
                {data.data.pagination.totalNotes} notes uploaded
                {selectedNotes.length > 0 && (
                  <span className='ml-2 text-primary'>
                    • {selectedNotes.length} selected
                  </span>
                )}
              </p>
              {selectedNotes.length > 0 && (
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={handleBulkDelete}
                    className='text-red-600 border-red-200 hover:bg-red-50'
                  >
                    Delete Selected ({selectedNotes.length})
                  </Button>
                  <Button size='sm' variant='outline'>
                    Change Visibility
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Notes List */}
      {data?.success && data.data.notes.length > 0 ? (
        <div>
          <Card>
            <CardContent className='p-0'>
              {/* Header Row */}
              <div className='flex items-center p-4 border-b bg-muted/20'>
                <div className='mr-4'>
                  <Checkbox
                    checked={selectedNotes.length === data.data.notes.length}
                    onCheckedChange={handleSelectAll}
                    indeterminate={
                      selectedNotes.length > 0 &&
                      selectedNotes.length < data.data.notes.length
                        ? true
                        : undefined
                    }
                  />
                </div>
                <div className='flex-1'>
                  <span className='text-sm font-medium'>Note Title</span>
                </div>
                <div className='w-24 text-center'>
                  <span className='text-sm font-medium'>Actions</span>
                </div>
              </div>

              {/* Notes List */}
              <div>
                {data.data.notes.map(note => (
                  <NoteListItem key={note._id} note={note} />
                ))}
              </div>
            </CardContent>
          </Card>
          <Pagination pagination={data.data.pagination} />
        </div>
      ) : (
        <Card>
          <CardContent className='text-center py-12'>
            <div className='text-6xl mb-4'>📄</div>
            <h3 className='text-xl font-semibold mb-2'>
              No notes uploaded yet
            </h3>
            <p className='text-muted-foreground mb-6'>
              Start sharing your knowledge by uploading your first note!
            </p>
            <Button size='lg' asChild>
              <Link to='/upload'>Upload Your First Note</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog Components */}
      <EditNoteDialog
        isOpen={editDialog.isOpen}
        onClose={() => setEditDialog({ isOpen: false, note: null })}
        note={editDialog.note}
      />

      <ShareNoteDialog
        isOpen={shareDialog.isOpen}
        onClose={() => setShareDialog({ isOpen: false, note: null })}
        note={shareDialog.note}
      />

      <AnalysisDialog
        isOpen={analysisDialog.isOpen}
        onClose={() => setAnalysisDialog({ isOpen: false, note: null })}
        note={analysisDialog.note}
      />

      <DeleteNoteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, note: null })}
        note={deleteDialog.note}
        onSuccess={() => {
          // Remove from selectedNotes if it was selected
          setSelectedNotes(prev =>
            prev.filter(id => id !== deleteDialog.note?._id)
          )
        }}
      />
    </div>
  )
}

export default UploadedNotes
