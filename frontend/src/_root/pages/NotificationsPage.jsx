import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
   Bell,
   Check,
   CheckCheck,
   Trash2,
   User,
   Filter,
   ArrowLeft,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/utils'
import {
   useGetNotifications,
   useGetUnreadCount,
   useMarkNotificationAsRead,
   useMarkAllAsRead,
   useDeleteNotification,
} from '../../lib/react-query/queriesAndMutation'

const NotificationsPage = () => {
   const [showUnreadOnly, setShowUnreadOnly] = useState(false)
   const [currentPage, setCurrentPage] = useState(1)
   const limit = 20

   // Queries
   const { data: unreadCountData } = useGetUnreadCount()
   const { data: notificationsData, isLoading } = useGetNotifications({
      page: currentPage,
      limit,
      unreadOnly: showUnreadOnly,
   })

   // Mutations
   const markAsReadMutation = useMarkNotificationAsRead()
   const markAllAsReadMutation = useMarkAllAsRead()
   const deleteNotificationMutation = useDeleteNotification()

   const unreadCount = unreadCountData?.data?.unreadCount || 0
   const notifications = notificationsData?.data?.notifications || []
   const pagination = notificationsData?.data?.pagination || {}
   const hasNotifications = notifications.length > 0

   const handleMarkAsRead = (notificationId, e) => {
      e.preventDefault()
      e.stopPropagation()
      markAsReadMutation.mutate(notificationId)
   }

   const handleMarkAllAsRead = () => {
      markAllAsReadMutation.mutate()
   }

   const handleDelete = (notificationId, e) => {
      e.preventDefault()
      e.stopPropagation()
      deleteNotificationMutation.mutate(notificationId)
   }

   const getNotificationLink = (notification) => {
      if (notification.type === 'follow') {
         return `/user/${notification.sender?.username}`
      }
      return '#'
   }

   const formatTime = (timestamp) => {
      try {
         return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
      } catch {
         return 'recently'
      }
   }

   return (
      <div className='min-h-screen bg-white'>
         <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            {/* Header */}
            <div className='mb-8'>
               <Link
                  to='/'
                  className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors'
               >
                  <ArrowLeft className='h-4 w-4 mr-1' />
                  Back to Home
               </Link>
               <div className='flex items-center justify-between flex-wrap gap-4'>
                  <div className='flex items-center gap-4'>
                     <div className='p-3 bg-black rounded-lg'>
                        <Bell className='h-6 w-6 text-white' />
                     </div>
                     <div>
                        <h1 className='text-3xl font-bold text-gray-900'>
                           Notifications
                        </h1>
                        <p className='text-sm text-gray-600 mt-1'>
                           {unreadCount > 0
                              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''
                              }`
                              : "You're all caught up!"}
                        </p>
                     </div>
                  </div>
                  {unreadCount > 0 && (
                     <Button
                        onClick={handleMarkAllAsRead}
                        disabled={markAllAsReadMutation.isLoading}
                        className='bg-black hover:bg-gray-800 text-white'
                     >
                        <CheckCheck className='h-4 w-4 mr-2' />
                        Mark all as read
                     </Button>
                  )}
               </div>
            </div>

            {/* Filter Tabs */}
            <Card className='mb-6 border border-gray-200'>
               <div className='flex border-b border-gray-200'>
                  <button
                     onClick={() => {
                        setShowUnreadOnly(false)
                        setCurrentPage(1)
                     }}
                     className={cn(
                        'flex-1 px-6 py-4 text-sm font-medium transition-colors relative',
                        !showUnreadOnly
                           ? 'text-gray-900 bg-gray-50'
                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                     )}
                  >
                     <div className='flex items-center justify-center gap-2'>
                        <Bell className='h-4 w-4' />
                        All Notifications
                        {pagination.totalNotifications > 0 && (
                           <Badge variant='secondary' className='ml-2'>
                              {pagination.totalNotifications}
                           </Badge>
                        )}
                     </div>
                     {!showUnreadOnly && (
                        <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-black' />
                     )}
                  </button>
                  <button
                     onClick={() => {
                        setShowUnreadOnly(true)
                        setCurrentPage(1)
                     }}
                     className={cn(
                        'flex-1 px-6 py-4 text-sm font-medium transition-colors relative',
                        showUnreadOnly
                           ? 'text-gray-900 bg-gray-50'
                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                     )}
                  >
                     <div className='flex items-center justify-center gap-2'>
                        <Filter className='h-4 w-4' />
                        Unread Only
                        {unreadCount > 0 && (
                           <Badge variant='destructive' className='ml-2'>
                              {unreadCount}
                           </Badge>
                        )}
                     </div>
                     {showUnreadOnly && (
                        <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-black' />
                     )}
                  </button>
               </div>
            </Card>

            {/* Notifications List */}
            <Card className='border border-gray-200'>
               <CardContent className='p-0'>
                  {isLoading ? (
                     <div className='py-16 text-center'>
                        <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-r-transparent mb-4'></div>
                        <p className='text-sm text-gray-600'>Loading notifications...</p>
                     </div>
                  ) : !hasNotifications ? (
                     <div className='py-16 text-center'>
                        <div className='mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                           <Bell className='h-12 w-12 text-gray-400' />
                        </div>
                        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                           No notifications
                        </h3>
                        <p className='text-sm text-gray-600 max-w-sm mx-auto'>
                           {showUnreadOnly
                              ? "You're all caught up! No unread notifications."
                              : 'Notifications will appear here when someone follows you or interacts with your content.'}
                        </p>
                     </div>
                  ) : (
                     <div className='divide-y divide-gray-200'>
                        {notifications.map((notification) => (
                           <Link
                              key={notification._id}
                              to={getNotificationLink(notification)}
                              onClick={() => {
                                 if (!notification.isRead) {
                                    markAsReadMutation.mutate(notification._id)
                                 }
                              }}
                              className={cn(
                                 'flex gap-4 px-6 py-4 hover:bg-gray-50 transition-colors relative group',
                                 !notification.isRead && 'bg-gray-50/50'
                              )}
                           >
                              {/* Unread Indicator */}
                              {!notification.isRead && (
                                 <div className='absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full' />
                              )}

                              {/* Avatar */}
                              <Avatar className='h-12 w-12 border-2 border-gray-200'>
                                 <AvatarImage
                                    src={notification.sender?.avatar}
                                    alt={notification.sender?.name}
                                 />
                                 <AvatarFallback className='bg-black text-white font-semibold'>
                                    {notification.sender?.name?.[0]?.toUpperCase() || (
                                       <User className='h-6 w-6' />
                                    )}
                                 </AvatarFallback>
                              </Avatar>

                              {/* Content */}
                              <div className='flex-1 min-w-0'>
                                 <p className='text-sm text-gray-900 leading-relaxed mb-2'>
                                    <span className='font-semibold text-gray-900'>
                                       {notification.sender?.name || 'Someone'}
                                    </span>{' '}
                                    <span className='text-gray-700'>
                                       {notification.message?.replace(
                                          notification.sender?.name || '',
                                          ''
                                       )}
                                    </span>
                                 </p>
                                 <div className='flex items-center gap-3'>
                                    <span className='text-xs text-gray-500 font-medium'>
                                       {formatTime(notification.createdAt)}
                                    </span>
                                    {notification.type && (
                                       <Badge
                                          variant='outline'
                                          className='text-xs px-2 py-0.5'
                                       >
                                          {notification.type}
                                       </Badge>
                                    )}
                                 </div>
                              </div>

                              {/* Actions */}
                              <div className='flex items-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                 {!notification.isRead && (
                                    <Button
                                       variant='ghost'
                                       size='icon'
                                       className='h-9 w-9 hover:bg-gray-100 rounded-lg'
                                       onClick={(e) => handleMarkAsRead(notification._id, e)}
                                       title='Mark as read'
                                    >
                                       <Check className='h-4 w-4 text-gray-700' />
                                    </Button>
                                 )}
                                 <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-9 w-9 hover:bg-gray-100 rounded-lg'
                                    onClick={(e) => handleDelete(notification._id, e)}
                                    title='Delete'
                                 >
                                    <Trash2 className='h-4 w-4 text-gray-700' />
                                 </Button>
                              </div>
                           </Link>
                        ))}
                     </div>
                  )}
               </CardContent>
            </Card>

            {/* Pagination */}
            {hasNotifications && pagination.totalPages > 1 && (
               <div className='mt-6 flex items-center justify-center gap-2'>
                  <Button
                     variant='outline'
                     onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                     disabled={currentPage === 1}
                     className='border-gray-300 hover:bg-gray-50'
                  >
                     Previous
                  </Button>
                  <div className='flex items-center gap-2'>
                     {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(
                           (page) =>
                              page === 1 ||
                              page === pagination.totalPages ||
                              Math.abs(page - currentPage) <= 1
                        )
                        .map((page, index, array) => (
                           <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                 <span className='text-gray-400'>...</span>
                              )}
                              <Button
                                 variant={currentPage === page ? 'default' : 'outline'}
                                 size='sm'
                                 onClick={() => setCurrentPage(page)}
                                 className={cn(
                                    currentPage === page
                                       ? 'bg-black hover:bg-gray-800 text-white'
                                       : 'border-gray-300 hover:bg-gray-50'
                                 )}
                              >
                                 {page}
                              </Button>
                           </React.Fragment>
                        ))}
                  </div>
                  <Button
                     variant='outline'
                     onClick={() =>
                        setCurrentPage((prev) =>
                           Math.min(pagination.totalPages, prev + 1)
                        )
                     }
                     disabled={currentPage === pagination.totalPages}
                     className='border-gray-300 hover:bg-gray-50'
                  >
                     Next
                  </Button>
               </div>
            )}
         </div>
      </div>
   )
}

export default NotificationsPage
