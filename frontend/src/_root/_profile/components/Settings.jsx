import React, { useState, useEffect } from 'react'
import { useGetProfile, useUpdateProfile } from '../../../lib/react-query/queriesAndMutation.js'

const Settings = () => {
   const { data: profileData } = useGetProfile()
   const { mutate: updateProfile, isLoading: updateLoading } = useUpdateProfile()

   const [formData, setFormData] = useState({
      // Profile
      bio: '',
      dateOfBirth: '',
      gender: 'prefer-not-to-say',

      // Academic
      university: '',
      department: '',
      currentSemester: '',
      graduationYear: '',
      studentId: '',
      degree: 'bachelor',

      // Contact
      phone: '',
      address: {
         street: '',
         city: '',
         state: '',
         country: '',
         zipCode: ''
      },
      socialLinks: {
         linkedin: '',
         github: '',
         twitter: '',
         website: ''
      },

      // Preferences
      theme: 'auto',
      language: 'en',
      emailNotifications: {
         newNotes: true,
         comments: true,
         likes: true,
         weeklyDigest: false
      },
      privacy: {
         profileVisibility: 'university',
         showEmail: false
      }
   })

   // Load current profile data
   useEffect(() => {
      if (profileData?.success && profileData.user) {
         const user = profileData.user
         setFormData({
            bio: user.profile.bio || '',
            dateOfBirth: user.profile.dateOfBirth ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0] : '',
            gender: user.profile.gender || 'prefer-not-to-say',

            university: user.academic.university || '',
            department: user.academic.department || '',
            currentSemester: user.academic.currentSemester || '',
            graduationYear: user.academic.graduationYear || '',
            studentId: user.academic.studentId || '',
            degree: user.academic.degree || 'bachelor',

            phone: user.contact.phone || '',
            address: {
               street: user.contact.address?.street || '',
               city: user.contact.address?.city || '',
               state: user.contact.address?.state || '',
               country: user.contact.address?.country || '',
               zipCode: user.contact.address?.zipCode || ''
            },
            socialLinks: {
               linkedin: user.contact.socialLinks?.linkedin || '',
               github: user.contact.socialLinks?.github || '',
               twitter: user.contact.socialLinks?.twitter || '',
               website: user.contact.socialLinks?.website || ''
            },

            theme: user.preferences.theme || 'auto',
            language: user.preferences.language || 'en',
            emailNotifications: {
               newNotes: user.preferences.emailNotifications?.newNotes ?? true,
               comments: user.preferences.emailNotifications?.comments ?? true,
               likes: user.preferences.emailNotifications?.likes ?? true,
               weeklyDigest: user.preferences.emailNotifications?.weeklyDigest ?? false
            },
            privacy: {
               profileVisibility: user.preferences.privacy?.profileVisibility || 'university',
               showEmail: user.preferences.privacy?.showEmail ?? false
            }
         })
      }
   }, [profileData])

   const handleInputChange = (section, field, value) => {
      setFormData(prev => ({
         ...prev,
         [section]: {
            ...prev[section],
            [field]: value
         }
      }))
   }

   const handleSimpleChange = (field, value) => {
      setFormData(prev => ({
         ...prev,
         [field]: value
      }))
   }

   const handleSubmit = (e) => {
      e.preventDefault()

      // Prepare update data
      const updateData = {
         'profile.bio': formData.bio,
         'profile.dateOfBirth': formData.dateOfBirth,
         'profile.gender': formData.gender,

         'academic.university': formData.university,
         'academic.department': formData.department,
         'academic.currentSemester': formData.currentSemester ? parseInt(formData.currentSemester) : null,
         'academic.graduationYear': formData.graduationYear ? parseInt(formData.graduationYear) : null,
         'academic.studentId': formData.studentId,
         'academic.degree': formData.degree,

         'contact.phone': formData.phone,
         'contact.address': formData.address,
         'contact.socialLinks': formData.socialLinks,

         'preferences.theme': formData.theme,
         'preferences.language': formData.language,
         'preferences.emailNotifications': formData.emailNotifications,
         'preferences.privacy': formData.privacy
      }

      updateProfile(updateData)
   }

   return (
      <div className='space-y-6'>
         <div className='bg-white rounded-lg shadow-lg p-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>Profile Settings</h2>

            <form onSubmit={handleSubmit} className='space-y-8'>
               {/* Profile Information */}
               <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Profile Information</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                     <div className='md:col-span-2'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Bio
                        </label>
                        <textarea
                           value={formData.bio}
                           onChange={(e) => handleSimpleChange('bio', e.target.value)}
                           rows={3}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='Tell others about yourself...'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Date of Birth
                        </label>
                        <input
                           type='date'
                           value={formData.dateOfBirth}
                           onChange={(e) => handleSimpleChange('dateOfBirth', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Gender
                        </label>
                        <select
                           value={formData.gender}
                           onChange={(e) => handleSimpleChange('gender', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        >
                           <option value='male'>Male</option>
                           <option value='female'>Female</option>
                           <option value='other'>Other</option>
                           <option value='prefer-not-to-say'>Prefer not to say</option>
                        </select>
                     </div>
                  </div>
               </div>

               {/* Academic Information */}
               <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Academic Information</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           University
                        </label>
                        <input
                           type='text'
                           value={formData.university}
                           onChange={(e) => handleSimpleChange('university', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='Your university name'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Department
                        </label>
                        <input
                           type='text'
                           value={formData.department}
                           onChange={(e) => handleSimpleChange('department', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='Your department'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Current Semester
                        </label>
                        <input
                           type='number'
                           min='1'
                           max='12'
                           value={formData.currentSemester}
                           onChange={(e) => handleSimpleChange('currentSemester', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='1-12'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Graduation Year
                        </label>
                        <input
                           type='number'
                           min='2020'
                           max='2035'
                           value={formData.graduationYear}
                           onChange={(e) => handleSimpleChange('graduationYear', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='YYYY'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Student ID
                        </label>
                        <input
                           type='text'
                           value={formData.studentId}
                           onChange={(e) => handleSimpleChange('studentId', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='Your student ID'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Degree
                        </label>
                        <select
                           value={formData.degree}
                           onChange={(e) => handleSimpleChange('degree', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        >
                           <option value='bachelor'>Bachelor</option>
                           <option value='master'>Master</option>
                           <option value='phd'>PhD</option>
                           <option value='diploma'>Diploma</option>
                           <option value='certificate'>Certificate</option>
                           <option value='other'>Other</option>
                        </select>
                     </div>
                  </div>
               </div>

               {/* Contact Information */}
               <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Contact Information</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Phone
                        </label>
                        <input
                           type='tel'
                           value={formData.phone}
                           onChange={(e) => handleSimpleChange('phone', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='Your phone number'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           City
                        </label>
                        <input
                           type='text'
                           value={formData.address.city}
                           onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='Your city'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           State/Province
                        </label>
                        <input
                           type='text'
                           value={formData.address.state}
                           onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='Your state or province'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Country
                        </label>
                        <input
                           type='text'
                           value={formData.address.country}
                           onChange={(e) => handleInputChange('address', 'country', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='Your country'
                        />
                     </div>
                  </div>
               </div>

               {/* Social Links */}
               <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Social Links</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           LinkedIn
                        </label>
                        <input
                           type='url'
                           value={formData.socialLinks.linkedin}
                           onChange={(e) => handleInputChange('socialLinks', 'linkedin', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='https://linkedin.com/in/username'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           GitHub
                        </label>
                        <input
                           type='url'
                           value={formData.socialLinks.github}
                           onChange={(e) => handleInputChange('socialLinks', 'github', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='https://github.com/username'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Twitter
                        </label>
                        <input
                           type='url'
                           value={formData.socialLinks.twitter}
                           onChange={(e) => handleInputChange('socialLinks', 'twitter', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='https://twitter.com/username'
                        />
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Website
                        </label>
                        <input
                           type='url'
                           value={formData.socialLinks.website}
                           onChange={(e) => handleInputChange('socialLinks', 'website', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                           placeholder='https://yourwebsite.com'
                        />
                     </div>
                  </div>
               </div>

               {/* Preferences */}
               <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Preferences</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Theme
                        </label>
                        <select
                           value={formData.theme}
                           onChange={(e) => handleSimpleChange('theme', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        >
                           <option value='light'>Light</option>
                           <option value='dark'>Dark</option>
                           <option value='auto'>Auto</option>
                        </select>
                     </div>

                     <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                           Profile Visibility
                        </label>
                        <select
                           value={formData.privacy.profileVisibility}
                           onChange={(e) => handleInputChange('privacy', 'profileVisibility', e.target.value)}
                           className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        >
                           <option value='public'>Public</option>
                           <option value='university'>University Only</option>
                           <option value='private'>Private</option>
                        </select>
                     </div>
                  </div>
               </div>

               {/* Email Notifications */}
               <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Email Notifications</h3>
                  <div className='space-y-4'>
                     <div className='flex items-center'>
                        <input
                           type='checkbox'
                           checked={formData.emailNotifications.newNotes}
                           onChange={(e) => handleInputChange('emailNotifications', 'newNotes', e.target.checked)}
                           className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                        />
                        <label className='ml-2 text-sm text-gray-700'>
                           New notes from people you follow
                        </label>
                     </div>

                     <div className='flex items-center'>
                        <input
                           type='checkbox'
                           checked={formData.emailNotifications.comments}
                           onChange={(e) => handleInputChange('emailNotifications', 'comments', e.target.checked)}
                           className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                        />
                        <label className='ml-2 text-sm text-gray-700'>
                           Comments on your notes
                        </label>
                     </div>

                     <div className='flex items-center'>
                        <input
                           type='checkbox'
                           checked={formData.emailNotifications.likes}
                           onChange={(e) => handleInputChange('emailNotifications', 'likes', e.target.checked)}
                           className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                        />
                        <label className='ml-2 text-sm text-gray-700'>
                           Likes on your notes
                        </label>
                     </div>

                     <div className='flex items-center'>
                        <input
                           type='checkbox'
                           checked={formData.emailNotifications.weeklyDigest}
                           onChange={(e) => handleInputChange('emailNotifications', 'weeklyDigest', e.target.checked)}
                           className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                        />
                        <label className='ml-2 text-sm text-gray-700'>
                           Weekly digest of new notes
                        </label>
                     </div>
                  </div>
               </div>

               {/* Submit Button */}
               <div className='flex justify-end space-x-4'>
                  <button
                     type='button'
                     className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'
                  >
                     Cancel
                  </button>
                  <button
                     type='submit'
                     disabled={updateLoading}
                     className='px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                     {updateLoading ? 'Saving...' : 'Save Changes'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   )
}

export default Settings