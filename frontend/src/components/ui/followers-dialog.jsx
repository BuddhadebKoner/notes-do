import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { useGetPublicUserFollowers } from '@/lib/react-query/queriesAndMutation'

const FollowersDialog = ({
  username,
  followersCount = 0,
  trigger,
  userFullName = 'User',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()
  const limit = 20

  // Fetch followers data with pagination
  const {
    data: followersData,
    isLoading,
    error,
    isError,
  } = useGetPublicUserFollowers(username, {
    page: currentPage,
    limit,
  })

  const handleUserClick = clickedUsername => {
    setIsOpen(false)
    navigate(`/user/${clickedUsername}`)
  }

  const handleNextPage = () => {
    if (followersData?.data?.pagination?.hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (followersData?.data?.pagination?.hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const renderFollowerItem = follower => (
    <div
      key={follower._id}
      className='flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors'
      onClick={() => handleUserClick(follower.username)}
    >
      <div className='flex items-center space-x-3'>
        <Avatar className='h-10 w-10'>
          <img
            src={follower.profile?.avatar || '/default-avatar.png'}
            alt={`${follower.profile?.firstName} ${follower.profile?.lastName}`}
            className='h-full w-full object-cover'
          />
        </Avatar>
        <div className='flex flex-col'>
          <div className='flex items-center space-x-2'>
            <span className='font-medium text-sm'>
              {follower.profile?.firstName} {follower.profile?.lastName}
            </span>
            {follower.account?.isVerified && (
              <Badge variant='secondary' className='text-xs'>
                Verified
              </Badge>
            )}
          </div>
          <span className='text-xs text-gray-500'>@{follower.username}</span>
          {follower.academic?.university && (
            <span className='text-xs text-gray-600 mt-1'>
              {follower.academic.university}
              {follower.academic?.department &&
                `, ${follower.academic.department}`}
            </span>
          )}
        </div>
      </div>
      <UserPlus className='h-4 w-4 text-gray-400' />
    </div>
  )

  const renderSkeletonItems = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className='flex items-center space-x-3 p-3'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <div className='space-y-2 flex-1'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-3 w-40' />
          </div>
        </div>
      ))}
    </>
  )

  const renderErrorState = () => (
    <div className='flex flex-col items-center justify-center py-8 text-center'>
      <AlertCircle className='h-12 w-12 text-red-500 mb-4' />
      <h3 className='text-lg font-semibold text-gray-900 mb-2'>
        Unable to Load Followers
      </h3>
      <p className='text-sm text-gray-600 mb-4'>
        {error?.message || 'Something went wrong while fetching followers.'}
      </p>
      <Button
        variant='outline'
        size='sm'
        onClick={() => window.location.reload()}
      >
        Try Again
      </Button>
    </div>
  )

  const renderEmptyState = () => (
    <div className='flex flex-col items-center justify-center py-8 text-center'>
      <Users className='h-12 w-12 text-gray-400 mb-4' />
      <h3 className='text-lg font-semibold text-gray-900 mb-2'>
        No Followers Yet
      </h3>
      <p className='text-sm text-gray-600'>
        {userFullName} doesn't have any followers yet.
      </p>
    </div>
  )

  const renderPagination = () => {
    const pagination = followersData?.data?.pagination
    if (!pagination || pagination.totalPages <= 1) return null

    return (
      <div className='flex items-center justify-between pt-4 border-t'>
        <div className='text-sm text-gray-600'>
          Page {pagination.currentPage} of {pagination.totalPages}
          {pagination.totalFollowers > 0 && (
            <span className='ml-2'>
              ({pagination.totalFollowers} total followers)
            </span>
          )}
        </div>
        <div className='flex space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handlePrevPage}
            disabled={!pagination.hasPrevPage}
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={handleNextPage}
            disabled={!pagination.hasNextPage}
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='ghost' className='flex flex-col items-center p-4'>
            <Users className='h-8 w-8 mb-2 text-purple-500' />
            <p className='text-2xl font-bold'>{followersCount}</p>
            <p className='text-sm text-gray-600'>Followers</p>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <Users className='h-5 w-5 text-purple-500' />
            <span>Followers</span>
            <Badge variant='secondary' className='ml-2'>
              {followersData?.data?.pagination?.totalFollowers ||
                followersCount}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto'>
          {isLoading ? (
            renderSkeletonItems()
          ) : isError ? (
            renderErrorState()
          ) : followersData?.data?.followers?.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className='space-y-1'>
              {followersData?.data?.followers?.map(renderFollowerItem)}
            </div>
          )}
        </div>

        {!isLoading && !isError && renderPagination()}
      </DialogContent>
    </Dialog>
  )
}

export default FollowersDialog
