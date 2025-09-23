import React, { useState } from 'react'
import { useGetWishlist } from '../../../lib/react-query/queriesAndMutation.js'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card.jsx'
import { Button } from '../../../components/ui/button.jsx'
import { Badge } from '../../../components/ui/badge.jsx'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../components/ui/avatar.jsx'

const Wishlist = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 10

  const { data, isLoading, error } = useGetWishlist(currentPage, limit)

  const NoteCard = ({ note }) => (
    <Card className='hover:shadow-lg transition-shadow'>
      <CardContent className='p-6'>
        <div className='flex items-start justify-between mb-4'>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold mb-2'>{note.title}</h3>
            <p className='text-muted-foreground text-sm line-clamp-2 mb-2'>
              {note.description}
            </p>

            {/* Uploader Info */}
            <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
              <Avatar className='w-6 h-6'>
                <AvatarImage
                  src={note.uploader?.profile?.avatar || '/default-avatar.png'}
                />
                <AvatarFallback className='text-xs'>
                  {note.uploader?.profile?.firstName?.[0]}
                  {note.uploader?.profile?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span>
                By {note.uploader?.profile?.firstName}{' '}
                {note.uploader?.profile?.lastName}
              </span>
              <Badge variant='outline' className='text-xs'>
                @{note.uploader?.username}
              </Badge>
            </div>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='text-red-500 hover:text-red-700'
          >
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z'
                clipRule='evenodd'
              />
            </svg>
          </Button>
        </div>

        <div className='space-y-2 mb-4'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Subject:</span>
            <span className='font-medium'>{note.subject?.name}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Category:</span>
            <Badge variant='outline' className='capitalize'>
              {note.subject?.category?.replace('-', ' ')}
            </Badge>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>University:</span>
            <span className='font-medium'>{note.academic?.university}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Department:</span>
            <span className='font-medium'>{note.academic?.department}</span>
          </div>
          {note.academic?.semester && (
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Semester:</span>
              <span className='font-medium'>{note.academic.semester}</span>
            </div>
          )}
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
                <span>
                  ⭐ {note.engagement.rating.average?.toFixed(1) || '0.0'}
                </span>
                <span className='ml-1'>
                  ({note.engagement.rating.count || 0})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className='flex flex-wrap gap-2 mb-4'>
            {note.tags.map((tag, index) => (
              <Badge
                key={index}
                className='bg-purple-100 text-purple-800 hover:bg-purple-200'
              >
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
            <Button size='sm' asChild>
              <a
                href={note.file?.downloadUrl}
                target='_blank'
                rel='noopener noreferrer'
              >
                View
              </a>
            </Button>
            <Button size='sm' className='bg-purple-500 hover:bg-purple-600'>
              Add to Favorites
            </Button>
            <Button size='sm' variant='destructive'>
              Remove
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
          Page {pagination.currentPage} of {pagination.totalPages} •{' '}
          {pagination.totalNotes} items in wishlist
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
            className='bg-purple-500 hover:bg-purple-600'
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
            Error loading your wishlist: {error.message}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className='bg-purple-500 hover:bg-purple-600'
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle className='text-2xl'>My Wishlist</CardTitle>
            <div className='flex items-center space-x-2'>
              <span className='text-purple-500'>🔖</span>
              <Badge className='bg-purple-100 text-purple-800 hover:bg-purple-200'>
                {data?.success ? data.data.pagination.totalNotes : 0} items
                saved
              </Badge>
            </div>
          </div>
          <p className='text-muted-foreground'>
            Notes you've saved to read later or download when needed.
          </p>
        </CardHeader>
      </Card>

      {/* Wishlist Items */}
      {data?.success && data.data.notes.length > 0 ? (
        <div>
          <div className='grid grid-cols-1 gap-6'>
            {data.data.notes.map(note => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
          <Pagination pagination={data.data.pagination} />
        </div>
      ) : (
        <Card>
          <CardContent className='text-center py-12'>
            <div className='text-6xl mb-4'>🔖</div>
            <h3 className='text-xl font-semibold mb-2'>
              Your wishlist is empty
            </h3>
            <p className='text-muted-foreground mb-6'>
              Start building your wishlist by saving notes you're interested in!
            </p>
            <Button
              size='lg'
              className='bg-purple-500 hover:bg-purple-600'
              asChild
            >
              <a href='/'>Browse Notes</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Wishlist
