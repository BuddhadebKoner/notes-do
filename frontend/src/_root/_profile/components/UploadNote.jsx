import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'
import { setAuthToken } from '../../../config/api.js'
import { useUploadNote } from '../../../lib/react-query/queriesAndMutation.js'
import GoogleDriveConnect from '../../../components/google/GoogleDriveConnect.jsx'
import {
  uploadNoteFormSchema,
  defaultUploadValues,
  categoryOptions,
  difficultyOptions,
  visibilityOptions,
} from '../schemas/uploadNoteFormSchema.js'
import {
  WEST_BENGAL_UNIVERSITIES,
  BACHELOR_DEPARTMENTS,
  MASTER_DEPARTMENTS,
  DEGREE_TYPES,
  SEMESTER_OPTIONS,
  GRADUATION_YEARS,
} from '../../../constants/constantData.js'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select.jsx'

const UploadNote = () => {
  const { getToken } = useClerkAuth()
  const { user: clerkUser } = useUser()
  const {
    mutate: uploadNote,
    data: uploadResult,
    isPending: isUploading,
    error: uploadError,
  } = useUploadNote()

  const [driveConnected, setDriveConnected] = useState(
    localStorage.getItem('googleDriveToken') !== null
  )
  const [selectedDegreeType, setSelectedDegreeType] = useState('bachelor')
  const fileInputRef = useRef(null)

  const form = useForm({
    resolver: zodResolver(uploadNoteFormSchema),
    defaultValues: defaultUploadValues,
  })

  // Get departments based on selected degree type
  const getDepartmentOptions = () => {
    switch (selectedDegreeType) {
      case 'bachelor':
        return BACHELOR_DEPARTMENTS.map(dept => ({ value: dept, label: dept }))
      case 'master':
        return MASTER_DEPARTMENTS.map(dept => ({ value: dept, label: dept }))
      default:
        return [...BACHELOR_DEPARTMENTS, ...MASTER_DEPARTMENTS]
          .sort()
          .map(dept => ({ value: dept, label: dept }))
    }
  }

  const onSubmit = async values => {
    // Check Google Drive connection first
    if (!driveConnected) {
      form.setError('root', {
        message: 'Please connect to Google Drive before uploading notes.',
      })
      return
    }

    // Additional validation for department compatibility with degree type
    if (values.department && selectedDegreeType) {
      const validDepartments = getDepartmentOptions().map(dept => dept.value)
      if (!validDepartments.includes(values.department)) {
        form.setError('department', {
          message: `Selected department is not available for ${selectedDegreeType} degree`,
        })
        return
      }
    }

    try {
      // Get Clerk token
      const token = await getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      // Set auth token
      setAuthToken(token)

      // Create FormData
      const uploadFormData = new FormData()

      // Add file
      uploadFormData.append('noteFile', values.noteFile)

      // Add form data (convert tags array back to string)
      const formDataToSend = {
        ...values,
        degreeType: selectedDegreeType, // Ensure degreeType is included
        tags: Array.isArray(values.tags) ? values.tags.join(', ') : values.tags,
      }

      // Add all form fields except file
      Object.entries(formDataToSend).forEach(([key, value]) => {
        if (key !== 'noteFile' && value !== undefined && value !== '') {
          uploadFormData.append(key, String(value))
        }
      })

      // Add Google Drive token if available
      const googleDriveToken = localStorage.getItem('googleDriveToken')
      if (googleDriveToken) {
        uploadFormData.append('googleDriveToken', googleDriveToken)
      }

      // Use React Query mutation
      uploadNote(uploadFormData, {
        onSuccess: result => {
          if (result.success) {
            // Reset form on success
            form.reset(defaultUploadValues)
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          }
        },
        onError: error => {
          console.error('Upload error:', error)

          // Set form errors based on API response
          if (error.response?.data?.errors) {
            Object.entries(error.response.data.errors).forEach(
              ([field, message]) => {
                form.setError(field, { message })
              }
            )
          } else {
            // Generic error handling
            form.setError('root', {
              message:
                error.message || 'Failed to upload note. Please try again.',
            })
          }
        },
      })
    } catch (error) {
      console.error('Unexpected error:', error)
      form.setError('root', {
        message: 'An unexpected error occurred. Please try again.',
      })
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 py-6'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Upload Notes</h1>
          <p className='text-gray-600 mt-1'>
            Share your study materials with the academic community
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-sm border p-6'>
          {/* Google Drive Connection */}
          <div className='mb-6'>
            <GoogleDriveConnect onConnected={setDriveConnected} />
          </div>

          {/* Connection Required Notice */}
          {!driveConnected && (
            <div className='mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                    <span className='text-yellow-600 text-sm'>⚠️</span>
                  </div>
                </div>
                <div className='ml-4'>
                  <h3 className='text-lg font-medium text-yellow-800 mb-2'>
                    Google Drive Connection Required
                  </h3>
                  <p className='text-sm text-yellow-700'>
                    You must connect to Google Drive before uploading notes. All
                    notes are stored in your Google Drive for easy access and
                    backup.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              {/* Display root form errors */}
              {form.formState.errors.root && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                  <div className='flex'>
                    <div className='ml-3'>
                      <h3 className='text-sm font-medium text-red-800'>
                        Upload Failed
                      </h3>
                      <div className='mt-2 text-sm text-red-700'>
                        {form.formState.errors.root.message}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* File Upload */}
              <FormField
                control={form.control}
                name='noteFile'
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>PDF File *</FormLabel>
                    <FormControl>
                      <div className='space-y-2'>
                        <Input
                          type='file'
                          accept='.pdf'
                          ref={fileInputRef}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              onChange(file) // Update form state
                            }
                          }}
                          className='file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                          // Don't spread field props for file inputs
                        />
                        {value && (
                          <p className='text-sm text-green-600'>
                            Selected: {value.name} (
                            {(value.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload a PDF file (max 50MB). Only PDF files are
                      supported.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Basic Information */}
              <div className='bg-gray-50 rounded-lg p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Basic Information
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='title'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., Data Structures - Linked Lists'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='subject'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., Data Structures'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Brief description of the notes content...'
                        className='resize-none'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed description of what this note covers
                      (10-1000 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Academic Information */}
              <div className='bg-gray-50 rounded-lg p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Academic Information
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  <FormField
                    control={form.control}
                    name='university'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select university' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WEST_BENGAL_UNIVERSITIES.map(university => (
                              <SelectItem key={university} value={university}>
                                {university}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='lg:col-span-1'>
                    <FormLabel>Degree Type *</FormLabel>
                    <Select
                      onValueChange={value => {
                        setSelectedDegreeType(value)
                        // Reset department when degree type changes
                        form.setValue('department', '')
                      }}
                      value={selectedDegreeType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select degree type' />
                      </SelectTrigger>
                      <SelectContent>
                        {DEGREE_TYPES.map(degree => (
                          <SelectItem key={degree.value} value={degree.value}>
                            {degree.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FormField
                    control={form.control}
                    name='department'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select department' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getDepartmentOptions().map(department => (
                              <SelectItem
                                key={department.value}
                                value={department.value}
                              >
                                {department.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {selectedDegreeType &&
                            `Showing ${selectedDegreeType} departments`}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='semester'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select semester' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SEMESTER_OPTIONS.map(semester => (
                              <SelectItem
                                key={semester.value}
                                value={semester.value}
                              >
                                {semester.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the semester for which these notes are relevant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='lg:col-span-1'>
                    <FormLabel>Graduation Year</FormLabel>
                    <Select
                      onValueChange={value =>
                        form.setValue('graduationYear', value)
                      }
                      defaultValue={new Date().getFullYear().toString()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select graduation year' />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADUATION_YEARS.map(year => (
                          <SelectItem key={year.value} value={year.value}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className='text-xs'>
                      Expected graduation year
                    </FormDescription>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className='bg-gray-50 rounded-lg p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Additional Information
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <FormField
                    control={form.control}
                    name='category'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select category' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions.map(option => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the most appropriate category
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='difficulty'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select difficulty' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {difficultyOptions.map(option => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='visibility'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select visibility' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {visibilityOptions.map(option => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Control who can see this note
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Tags */}
              <FormField
                control={form.control}
                name='tags'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., algorithms, data structures, programming'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add comma-separated tags to help others find your notes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className='bg-gray-50 rounded-lg p-6 border-t'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-gray-500'>
                    {!driveConnected && (
                      <span className='text-yellow-600'>
                        ⚠️ Google Drive not connected
                      </span>
                    )}
                    {driveConnected &&
                      form.formState.isDirty &&
                      !isUploading && (
                        <span className='text-green-600'>
                          ✓ Ready to upload
                        </span>
                      )}
                    {isUploading && <span>Uploading your note...</span>}
                  </div>
                  <div className='flex space-x-4'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        form.reset(defaultUploadValues)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      disabled={isUploading}
                    >
                      Reset
                    </Button>
                    <Button
                      type='submit'
                      disabled={
                        isUploading ||
                        !form.watch('noteFile') ||
                        !driveConnected
                      }
                      className='min-w-32'
                      title={
                        !driveConnected ? 'Connect to Google Drive first' : ''
                      }
                    >
                      {isUploading ? (
                        <div className='flex items-center space-x-2'>
                          <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                          <span>Uploading...</span>
                        </div>
                      ) : !driveConnected ? (
                        'Connect Drive First'
                      ) : (
                        'Upload Note'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>

          {/* Upload Result */}
          {uploadResult && (
            <div className='mt-6 p-6 bg-green-50 border border-green-200 rounded-lg'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                    <span className='text-green-600 text-sm'>✓</span>
                  </div>
                </div>
                <div className='ml-4 flex-1'>
                  <h3 className='text-lg font-medium text-green-800 mb-3'>
                    Upload Successful!
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700'>
                    <div className='space-y-2'>
                      <p>
                        <strong>Title:</strong> {uploadResult.note.title}
                      </p>
                      <p>
                        <strong>Subject:</strong>{' '}
                        {uploadResult.note.subject?.name ||
                          uploadResult.note.subject}
                      </p>
                      <p>
                        <strong>University:</strong>{' '}
                        {uploadResult.note.academic?.university ||
                          uploadResult.note.university}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <p>
                        <strong>Status:</strong> {uploadResult.note.status}
                      </p>
                      <p>
                        <strong>File Size:</strong>{' '}
                        {(uploadResult.note.file.size / 1024 / 1024).toFixed(2)}{' '}
                        MB
                      </p>
                      <p>
                        <strong>Storage:</strong>{' '}
                        {uploadResult.storageLocation === 'google-drive'
                          ? 'Google Drive'
                          : 'Local Storage'}
                      </p>
                    </div>
                  </div>

                  {/* View PDF Button */}
                  {uploadResult.file?.webViewLink &&
                    uploadResult.file.webViewLink !==
                      'https://drive.google.com/drive/my-drive' && (
                      <div className='mt-4'>
                        <Button
                          asChild
                          size='sm'
                          className='bg-blue-600 hover:bg-blue-700'
                        >
                          <a
                            href={uploadResult.file.webViewLink}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            📄 View PDF in Google Drive
                          </a>
                        </Button>
                      </div>
                    )}

                  {/* Warning message if available */}
                  {uploadResult.warning && (
                    <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
                      <p className='text-xs text-yellow-700 italic'>
                        <strong>Note:</strong> {uploadResult.warning}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className='mt-6 p-6 bg-red-50 border border-red-200 rounded-lg'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
                    <span className='text-red-600 text-sm'>✕</span>
                  </div>
                </div>
                <div className='ml-4'>
                  <h3 className='text-lg font-medium text-red-800 mb-2'>
                    Upload Failed
                  </h3>
                  <p className='text-sm text-red-700'>
                    {uploadError?.message ||
                      'An error occurred during upload. Please try again.'}
                  </p>
                  {uploadError?.response?.data?.details && (
                    <div className='mt-2 text-xs text-red-600'>
                      <strong>Details:</strong>{' '}
                      {uploadError.response.data.details}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* User Info */}
          {clerkUser && (
            <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-center space-x-3'>
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <span className='text-blue-600 text-sm font-medium'>
                    {clerkUser.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className='text-sm font-medium text-blue-800'>
                    Uploading as:
                  </h3>
                  <p className='text-sm text-blue-700'>
                    {clerkUser.firstName} {clerkUser.lastName} (
                    {clerkUser.primaryEmailAddress?.emailAddress})
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UploadNote
