import React, { useState } from 'react'
import { useGetUploadedNotes } from '../../../lib/react-query/queriesAndMutation.js'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx'
import { Button } from '../../../components/ui/button.jsx'
import { Badge } from '../../../components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select.jsx'

const UploadedNotes = () => {
   const [currentPage, setCurrentPage] = useState(1)
   const [sortBy, setSortBy] = useState('uploadDate')
   const [sortOrder, setSortOrder] = useState('desc')
   const limit = 10

   const { data, isLoading, error } = useGetUploadedNotes(currentPage, limit, sortBy, sortOrder)

   const NoteCard = ({ note }) => (
      <Card className='hover:shadow-lg transition-shadow'>
         <CardContent className='p-6'>
            <div className='flex items-start justify-between mb-4'>
               <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>{note.title}</h3>
                  <p className='text-muted-foreground text-sm line-clamp-2'>{note.description}</p>
               </div>
               <div className='flex items-center space-x-2'>
                  <Badge variant={note.visibility?.isPublic ? 'default' : 'secondary'}>
                     {note.visibility?.isPublic ? 'Public' : 'Private'}
                  </Badge>
               </div>
            </div>

            <div className='space-y-2 mb-4'>
               <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Subject:</span>
                  <span className='font-medium'>{note.subject?.name}</span>
               </div>
               <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Category:</span>
                  <Badge variant="outline" className='capitalize'>{note.subject?.category?.replace('-', ' ')}</Badge>
               </div>
               <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>University:</span>
                  <span className='font-medium'>{note.academic?.university}</span>
               </div>
               <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Department:</span>
                  <span className='font-medium'>{note.academic?.department}</span>
               </div>
            </div>

            {/* Engagement Stats */}
            {note.engagement && (
               <div className='flex justify-between items-center text-sm text-muted-foreground mb-4'>
                  <div className='flex space-x-4'>
                     <span>👁️ {note.engagement.views || 0} views</span>
                     <span>⬇️ {note.engagement.downloads || 0} downloads</span>
                     <span>❤️ {note.engagement.likes || 0} likes</span>
                  </div>
                  {note.engagement.rating && (
                     <div className='flex items-center'>
                        <span>⭐ {note.engagement.rating.average?.toFixed(1) || '0.0'}</span>
                        <span className='ml-1'>({note.engagement.rating.count || 0})</span>
                     </div>
                  )}
               </div>
            )}

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
               <div className='flex flex-wrap gap-2 mb-4'>
                  {note.tags.map((tag, index) => (
                     <Badge key={index} variant="secondary">
                        {tag}
                     </Badge>
                  ))}
               </div>
            )}

            <div className='flex justify-between items-center'>
               <span className='text-sm text-muted-foreground'>
                  Uploaded: {new Date(note.uploadDate).toLocaleDateString()}
               </span>
               <div className='space-x-2'>
                  <Button size="sm" asChild>
                     <a
                        href={note.file?.viewUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                     >
                        View
                     </a>
                  </Button>
                  <Button size="sm" variant="outline">
                     Edit
                  </Button>
               </div>
            </div>
         </CardContent>
      </Card>
   )

   const Pagination = ({ pagination }) => {
      if (!pagination || pagination.totalPages <= 1) return null

      return (
         <div className='flex justify-between items-center mt-6'>
            <div className='text-sm text-muted-foreground'>
               Page {pagination.currentPage} of {pagination.totalPages} • {pagination.totalNotes} notes total
            </div>
            <div className='flex space-x-2'>
               <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrevPage}
                  variant="outline"
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
               <p className='text-destructive mb-4'>Error loading your notes: {error.message}</p>
               <Button onClick={() => window.location.reload()}>
                  Retry
               </Button>
            </CardContent>
         </Card>
      )
   }

   return (
      <div className='space-y-6'>
         {/* Header with Sort Controls */}
         <Card>
            <CardHeader>
               <div className='flex justify-between items-center'>
                  <CardTitle className='text-2xl'>My Uploaded Notes</CardTitle>
                  <div className='flex space-x-4'>
                     <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className='w-40'>
                           <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value='uploadDate'>Upload Date</SelectItem>
                           <SelectItem value='title'>Title</SelectItem>
                           <SelectItem value='engagement.downloads'>Downloads</SelectItem>
                           <SelectItem value='engagement.views'>Views</SelectItem>
                           <SelectItem value='engagement.likes'>Likes</SelectItem>
                        </SelectContent>
                     </Select>
                     <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className='w-32'>
                           <SelectValue placeholder="Order" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value='desc'>Descending</SelectItem>
                           <SelectItem value='asc'>Ascending</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               {data?.success && (
                  <p className='text-muted-foreground'>
                     {data.data.pagination.totalNotes} notes uploaded
                  </p>
               )}
            </CardHeader>
         </Card>

         {/* Notes Grid */}
         {data?.success && data.data.notes.length > 0 ? (
            <div>
               <div className='grid grid-cols-1 gap-6'>
                  {data.data.notes.map((note) => (
                     <NoteCard key={note._id} note={note} />
                  ))}
               </div>
               <Pagination pagination={data.data.pagination} />
            </div>
         ) : (
            <Card>
               <CardContent className='text-center py-12'>
                  <div className='text-6xl mb-4'>📄</div>
                  <h3 className='text-xl font-semibold mb-2'>No notes uploaded yet</h3>
                  <p className='text-muted-foreground mb-6'>
                     Start sharing your knowledge by uploading your first note!
                  </p>
                  <Button size="lg" asChild>
                     <a href='/upload'>
                        Upload Your First Note
                     </a>
                  </Button>
               </CardContent>
            </Card>
         )}
      </div>
   )
}

export default UploadedNotes