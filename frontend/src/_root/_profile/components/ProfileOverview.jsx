import React from 'react'
import { useGetProfile, useGetActivityStats } from '../../../lib/react-query/queriesAndMutation.js'

const ProfileOverview = () => {
   const { data: profileData } = useGetProfile()
   const { data: statsData, isLoading: statsLoading } = useGetActivityStats()

   const user = profileData?.user

   const StatCard = ({ title, value, icon, color = 'blue' }) => (
      <div className='bg-white p-6 rounded-lg shadow-lg'>
         <div className='flex items-center justify-between'>
            <div>
               <p className='text-sm font-medium text-gray-600'>{title}</p>
               <p className={`text-2xl font-bold text-${color}-600`}>{value || 0}</p>
            </div>
            <div className={`text-3xl text-${color}-500`}>{icon}</div>
         </div>
      </div>
   )

   if (!user) {
      return (
         <div className='bg-white rounded-lg shadow-lg p-6'>
            <p className='text-gray-500'>Loading profile overview...</p>
         </div>
      )
   }

   return (
      <div className='space-y-6'>
         {/* Stats Grid */}
         <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <StatCard
               title='Total Notes'
               value={statsData?.success ? statsData.data.overview.totalNotes : user.activity.totalUploads}
               icon='📄'
               color='blue'
            />
            <StatCard
               title='Total Downloads'
               value={statsData?.success ? statsData.data.overview.totalDownloads : user.activity.totalDownloads}
               icon='⬇️'
               color='green'
            />
            <StatCard
               title='Total Views'
               value={statsData?.success ? statsData.data.overview.totalViews : 0}
               icon='👁️'
               color='purple'
            />
            <StatCard
               title='Average Rating'
               value={statsData?.success ? statsData.data.overview.avgRating?.toFixed(1) : '0.0'}
               icon='⭐'
               color='yellow'
            />
         </div>

         {/* Profile Information Cards */}
         <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Personal Information */}
            <div className='bg-white p-6 rounded-lg shadow-lg'>
               <h3 className='text-lg font-semibold text-gray-900 mb-4'>Personal Information</h3>
               <div className='space-y-3'>
                  <div className='flex justify-between'>
                     <span className='text-gray-600'>Full Name</span>
                     <span className='font-medium'>{user.profile.fullName}</span>
                  </div>
                  <div className='flex justify-between'>
                     <span className='text-gray-600'>Username</span>
                     <span className='font-medium'>@{user.username}</span>
                  </div>
                  <div className='flex justify-between'>
                     <span className='text-gray-600'>Email</span>
                     <span className='font-medium'>{user.email}</span>
                  </div>
                  {user.profile.dateOfBirth && (
                     <div className='flex justify-between'>
                        <span className='text-gray-600'>Date of Birth</span>
                        <span className='font-medium'>
                           {new Date(user.profile.dateOfBirth).toLocaleDateString()}
                        </span>
                     </div>
                  )}
                  {user.contact.phone && (
                     <div className='flex justify-between'>
                        <span className='text-gray-600'>Phone</span>
                        <span className='font-medium'>{user.contact.phone}</span>
                     </div>
                  )}
               </div>
            </div>

            {/* Academic Information */}
            <div className='bg-white p-6 rounded-lg shadow-lg'>
               <h3 className='text-lg font-semibold text-gray-900 mb-4'>Academic Information</h3>
               <div className='space-y-3'>
                  <div className='flex justify-between'>
                     <span className='text-gray-600'>University</span>
                     <span className='font-medium'>{user.academic.university || 'Not specified'}</span>
                  </div>
                  <div className='flex justify-between'>
                     <span className='text-gray-600'>Department</span>
                     <span className='font-medium'>{user.academic.department || 'Not specified'}</span>
                  </div>
                  <div className='flex justify-between'>
                     <span className='text-gray-600'>Degree</span>
                     <span className='font-medium capitalize'>{user.academic.degree}</span>
                  </div>
                  {user.academic.currentSemester && (
                     <div className='flex justify-between'>
                        <span className='text-gray-600'>Current Semester</span>
                        <span className='font-medium'>{user.academic.currentSemester}</span>
                     </div>
                  )}
                  {user.academic.graduationYear && (
                     <div className='flex justify-between'>
                        <span className='text-gray-600'>Graduation Year</span>
                        <span className='font-medium'>{user.academic.graduationYear}</span>
                     </div>
                  )}
                  {user.academic.studentId && (
                     <div className='flex justify-between'>
                        <span className='text-gray-600'>Student ID</span>
                        <span className='font-medium'>{user.academic.studentId}</span>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Activity Overview */}
         <div className='bg-white p-6 rounded-lg shadow-lg'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Activity Overview</h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
               <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>{user.activity.favoriteNotes.length}</div>
                  <div className='text-sm text-gray-600'>Favorite Notes</div>
               </div>
               <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <div className='text-2xl font-bold text-green-600'>{user.activity.wishlistNotes.length}</div>
                  <div className='text-sm text-gray-600'>Wishlist Items</div>
               </div>
               <div className='text-center p-4 bg-purple-50 rounded-lg'>
                  <div className='text-2xl font-bold text-purple-600'>{user.activity.followers.length}</div>
                  <div className='text-sm text-gray-600'>Followers</div>
               </div>
               <div className='text-center p-4 bg-indigo-50 rounded-lg'>
                  <div className='text-2xl font-bold text-indigo-600'>{user.activity.following.length}</div>
                  <div className='text-sm text-gray-600'>Following</div>
               </div>
            </div>
         </div>

         {/* Category Statistics */}
         {statsData?.success && statsData.data.categoryStats.length > 0 && (
            <div className='bg-white p-6 rounded-lg shadow-lg'>
               <h3 className='text-lg font-semibold text-gray-900 mb-4'>Notes by Category</h3>
               <div className='space-y-3'>
                  {statsData.data.categoryStats.map((category, index) => (
                     <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                        <div className='flex items-center space-x-3'>
                           <span className='font-medium capitalize'>{category._id.replace('-', ' ')}</span>
                           <span className='text-sm text-gray-500'>({category.count} notes)</span>
                        </div>
                        <div className='text-sm text-gray-600'>
                           {category.totalDownloads} downloads
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Account Status */}
         <div className='bg-white p-6 rounded-lg shadow-lg'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Account Status</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
               <div className='flex items-center space-x-2'>
                  <span className={`w-3 h-3 rounded-full ${user.account.isVerified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className='text-sm font-medium'>
                     {user.account.isVerified ? 'Verified' : 'Not Verified'}
                  </span>
               </div>
               <div className='flex items-center space-x-2'>
                  <span className={`w-3 h-3 rounded-full ${user.account.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className='text-sm font-medium'>
                     {user.account.isActive ? 'Active' : 'Inactive'}
                  </span>
               </div>
               <div className='flex items-center space-x-2'>
                  <span className='text-sm font-medium capitalize'>{user.account.role}</span>
               </div>
            </div>
            <div className='mt-4 text-sm text-gray-600'>
               <p>Member since: {new Date(user.account.createdAt).toLocaleDateString()}</p>
               {user.account.lastLogin && (
                  <p>Last login: {new Date(user.account.lastLogin).toLocaleDateString()}</p>
               )}
            </div>
         </div>

         {/* Google Drive Integration */}
         {user.driveIntegration && (
            <div className='bg-white p-6 rounded-lg shadow-lg'>
               <h3 className='text-lg font-semibold text-gray-900 mb-4'>Google Drive Integration</h3>
               <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                     <span className={`w-3 h-3 rounded-full ${user.driveIntegration.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                     <span className='font-medium'>
                        {user.driveIntegration.isConnected ? 'Connected' : 'Not Connected'}
                     </span>
                     {user.driveIntegration.driveEmail && (
                        <span className='text-sm text-gray-600'>({user.driveIntegration.driveEmail})</span>
                     )}
                  </div>
                  {user.driveIntegration.storageQuota && (
                     <div className='text-sm text-gray-600'>
                        Storage: {(user.driveIntegration.storageQuota.used / 1024 / 1024 / 1024).toFixed(2)} GB /
                        {(user.driveIntegration.storageQuota.limit / 1024 / 1024 / 1024).toFixed(0)} GB
                     </div>
                  )}
               </div>
               {user.driveIntegration.lastSync && (
                  <p className='text-sm text-gray-600 mt-2'>
                     Last sync: {new Date(user.driveIntegration.lastSync).toLocaleString()}
                  </p>
               )}
            </div>
         )}
      </div>
   )
}

export default ProfileOverview