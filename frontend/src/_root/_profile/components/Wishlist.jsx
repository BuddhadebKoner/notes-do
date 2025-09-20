import React, { useState } from 'react'
import { useGetWishlist } from '../../../lib/react-query/queriesAndMutation.js'

const Wishlist = () => {
   const [currentPage, setCurrentPage] = useState(1)
   const limit = 10

   const { data, isLoading, error } = useGetWishlist(currentPage, limit)

   const NoteCard = ({ note }) => (
      <div className='bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow'>
         <div className='flex items-start justify-between mb-4'>
            <div className='flex-1'>
               <h3 className='text-lg font-semibold text-gray-900 mb-2'>{note.title}</h3>
               <p className='text-gray-600 text-sm line-clamp-2 mb-2'>{note.description}</p>

               {/* Uploader Info */}
               <div className='flex items-center space-x-2 text-sm text-gray-500'>
                  <img
                     src={note.uploader?.profile?.avatar || '/default-avatar.png'}
                     alt={note.uploader?.profile?.firstName}
                     className='w-6 h-6 rounded-full'
                  />
                  <span>
                     By {note.uploader?.profile?.firstName} {note.uploader?.profile?.lastName}
                  </span>
                  <span>(@{note.uploader?.username})</span>
               </div>
            </div>
            <button className='text-red-500 hover:text-red-700 transition-colors p-1'>
               <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' clipRule='evenodd' />
               </svg>
            </button>
         </div>

         <div className='space-y-2 mb-4'>
            <div className='flex justify-between text-sm'>
               <span className='text-gray-600'>Subject:</span>
               <span className='font-medium'>{note.subject?.name}</span>
            </div>
            <div className='flex justify-between text-sm'>
               <span className='text-gray-600'>Category:</span>
               <span className='font-medium capitalize'>{note.subject?.category?.replace('-', ' ')}</span>
            </div>
            <div className='flex justify-between text-sm'>
               <span className='text-gray-600'>University:</span>
               <span className='font-medium'>{note.academic?.university}</span>
            </div>
            <div className='flex justify-between text-sm'>
               <span className='text-gray-600'>Department:</span>
               <span className='font-medium'>{note.academic?.department}</span>
            </div>
            {note.academic?.semester && (
               <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Semester:</span>
                  <span className='font-medium'>{note.academic.semester}</span>
               </div>
            )}
         </div>

         {/* Engagement Stats */}
         {note.engagement && (
            <div className='flex justify-between items-center text-sm text-gray-600 mb-4'>
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
                  <span
                     key={index}
                     className='px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full'
                  >
                     {tag}
                  </span>
               ))}
            </div>
         )}

         <div className='flex justify-between items-center'>
            <span className='text-sm text-gray-500'>
               Uploaded: {new Date(note.uploadDate).toLocaleDateString()}
            </span>
            <div className='space-x-2'>
               <a
                  href={note.file?.downloadUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors'
               >
                  View
               </a>
               <button className='px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors'>
                  Add to Favorites
               </button>
               <button className='px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors'>
                  Remove
               </button>
            </div>
         </div>
      </div>
   )

   const Pagination = ({ pagination }) => {
      if (!pagination || pagination.totalPages <= 1) return null

      return (
         <div className='flex justify-between items-center mt-6'>
            <div className='text-sm text-gray-600'>
               Page {pagination.currentPage} of {pagination.totalPages} • {pagination.totalNotes} items in wishlist
            </div>
            <div className='flex space-x-2'>
               <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrevPage}
                  className='px-3 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300'
               >
                  Previous
               </button>
               <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!pagination.hasNextPage}
                  className='px-3 py-2 bg-purple-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600'
               >
                  Next
               </button>
            </div>
         </div>
      )
   }

   if (isLoading) {
      return (
         <div className='bg-white rounded-lg shadow-lg p-6'>
            <div className='animate-pulse space-y-4'>
               <div className='h-6 bg-gray-200 rounded w-1/4'></div>
               <div className='space-y-3'>
                  <div className='h-4 bg-gray-200 rounded'></div>
                  <div className='h-4 bg-gray-200 rounded w-3/4'></div>
               </div>
            </div>
         </div>
      )
   }

   if (error) {
      return (
         <div className='bg-white rounded-lg shadow-lg p-6'>
            <div className='text-center py-8'>
               <p className='text-red-600 mb-4'>Error loading your wishlist: {error.message}</p>
               <button
                  onClick={() => window.location.reload()}
                  className='px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600'
               >
                  Retry
               </button>
            </div>
         </div>
      )
   }

   return (
      <div className='space-y-6'>
         {/* Header */}
         <div className='bg-white rounded-lg shadow-lg p-6'>
            <div className='flex justify-between items-center mb-4'>
               <h2 className='text-2xl font-bold text-gray-900'>My Wishlist</h2>
               <div className='flex items-center space-x-2'>
                  <span className='text-purple-500'>🔖</span>
                  <span className='text-sm text-gray-600'>
                     {data?.success ? data.data.pagination.totalNotes : 0} items saved
                  </span>
               </div>
            </div>

            <p className='text-gray-600'>
               Notes you've saved to read later or download when needed.
            </p>
         </div>

         {/* Wishlist Items */}
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
            <div className='bg-white rounded-lg shadow-lg p-6'>
               <div className='text-center py-12'>
                  <div className='text-6xl mb-4'>🔖</div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>Your wishlist is empty</h3>
                  <p className='text-gray-600 mb-6'>
                     Start building your wishlist by saving notes you're interested in!
                  </p>
                  <a
                     href='/'
                     className='inline-block px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors'
                  >
                     Browse Notes
                  </a>
               </div>
            </div>
         )}
      </div>
   )
}

export default Wishlist