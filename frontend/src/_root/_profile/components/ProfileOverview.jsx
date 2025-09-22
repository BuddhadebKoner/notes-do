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
         <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
               <div>
                  <p className='text-sm font-medium text-muted-foreground'>{title}</p>
                  <p className={`text-2xl font-bold text-${color}-600`}>{value || 0}</p>
               </div>
               <div className={`text-3xl text-${color}-500`}>{icon}</div>
            </div>
         </CardContent>
      </Card>
   )

   if (!user) {
      return (
         <Card>
            <CardContent className='p-6'>
               <p className='text-muted-foreground'>Loading profile overview...</p>
            </CardContent>
         </Card>
      )
   }

   return (
      <div className='space-y-6'>
         {/* Stats Grid */}
         <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <StatCard
               title='Total Notes'
               value={statsData?.success ? statsData.data.overview.totalNotes : user.activity.totalUploads}
               icon={<NotebookPen className='h-5 w-5' />}
               color='blue'
            />
            <StatCard
               title='Total Downloads'
               value={statsData?.success ? statsData.data.overview.totalDownloads : user.activity.totalDownloads}
               icon={
                  <CloudDownload className='h-5 w-5' />
               }
               color='green'
            />
            <StatCard
               title='Total Views'
               value={statsData?.success ? statsData.data.overview.totalViews : 0}
               icon={<Eye className='h-5 w-5' />}
               color='purple'
            />
            <StatCard
               title='Average Rating'
               value={statsData?.success ? statsData.data.overview.avgRating?.toFixed(1) : '0.0'}
               icon={<Star className='h-5 w-5' />}
               color='yellow'
            />
         </div>

         {/* Profile Information Cards */}
         <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Personal Information */}
            <Card>
               <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
               </CardHeader>
               <CardContent className='space-y-3'>
                  <div className='flex justify-between'>
                     <span className='text-muted-foreground'>Full Name</span>
                     <span className='font-medium'>{user.profile.fullName}</span>
                  </div>
                  <div className='flex justify-between'>
                     <span className='text-muted-foreground'>Username</span>
                     <Badge variant="secondary">@{user.username}</Badge>
                  </div>
                  <div className='flex justify-between'>
                     <span className='text-muted-foreground'>Email</span>
                     <span className='font-medium'>{user.email}</span>
                  </div>
                  {user.profile.dateOfBirth && (
                     <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Date of Birth</span>
                        <span className='font-medium'>
                           {new Date(user.profile.dateOfBirth).toLocaleDateString()}
                        </span>
                     </div>
                  )}
                  {user.contact.phone && (
                     <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Phone</span>
                        <span className='font-medium'>{user.contact.phone}</span>
                     </div>
                  )}
               </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
               <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
               </CardHeader>
               <CardContent className='space-y-3'>
                  <div className='flex justify-between'>
                     <span className='text-muted-foreground'>University</span>
                     <span className='font-medium'>{user.academic.university || 'Not specified'}</span>
                  </div>
                  <div className='flex justify-between'>
                     <span className='text-muted-foreground'>Department</span>
                     <span className='font-medium'>{user.academic.department || 'Not specified'}</span>
                  </div>
                  <div className='flex justify-between'>
                     <span className='text-muted-foreground'>Degree</span>
                     <Badge variant="outline" className='capitalize'>{user.academic.degree}</Badge>
                  </div>
                  {user.academic.currentSemester && (
                     <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Current Semester</span>
                        <span className='font-medium'>{user.academic.currentSemester}</span>
                     </div>
                  )}
                  {user.academic.graduationYear && (
                     <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Graduation Year</span>
                        <span className='font-medium'>{user.academic.graduationYear}</span>
                     </div>
                  )}
                  {user.academic.studentId && (
                     <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Student ID</span>
                        <span className='font-medium'>{user.academic.studentId}</span>
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>

         {/* Activity Overview */}
         <Card>
            <CardHeader>
               <CardTitle>Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
               <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div className='text-center p-4 bg-blue-50 rounded-lg border'>
                     <div className='text-2xl font-bold text-blue-600'>{user.activity.favoriteNotes.length}</div>
                     <div className='text-sm text-muted-foreground'>Favorite Notes</div>
                  </div>
                  <div className='text-center p-4 bg-green-50 rounded-lg border'>
                     <div className='text-2xl font-bold text-green-600'>{user.activity.wishlistNotes.length}</div>
                     <div className='text-sm text-muted-foreground'>Wishlist Items</div>
                  </div>
                  <div className='text-center p-4 bg-purple-50 rounded-lg border'>
                     <div className='text-2xl font-bold text-purple-600'>{user.activity.followers.length}</div>
                     <div className='text-sm text-muted-foreground'>Followers</div>
                  </div>
                  <div className='text-center p-4 bg-indigo-50 rounded-lg border'>
                     <div className='text-2xl font-bold text-indigo-600'>{user.activity.following.length}</div>
                     <div className='text-sm text-muted-foreground'>Following</div>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
   )
}

export default ProfileOverview