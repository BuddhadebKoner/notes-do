import React from 'react'
import { useGetProfile, useGetActivityStats } from '../../../lib/react-query/queriesAndMutation.js'
import { CloudDownload, Eye, NotebookPen, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx'
import { Badge } from '../../../components/ui/badge.jsx'

const ProfileOverview = () => {
   const { data: profileData } = useGetProfile()
   const { data: statsData, isLoading: statsLoading } = useGetActivityStats()

   const user = profileData?.user

   const StatCard = ({ title, value, icon, color = 'blue' }) => (
      <Card>
         <CardContent className='p-3 sm:p-4 lg:p-6'>
            <div className='flex items-center justify-between'>
               <div className='min-w-0 flex-1'>
                  <p className='text-xs sm:text-sm font-medium text-muted-foreground truncate'>{title}</p>
                  <p className={`text-lg sm:text-xl lg:text-2xl font-bold text-${color}-600`}>{value || 0}</p>
               </div>
               <div className={`text-2xl sm:text-3xl text-${color}-500 flex-shrink-0 ml-2`}>{icon}</div>
            </div>
         </CardContent>
      </Card>
   )

   if (!user) {
      return (
         <Card>
            <CardContent className='p-4 sm:p-6'>
               <p className='text-muted-foreground text-sm sm:text-base'>Loading profile overview...</p>
            </CardContent>
         </Card>
      )
   }

   return (
      <div className='space-y-4 sm:space-y-6'>
         {/* Stats Grid */}
         <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'>
            <StatCard
               title='Total Notes'
               value={statsData?.success ? statsData.data.overview.totalNotes : user.activity.totalUploads}
               icon={<NotebookPen className='h-4 w-4 sm:h-5 sm:w-5' />}
               color='blue'
            />
            <StatCard
               title='Total Downloads'
               value={statsData?.success ? statsData.data.overview.totalDownloads : user.activity.totalDownloads}
               icon={
                  <CloudDownload className='h-4 w-4 sm:h-5 sm:w-5' />
               }
               color='green'
            />
            <StatCard
               title='Total Views'
               value={statsData?.success ? statsData.data.overview.totalViews : 0}
               icon={<Eye className='h-4 w-4 sm:h-5 sm:w-5' />}
               color='purple'
            />
            <StatCard
               title='Average Rating'
               value={statsData?.success ? statsData.data.overview.avgRating?.toFixed(1) : '0.0'}
               icon={<Star className='h-4 w-4 sm:h-5 sm:w-5' />}
               color='yellow'
            />
         </div>

         {/* Profile Information Cards */}
         <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
            {/* Personal Information */}
            <Card>
               <CardHeader className='pb-3 sm:pb-6'>
                  <CardTitle className='text-lg sm:text-xl'>Personal Information</CardTitle>
               </CardHeader>
               <CardContent className='space-y-3 pt-0'>
                  <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2'>
                     <span className='text-muted-foreground text-sm sm:text-base'>Full Name</span>
                     <span className='font-medium text-sm sm:text-base break-words'>{user.profile.fullName}</span>
                  </div>
                  <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2'>
                     <span className='text-muted-foreground text-sm sm:text-base'>Username</span>
                     <Badge variant="secondary" className='self-start sm:self-center text-xs sm:text-sm'>@{user.username}</Badge>
                  </div>
                  <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2'>
                     <span className='text-muted-foreground text-sm sm:text-base'>Email</span>
                     <span className='font-medium text-sm sm:text-base break-all'>{user.email}</span>
                  </div>
                  {user.profile.dateOfBirth && (
                     <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2'>
                        <span className='text-muted-foreground text-sm sm:text-base'>Date of Birth</span>
                        <span className='font-medium text-sm sm:text-base'>
                           {new Date(user.profile.dateOfBirth).toLocaleDateString()}
                        </span>
                     </div>
                  )}
                  {user.contact.phone && (
                     <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2'>
                        <span className='text-muted-foreground text-sm sm:text-base'>Phone</span>
                        <span className='font-medium text-sm sm:text-base'>{user.contact.phone}</span>
                     </div>
                  )}
               </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
               <CardHeader className='pb-3 sm:pb-6'>
                  <CardTitle className='text-lg sm:text-xl'>Academic Information</CardTitle>
               </CardHeader>
               <CardContent className='space-y-3 pt-0'>
                  <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2'>
                     <span className='text-muted-foreground text-sm sm:text-base'>University</span>
                     <span className='font-medium text-sm sm:text-base break-words text-right'>{user.academic.university || 'Not specified'}</span>
                  </div>
                  <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2'>
                     <span className='text-muted-foreground text-sm sm:text-base'>Department</span>
                     <span className='font-medium text-sm sm:text-base break-words text-right'>{user.academic.department || 'Not specified'}</span>
                  </div>
                  <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2'>
                     <span className='text-muted-foreground text-sm sm:text-base'>Degree</span>
                     <Badge variant="outline" className='capitalize self-start sm:self-center text-xs sm:text-sm'>{user.academic.degree}</Badge>
                  </div>
                  {user.academic.currentSemester && (
                     <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2'>
                        <span className='text-muted-foreground text-sm sm:text-base'>Current Semester</span>
                        <span className='font-medium text-sm sm:text-base'>{user.academic.currentSemester}</span>
                     </div>
                  )}
                  {user.academic.graduationYear && (
                     <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2'>
                        <span className='text-muted-foreground text-sm sm:text-base'>Graduation Year</span>
                        <span className='font-medium text-sm sm:text-base'>{user.academic.graduationYear}</span>
                     </div>
                  )}
                  {user.academic.studentId && (
                     <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2'>
                        <span className='text-muted-foreground text-sm sm:text-base'>Student ID</span>
                        <span className='font-medium text-sm sm:text-base'>{user.academic.studentId}</span>
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>

         {/* Activity Overview */}
         <Card>
            <CardHeader className='pb-3 sm:pb-6'>
               <CardTitle className='text-lg sm:text-xl'>Activity Overview</CardTitle>
            </CardHeader>
            <CardContent className='pt-0'>
               <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
                  <div className='text-center p-3 sm:p-4 bg-blue-50 rounded-lg border'>
                     <div className='text-lg sm:text-xl lg:text-2xl font-bold text-blue-600'>{user.activity.favoriteNotes.length}</div>
                     <div className='text-xs sm:text-sm text-muted-foreground'>Favorite Notes</div>
                  </div>
                  <div className='text-center p-3 sm:p-4 bg-green-50 rounded-lg border'>
                     <div className='text-lg sm:text-xl lg:text-2xl font-bold text-green-600'>{user.activity.wishlistNotes.length}</div>
                     <div className='text-xs sm:text-sm text-muted-foreground'>Wishlist Items</div>
                  </div>
                  <div className='text-center p-3 sm:p-4 bg-purple-50 rounded-lg border'>
                     <div className='text-lg sm:text-xl lg:text-2xl font-bold text-purple-600'>{user.activity.followers.length}</div>
                     <div className='text-xs sm:text-sm text-muted-foreground'>Followers</div>
                  </div>
                  <div className='text-center p-3 sm:p-4 bg-indigo-50 rounded-lg border'>
                     <div className='text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600'>{user.activity.following.length}</div>
                     <div className='text-xs sm:text-sm text-muted-foreground'>Following</div>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
   )
}

export default ProfileOverview