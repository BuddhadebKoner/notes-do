import React, { useState } from 'react'
import {
  useGetUserWishlists,
  useDeleteWishlist,
} from '../../lib/react-query/queriesAndMutation'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx'
import { Button } from '../ui/button.jsx'
import { Badge } from '../ui/badge.jsx'
import CreateWishlistDialog from './CreateWishlistDialog.jsx'
import EditWishlistDialog from './EditWishlistDialog.jsx'
import WishlistDetailsDialog from './WishlistDetailsDialog.jsx'
import ConfirmationDialog from '../ui/confirmation-dialog.jsx'
import {
  Plus,
  FolderOpen,
  Lock,
  Globe,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.jsx'

const colorClasses = {
  blue: 'bg-blue-500 border-blue-200 text-blue-700',
  green: 'bg-green-500 border-green-200 text-green-700',
  purple: 'bg-purple-500 border-purple-200 text-purple-700',
  red: 'bg-red-500 border-red-200 text-red-700',
  orange: 'bg-orange-500 border-orange-200 text-orange-700',
  yellow: 'bg-yellow-500 border-yellow-200 text-yellow-700',
  pink: 'bg-pink-500 border-pink-200 text-pink-700',
  gray: 'bg-gray-500 border-gray-200 text-gray-700',
}

const Wishlists = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedWishlist, setSelectedWishlist] = useState(null)
  const [wishlistToEdit, setWishlistToEdit] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [wishlistToDelete, setWishlistToDelete] = useState(null)

  const limit = 12

  // Fetch user's wishlists
  const { data, isLoading, error, refetch } = useGetUserWishlists(
    false,
    currentPage,
    limit
  )

  // Delete wishlist mutation
  const { mutate: deleteWishlist, isPending: isDeleting } = useDeleteWishlist()

  const handleEditWishlist = wishlist => {
    setWishlistToEdit(wishlist)
    setEditDialogOpen(true)
  }

  const handleDeleteWishlist = wishlist => {
    setWishlistToDelete(wishlist)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (wishlistToDelete) {
      deleteWishlist(wishlistToDelete._id, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setWishlistToDelete(null)
        },
      })
    }
  }

  const WishlistCard = ({ wishlist }) => {
    const colorClass = colorClasses[wishlist.color] || colorClasses.blue

    return (
      <Card
        className={`hover:shadow-lg transition-all cursor-pointer border-l-4 ${colorClass.split(' ')[1]}`}
      >
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center space-x-2 flex-1 min-w-0'>
              <div
                className={`w-3 h-3 rounded-full ${colorClass.split(' ')[0]}`}
              />
              <CardTitle className='text-lg truncate'>
                {wishlist.name}
              </CardTitle>
              {wishlist.isPrivate && (
                <Lock className='w-4 h-4 text-muted-foreground flex-shrink-0' />
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={e => e.stopPropagation()}
                >
                  <MoreVertical className='w-4 h-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedWishlist(wishlist)
                  }}
                >
                  <Eye className='w-4 h-4 mr-2' />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    handleEditWishlist(wishlist)
                  }}
                >
                  <Edit3 className='w-4 h-4 mr-2' />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    handleDeleteWishlist(wishlist)
                  }}
                  className='text-red-600'
                >
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent
          className='pt-0'
          onClick={() => setSelectedWishlist(wishlist)}
        >
          {wishlist.description && (
            <p className='text-sm text-muted-foreground mb-3 line-clamp-2'>
              {wishlist.description}
            </p>
          )}

          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4 text-sm text-muted-foreground'>
              <div className='flex items-center space-x-1'>
                <FolderOpen className='w-4 h-4' />
                <span>{wishlist.notesCount || 0} notes</span>
              </div>
              {wishlist.isPrivate ? (
                <div className='flex items-center space-x-1'>
                  <Lock className='w-4 h-4' />
                  <span>Private</span>
                </div>
              ) : (
                <div className='flex items-center space-x-1'>
                  <Globe className='w-4 h-4' />
                  <span>Public</span>
                </div>
              )}
            </div>
          </div>

          <div className='mt-3 text-xs text-muted-foreground'>
            Created {new Date(wishlist.createdAt).toLocaleDateString()}
            {wishlist.updatedAt !== wishlist.createdAt && (
              <span>
                {' '}
                • Updated {new Date(wishlist.updatedAt).toLocaleDateString()}
              </span>
            )}
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
          Page {pagination.currentPage} of {pagination.totalPages} •
          {pagination.totalWishlists} total wishlists
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
      <div className='space-y-6'>
        {/* Header Skeleton */}
        <Card>
          <CardContent className='p-6'>
            <div className='animate-pulse space-y-4'>
              <div className='h-8 bg-gray-200 rounded w-1/3'></div>
              <div className='h-4 bg-gray-200 rounded w-2/3'></div>
            </div>
          </CardContent>
        </Card>

        {/* Grid Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {[...Array(8)].map((_, index) => (
            <Card key={index}>
              <CardContent className='p-6'>
                <div className='animate-pulse space-y-4'>
                  <div className='h-6 bg-gray-200 rounded w-3/4'></div>
                  <div className='h-4 bg-gray-200 rounded'></div>
                  <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className='text-center py-12'>
          <p className='text-destructive mb-4'>
            Error loading wishlists: {error.message}
          </p>
          <Button
            onClick={refetch}
            className='bg-purple-500 hover:bg-purple-600'
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const wishlists = data?.success ? data.data.wishlists : []
  const pagination = data?.success ? data.data.pagination : null

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <div>
              <CardTitle className='text-2xl flex items-center gap-2'>
                <FolderOpen className='w-6 h-6 text-purple-500' />
                My Wishlists
              </CardTitle>
              <p className='text-muted-foreground'>
                Organize your favorite notes into custom collections. You can
                create up to 10 wishlists.
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className='bg-purple-500 hover:bg-purple-600'
              disabled={wishlists.length >= 10}
            >
              <Plus className='w-4 h-4 mr-2' />
              New Wishlist
            </Button>
          </div>

          {wishlists.length > 0 && (
            <div className='flex items-center space-x-4 text-sm text-muted-foreground'>
              <Badge className='bg-purple-100 text-purple-800'>
                {wishlists.length}/10 wishlists created
              </Badge>
              <span>
                Total notes saved:{' '}
                {wishlists.reduce((total, w) => total + (w.notesCount || 0), 0)}
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Wishlists Grid */}
      {wishlists.length > 0 ? (
        <div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {wishlists.map(wishlist => (
              <WishlistCard key={wishlist._id} wishlist={wishlist} />
            ))}
          </div>
          <Pagination pagination={pagination} />
        </div>
      ) : (
        <Card>
          <CardContent className='text-center py-16'>
            <FolderOpen className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-xl font-semibold mb-2'>No wishlists yet</h3>
            <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
              Create your first wishlist to start organizing your favorite notes
              into collections.
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size='lg'
              className='bg-purple-500 hover:bg-purple-600'
            >
              <Plus className='w-5 h-5 mr-2' />
              Create Your First Wishlist
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateWishlistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditWishlistDialog
        wishlist={wishlistToEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {selectedWishlist && (
        <WishlistDetailsDialog
          wishlist={selectedWishlist}
          open={!!selectedWishlist}
          onOpenChange={open => !open && setSelectedWishlist(null)}
        />
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title='Delete Wishlist'
        description={`Are you sure you want to delete "${wishlistToDelete?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        variant='destructive'
      />
    </div>
  )
}

export default Wishlists
