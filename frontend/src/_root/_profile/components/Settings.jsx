import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGetProfile, useUpdateProfile } from '../../../lib/react-query/queriesAndMutation.js'
import { settingsFormSchema, defaultSettingsValues } from '../schemas/settingsFormSchema.js'
import {
   Form,
   FormControl,
   FormDescription,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from '../../../components/ui/form.jsx'
import { Input } from '../../../components/ui/input.jsx'
import { Button } from '../../../components/ui/button.jsx'
import { Textarea } from '../../../components/ui/textarea.jsx'
import { Checkbox } from '../../../components/ui/checkbox.jsx'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '../../../components/ui/select.jsx'

const Settings = () => {
   const { data: profileData, isLoading: profileLoading } = useGetProfile()
   const { mutate: updateProfile, isLoading: updateLoading } = useUpdateProfile()

   const form = useForm({
      resolver: zodResolver(settingsFormSchema),
      defaultValues: defaultSettingsValues,
   })

   // Load current profile data into form
   useEffect(() => {
      if (profileData?.success && profileData.user) {
         const user = profileData.user

         const formValues = {
            bio: user.profile.bio || '',
            dateOfBirth: user.profile.dateOfBirth
               ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0]
               : '',
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
         }

         form.reset(formValues)
      }
   }, [profileData, form])

   const onSubmit = async (values) => {
      try {
         // Prepare update data in the format expected by the API
         const updateData = {
            'profile.bio': values.bio || null,
            'profile.dateOfBirth': values.dateOfBirth || null,
            'profile.gender': values.gender,

            'academic.university': values.university || null,
            'academic.department': values.department || null,
            'academic.currentSemester': values.currentSemester ? parseInt(values.currentSemester) : null,
            'academic.graduationYear': values.graduationYear ? parseInt(values.graduationYear) : null,
            'academic.studentId': values.studentId || null,
            'academic.degree': values.degree,

            'contact.phone': values.phone || null,
            'contact.address': values.address,
            'contact.socialLinks': values.socialLinks,

            'preferences.theme': values.theme,
            'preferences.language': values.language,
            'preferences.emailNotifications': values.emailNotifications,
            'preferences.privacy': values.privacy
         }

         updateProfile(updateData, {
            onSuccess: (data) => {
               // Reset form state to mark as pristine
               form.reset(values)

               // You can add a toast notification here
               console.log('Profile updated successfully:', data)

               // Optional: Show success message in UI
               // toast.success('Profile updated successfully!')
            },
            onError: (error) => {
               console.error('Failed to update profile:', error)

               // Set form errors based on API response
               if (error.response?.data?.errors) {
                  Object.entries(error.response.data.errors).forEach(([field, message]) => {
                     form.setError(field, { message })
                  })
               } else {
                  // Generic error handling
                  form.setError('root', {
                     message: error.message || 'Failed to update profile. Please try again.'
                  })
               }

               // Optional: Show error toast
               // toast.error('Failed to update profile. Please try again.')
            }
         })
      } catch (error) {
         console.error('Unexpected error:', error)
         form.setError('root', {
            message: 'An unexpected error occurred. Please try again.'
         })
      }
   }

   if (profileLoading) {
      return (
         <div className='space-y-6'>
            <div className='bg-white rounded-lg shadow-lg p-6'>
               <div className='animate-pulse space-y-4'>
                  <div className='h-8 bg-gray-200 rounded w-1/3'></div>
                  <div className='space-y-2'>
                     <div className='h-4 bg-gray-200 rounded'></div>
                     <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                  </div>
               </div>
            </div>
         </div>
      )
   }

   return (
      <div className='space-y-6'>
         <div className='bg-white rounded-lg shadow-lg p-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>Profile Settings</h2>

            <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                  {/* Display root form errors */}
                  {form.formState.errors.root && (
                     <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                        <div className='flex'>
                           <div className='ml-3'>
                              <h3 className='text-sm font-medium text-red-800'>
                                 Error updating profile
                              </h3>
                              <div className='mt-2 text-sm text-red-700'>
                                 {form.formState.errors.root.message}
                              </div>
                           </div>
                        </div>
                     </div>
                  )}
                  {/* Profile Information */}
                  <div>
                     <h3 className='text-lg font-semibold text-gray-900 mb-4'>Profile Information</h3>
                     <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='md:col-span-2'>
                           <FormField
                              control={form.control}
                              name='bio'
                              render={({ field }) => (
                                 <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                       <Textarea
                                          placeholder='Tell others about yourself...'
                                          className='resize-none'
                                          {...field}
                                       />
                                    </FormControl>
                                    <FormDescription>
                                       Share a brief description about yourself (max 500 characters)
                                    </FormDescription>
                                    <FormMessage />
                                 </FormItem>
                              )}
                           />
                        </div>

                        <FormField
                           control={form.control}
                           name='dateOfBirth'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Date of Birth</FormLabel>
                                 <FormControl>
                                    <Input type='date' {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='gender'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Gender</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                       <SelectTrigger>
                                          <SelectValue placeholder='Select gender' />
                                       </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       <SelectItem value='male'>Male</SelectItem>
                                       <SelectItem value='female'>Female</SelectItem>
                                       <SelectItem value='other'>Other</SelectItem>
                                       <SelectItem value='prefer-not-to-say'>Prefer not to say</SelectItem>
                                    </SelectContent>
                                 </Select>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>
                  </div>

                  {/* Academic Information */}
                  <div>
                     <h3 className='text-lg font-semibold text-gray-900 mb-4'>Academic Information</h3>
                     <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <FormField
                           control={form.control}
                           name='university'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>University</FormLabel>
                                 <FormControl>
                                    <Input placeholder='Your university name' {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='department'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Department</FormLabel>
                                 <FormControl>
                                    <Input placeholder='Your department' {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='currentSemester'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Current Semester</FormLabel>
                                 <FormControl>
                                    <Input
                                       type='number'
                                       min='1'
                                       max='12'
                                       placeholder='1-12'
                                       {...field}
                                    />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='graduationYear'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Graduation Year</FormLabel>
                                 <FormControl>
                                    <Input
                                       type='number'
                                       min='2020'
                                       max='2035'
                                       placeholder='YYYY'
                                       {...field}
                                    />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='studentId'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Student ID</FormLabel>
                                 <FormControl>
                                    <Input placeholder='Your student ID' {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='degree'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Degree</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                       <SelectTrigger>
                                          <SelectValue placeholder='Select degree type' />
                                       </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       <SelectItem value='bachelor'>Bachelor</SelectItem>
                                       <SelectItem value='master'>Master</SelectItem>
                                       <SelectItem value='phd'>PhD</SelectItem>
                                       <SelectItem value='diploma'>Diploma</SelectItem>
                                       <SelectItem value='certificate'>Certificate</SelectItem>
                                       <SelectItem value='other'>Other</SelectItem>
                                    </SelectContent>
                                 </Select>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                     <h3 className='text-lg font-semibold text-gray-900 mb-4'>Contact Information</h3>
                     <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <FormField
                           control={form.control}
                           name='phone'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Phone</FormLabel>
                                 <FormControl>
                                    <Input
                                       type='tel'
                                       placeholder='Your phone number'
                                       {...field}
                                    />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='address.city'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>City</FormLabel>
                                 <FormControl>
                                    <Input placeholder='Your city' {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='address.state'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>State/Province</FormLabel>
                                 <FormControl>
                                    <Input placeholder='Your state or province' {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='address.country'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Country</FormLabel>
                                 <FormControl>
                                    <Input placeholder='Your country' {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>
                  </div>

                  {/* Social Links */}
                  <div>
                     <h3 className='text-lg font-semibold text-gray-900 mb-4'>Social Links</h3>
                     <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <FormField
                           control={form.control}
                           name='socialLinks.linkedin'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>LinkedIn</FormLabel>
                                 <FormControl>
                                    <Input
                                       type='url'
                                       placeholder='https://linkedin.com/in/username'
                                       {...field}
                                    />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='socialLinks.github'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>GitHub</FormLabel>
                                 <FormControl>
                                    <Input
                                       type='url'
                                       placeholder='https://github.com/username'
                                       {...field}
                                    />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='socialLinks.twitter'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Twitter</FormLabel>
                                 <FormControl>
                                    <Input
                                       type='url'
                                       placeholder='https://twitter.com/username'
                                       {...field}
                                    />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='socialLinks.website'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Website</FormLabel>
                                 <FormControl>
                                    <Input
                                       type='url'
                                       placeholder='https://yourwebsite.com'
                                       {...field}
                                    />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>
                  </div>

                  {/* Preferences */}
                  <div>
                     <h3 className='text-lg font-semibold text-gray-900 mb-4'>Preferences</h3>
                     <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <FormField
                           control={form.control}
                           name='theme'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Theme</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                       <SelectTrigger>
                                          <SelectValue placeholder='Select theme' />
                                       </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       <SelectItem value='light'>Light</SelectItem>
                                       <SelectItem value='dark'>Dark</SelectItem>
                                       <SelectItem value='auto'>Auto</SelectItem>
                                    </SelectContent>
                                 </Select>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='privacy.profileVisibility'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Profile Visibility</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                       <SelectTrigger>
                                          <SelectValue placeholder='Select visibility' />
                                       </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       <SelectItem value='public'>Public</SelectItem>
                                       <SelectItem value='university'>University Only</SelectItem>
                                       <SelectItem value='private'>Private</SelectItem>
                                    </SelectContent>
                                 </Select>
                                 <FormDescription>
                                    Control who can see your profile information
                                 </FormDescription>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>
                  </div>

                  {/* Email Notifications */}
                  <div>
                     <h3 className='text-lg font-semibold text-gray-900 mb-4'>Email Notifications</h3>
                     <div className='space-y-4'>
                        <FormField
                           control={form.control}
                           name='emailNotifications.newNotes'
                           render={({ field }) => (
                              <FormItem className='flex flex-row items-center space-x-3 space-y-0'>
                                 <FormControl>
                                    <Checkbox
                                       checked={field.value}
                                       onCheckedChange={field.onChange}
                                    />
                                 </FormControl>
                                 <div className='space-y-1 leading-none'>
                                    <FormLabel>
                                       New notes from people you follow
                                    </FormLabel>
                                 </div>
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='emailNotifications.comments'
                           render={({ field }) => (
                              <FormItem className='flex flex-row items-center space-x-3 space-y-0'>
                                 <FormControl>
                                    <Checkbox
                                       checked={field.value}
                                       onCheckedChange={field.onChange}
                                    />
                                 </FormControl>
                                 <div className='space-y-1 leading-none'>
                                    <FormLabel>
                                       Comments on your notes
                                    </FormLabel>
                                 </div>
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='emailNotifications.likes'
                           render={({ field }) => (
                              <FormItem className='flex flex-row items-center space-x-3 space-y-0'>
                                 <FormControl>
                                    <Checkbox
                                       checked={field.value}
                                       onCheckedChange={field.onChange}
                                    />
                                 </FormControl>
                                 <div className='space-y-1 leading-none'>
                                    <FormLabel>
                                       Likes on your notes
                                    </FormLabel>
                                 </div>
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='emailNotifications.weeklyDigest'
                           render={({ field }) => (
                              <FormItem className='flex flex-row items-center space-x-3 space-y-0'>
                                 <FormControl>
                                    <Checkbox
                                       checked={field.value}
                                       onCheckedChange={field.onChange}
                                    />
                                 </FormControl>
                                 <div className='space-y-1 leading-none'>
                                    <FormLabel>
                                       Weekly digest of new notes
                                    </FormLabel>
                                 </div>
                              </FormItem>
                           )}
                        />
                     </div>
                  </div>

                  {/* Submit Button */}
                  <div className='border-t pt-6'>
                     <div className='flex items-center justify-between'>
                        <div className='text-sm text-gray-500'>
                           {form.formState.isDirty && !updateLoading && (
                              <span>You have unsaved changes</span>
                           )}
                           {updateLoading && (
                              <span>Saving your changes...</span>
                           )}
                        </div>
                        <div className='flex space-x-4'>
                           <Button
                              type='button'
                              variant='outline'
                              onClick={() => form.reset()}
                              disabled={updateLoading}
                           >
                              Reset
                           </Button>
                           <Button
                              type='submit'
                              disabled={updateLoading || !form.formState.isDirty}
                           >
                              {updateLoading ? 'Saving...' : 'Save Changes'}
                           </Button>
                        </div>
                     </div>
                  </div>
               </form>
            </Form>
         </div>
      </div>
   )
}

export default Settings