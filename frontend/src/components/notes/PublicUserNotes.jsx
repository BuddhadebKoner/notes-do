import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import NoteCard from './NoteCard'
import NoteCardSkeleton from './NoteCardSkeleton'
import { useGetPublicUserNotes } from '../../lib/react-query/queriesAndMutation'
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Lock,
  School,
  AlertCircle,
} from 'lucide-react'

const PublicUserNotes = ({ username, hasAccess, profileVisibility }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('uploadDate')
  const [sortOrder, setSortOrder] = useState('desc')
  const notesPerPage = 12

  // Fetch public user notes
  const {
    data: notesResponse,
    isLoading,
    error,
    isFetching,
  } = useGetPublicUserNotes(username, {
    page: currentPage,
    limit: notesPerPage,
    sortBy,
    sortOrder,
  })

  const notes = notesResponse?.data?.notes || []
  const pagination = notesResponse?.data?.pagination || {}
  const user = notesResponse?.data?.user || {}

  // Handle page navigation
  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Handle sort change
  const handleSortChange = newSortBy => {
    setSortBy(newSortBy)
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  // Handle sort order toggle
  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    setCurrentPage(1)
  }

  // Show access denied message
  if (!hasAccess && profileVisibility === 'private') {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <Lock className='h-16 w-16 mx-auto mb-4 text-gray-400' />
          <h3 className='text-xl font-semibold mb-2'>Private Notes</h3>
          <p className='text-gray-600'>
            This user's notes are private and not accessible to the public.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!hasAccess && profileVisibility === 'university') {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <School className='h-16 w-16 mx-auto mb-4 text-gray-400' />
          <h3 className='text-xl font-semibold mb-2'>University-Only Notes</h3>
          <p className='text-gray-600'>
            This user's notes are only visible to students from their
            university.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error && !isLoading) {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <AlertCircle className='h-16 w-16 mx-auto mb-4 text-red-400' />
          <h3 className='text-xl font-semibold mb-2'>Error Loading Notes</h3>
          <p className='text-gray-600 mb-4'>
            {error.message || 'Failed to load notes. Please try again later.'}
          </p>
          <Button onClick={() => window.location.reload()} variant='outline'>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <CardTitle className='flex items-center gap-2'>
            <BookOpen className='h-5 w-5' />
            {user.name ? `${user.name}'s Notes` : 'Notes'}
            {pagination.totalNotes > 0 && (
              <Badge variant='secondary' className='ml-2'>
                {pagination.totalNotes}
              </Badge>
            )}
          </CardTitle>

          {/* Controls */}
          {notes.length > 0 && (
            <div className='flex items-center gap-2'>
              {/* Sort Controls */}
              <div className='flex items-center gap-2'>
                <select
                  value={sortBy}
                  onChange={e => handleSortChange(e.target.value)}
                  className='text-sm border rounded px-2 py-1 bg-white'
                >
                  <option value='uploadDate'>Upload Date</option>
                  <option value='title'>Title</option>
                  <option value='social.views'>Views</option>
                  <option value='social.downloads'>Downloads</option>
                </select>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleSortOrderToggle}
                  className='p-2'
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4'>
            {Array.from({ length: notesPerPage }).map((_, index) => (
              <NoteCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && notes.length === 0 && (
          <div className='text-center py-12'>
            <BookOpen className='h-16 w-16 mx-auto mb-4 text-gray-400' />
            <h3 className='text-xl font-semibold mb-2'>No Notes Found</h3>
            <p className='text-gray-600'>
              {user.name || 'This user'} hasn't uploaded any public notes yet.
            </p>
          </div>
        )}

        {/* Notes Grid */}
        {!isLoading && notes.length > 0 && (
          <>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4'>
              {notes.map(note => (
                <NoteCard
                  key={note._id}
                  note={note}
                  onView={() => {
                    // Handle view action - navigate to note details
                    window.open(note.viewUrl, '_blank')
                  }}
                  onDownload={() => {
                    // Handle download action
                    if (note.downloadUrl) {
                      window.open(note.downloadUrl, '_blank')
                    }
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className='flex items-center justify-between mt-8 pt-6 border-t'>
                <div className='text-sm text-gray-600'>
                  Showing {(currentPage - 1) * notesPerPage + 1} to{' '}
                  {Math.min(currentPage * notesPerPage, pagination.totalNotes)}{' '}
                  of {pagination.totalNotes} notes
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrevPage || isFetching}
                  >
                    <ChevronLeft className='h-4 w-4' />
                    Previous
                  </Button>

                  <div className='flex items-center gap-1'>
                    {/* Page Numbers */}
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={
                              currentPage === pageNum ? 'default' : 'outline'
                            }
                            size='sm'
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isFetching}
                            className={
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : ''
                            }
                          >
                            {pageNum}
                          </Button>
                        )
                      }
                    )}
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNextPage || isFetching}
                  >
                    Next
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading overlay during pagination */}
        {isFetching && !isLoading && (
          <div className='absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PublicUserNotes
