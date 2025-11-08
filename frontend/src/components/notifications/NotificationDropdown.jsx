import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuTrigger,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuLabel,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { cn } from '../../lib/utils'
import {
   useGetNotifications,
   useGetUnreadCount,
   useMarkNotificationAsRead,
   useMarkAllAsRead,
   useDeleteNotification,
} from '../../lib/react-query/queriesAndMutation'

const NotificationDropdown = () => {
   const [isOpen, setIsOpen] = useState(false)
   const [showUnreadOnly, setShowUnreadOnly] = useState(false)

   // Queries
   const { data: unreadCountData } = useGetUnreadCount()
   const { data: notificationsData, isLoading } = useGetNotifications({
      page: 1,
      limit: 10,
      unreadOnly: showUnreadOnly,
   })

   // Mutations
   const markAsReadMutation = useMarkNotificationAsRead()
   const markAllAsReadMutation = useMarkAllAsRead()
   const deleteNotificationMutation = useDeleteNotification()

   const unreadCount = unreadCountData?.data?.unreadCount || 0
   const notifications = notificationsData?.data?.notifications || []
   const hasNotifications = notifications.length > 0

   const handleMarkAsRead = (notificationId, e) => {
      e.preventDefault()
      e.stopPropagation()
      markAsReadMutation.mutate(notificationId)
   }

   const handleMarkAllAsRead = (e) => {
      e.preventDefault()
      e.stopPropagation()
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
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
         <DropdownMenuTrigger asChild>
            <Button
               variant='ghost'
               size='icon'
               className='relative hover:bg-gray-100 transition-colors'
            >
               <Bell className='h-5 w-5 text-gray-700' />
               {unreadCount > 0 && (
                  <Badge
                     variant='destructive'
                     className='absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold'
                  >
                     {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
               )}
            </Button>
         </DropdownMenuTrigger>

         <DropdownMenuContent
            align='end'
            className='w-[380px] max-h-[500px] overflow-hidden p-0'
            sideOffset={8}
         >
            {/* Header */}
            <div className='sticky top-0 z-10 bg-white border-b'>
               <div className='flex items-center justify-between px-4 py-3'>
                  <div className='flex items-center gap-2'>
                     <h3 className='font-semibold text-base'>Notifications</h3>
                     {unreadCount > 0 && (
                        <Badge variant='secondary' className='text-xs'>
                           {unreadCount} new
                        </Badge>
                     )}
                  </div>
                  {unreadCount > 0 && (
                     <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                        onClick={handleMarkAllAsRead}
                        disabled={markAllAsReadMutation.isLoading}
                     >
                        <CheckCheck className='h-3.5 w-3.5 mr-1' />
                        Mark all read
                     </Button>
                  )}
               </div>

               {/* Filter Tabs */}
               <div className='flex border-t'>
                  <button
                     onClick={() => setShowUnreadOnly(false)}
                     className={cn(
                        'flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative',
                        !showUnreadOnly
                           ? 'text-gray-900 bg-gray-50'
                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                     )}
                  >
                     All
                     {!showUnreadOnly && (
                        <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900' />
                     )}
                  </button>
                  <button
                     onClick={() => setShowUnreadOnly(true)}
                     className={cn(
                        'flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative',
                        showUnreadOnly
                           ? 'text-gray-900 bg-gray-50'
                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                     )}
                  >
                     Unread
                     {showUnreadOnly && (
                        <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900' />
                     )}
                  </button>
               </div>
            </div>

            {/* Notifications List */}
            <div className='max-h-[340px] overflow-y-auto'>
               {isLoading ? (
                  <div className='py-8 text-center text-sm text-gray-500'>
                     Loading notifications...
                  </div>
               ) : !hasNotifications ? (
                  <div className='py-12 text-center'>
                     <Bell className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                     <p className='text-sm font-medium text-gray-900 mb-1'>
                        No notifications
                     </p>
                     <p className='text-xs text-gray-500'>
                        {showUnreadOnly
                           ? "You're all caught up!"
                           : 'Notifications will appear here'}
                     </p>
                  </div>
               ) : (
                  <div className='divide-y'>
                     {notifications.map((notification) => (
                        <Link
                           key={notification._id}
                           to={getNotificationLink(notification)}
                           onClick={() => {
                              if (!notification.isRead) {
                                 markAsReadMutation.mutate(notification._id)
                              }
                              setIsOpen(false)
                           }}
                           className={cn(
                              'flex gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors relative group',
                              !notification.isRead && 'bg-blue-50/50 hover:bg-blue-50'
                           )}
                        >
                           {/* Unread Indicator */}
                           {!notification.isRead && (
                              <div className='absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full' />
                           )}

                           {/* Avatar */}
                           <Avatar className='h-10 w-10 border-2 border-white shadow-sm'>
                              <AvatarImage
                                 src={notification.sender?.avatar}
                                 alt={notification.sender?.name}
                              />
                              <AvatarFallback className='bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold'>
                                 {notification.sender?.name?.[0]?.toUpperCase() || (
                                    <User className='h-5 w-5' />
                                 )}
                              </AvatarFallback>
                           </Avatar>

                           {/* Content */}
                           <div className='flex-1 min-w-0'>
                              <p className='text-sm text-gray-900 leading-snug mb-1'>
                                 <span className='font-semibold'>
                                    {notification.sender?.name || 'Someone'}
                                 </span>{' '}
                                 <span className='text-gray-700'>
                                    {notification.message?.replace(
                                       notification.sender?.name || '',
                                       ''
                                    )}
                                 </span>
                              </p>
                              <div className='flex items-center gap-2'>
                                 <span className='text-xs text-gray-500'>
                                    {formatTime(notification.createdAt)}
                                 </span>
                                 {notification.type && (
                                    <Badge
                                       variant='outline'
                                       className='text-[10px] px-1.5 py-0 h-4'
                                    >
                                       {notification.type}
                                    </Badge>
                                 )}
                              </div>
                           </div>

                           {/* Actions */}
                           <div className='flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                              {!notification.isRead && (
                                 <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-7 w-7 hover:bg-blue-100'
                                    onClick={(e) => handleMarkAsRead(notification._id, e)}
                                    title='Mark as read'
                                 >
                                    <Check className='h-3.5 w-3.5 text-blue-600' />
                                 </Button>
                              )}
                              <Button
                                 variant='ghost'
                                 size='icon'
                                 className='h-7 w-7 hover:bg-red-100'
                                 onClick={(e) => handleDelete(notification._id, e)}
                                 title='Delete'
                              >
                                 <Trash2 className='h-3.5 w-3.5 text-red-600' />
                              </Button>
                           </div>
                        </Link>
                     ))}
                  </div>
               )}
            </div>

            {/* Footer */}
            {hasNotifications && (
               <>
                  <DropdownMenuSeparator className='my-0' />
                  <div className='p-2'>
                     <Button
                        variant='ghost'
                        className='w-full text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                        asChild
                     >
                        <Link to='/notifications' onClick={() => setIsOpen(false)}>
                           View all notifications
                        </Link>
                     </Button>
                  </div>
               </>
            )}
         </DropdownMenuContent>
      </DropdownMenu>
   )
}

export default NotificationDropdown
