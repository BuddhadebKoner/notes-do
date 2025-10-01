import React, { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'
import { setAuthToken } from '../../../config/api.js'
import { useUploadNote } from '../../../lib/react-query/queriesAndMutation.js'
import GoogleDriveConnect from '../../../components/google/GoogleDriveConnect.jsx'
import UploadProgressDialog from '../../../components/upload/UploadProgressDialog.jsx'
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card.jsx'
import {
  Upload,
  AlertTriangle,
  CheckCircle,
  X,
  Target,
  FileText,
  RotateCcw,
  Loader2,
  ExternalLink,
  User,
} from 'lucide-react'

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
  const [uploadStatus, setUploadStatus] = useState('idle') // 'idle', 'uploading', 'success', 'error'
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFileName, setUploadFileName] = useState('')
  const [preventClose, setPreventClose] = useState(false)
  const fileInputRef = useRef(null)

  const form = useForm({
    resolver: zodResolver(uploadNoteFormSchema),
    defaultValues: defaultUploadValues,
  })

  // Prevent tab closing/reloading during upload
  useEffect(() => {
    const handleBeforeUnload = e => {
      if (preventClose) {
        e.preventDefault()
        e.returnValue = 'Upload in progress. Are you sure you want to leave?'
        return 'Upload in progress. Are you sure you want to leave?'
      }
    }

    if (preventClose) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [preventClose])

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

    // Additional validation for department compatibility with degree type (only if both are provided)
    if (values.department && values.degreeType) {
      const validDepartments = getDepartmentOptions().map(dept => dept.value)
      if (!validDepartments.includes(values.department)) {
        form.setError('department', {
          message: `Selected department is not available for ${values.degreeType} degree`,
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

      // Show upload dialog and prevent browser closing
      setUploadFileName(values.noteFile.name)
      setUploadStatus('uploading')
      setShowUploadDialog(true)
      setPreventClose(true)

      // Use React Query mutation
      uploadNote(uploadFormData, {
        onSuccess: result => {
          setUploadStatus('success')
          setPreventClose(false)

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
          setUploadStatus('error')
          setPreventClose(false)

          // Enhanced error handling for different error types
          let errorMessage = 'Failed to upload note. Please try again.'

          if (
            error.code === 'ECONNABORTED' ||
            error.message?.includes('timeout')
          ) {
            errorMessage =
              'Upload timed out. Please check your internet connection and try again.'
          } else if (error.message?.includes('Network Error')) {
            errorMessage =
              'Network connection lost. Please check your internet and try again.'
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message
          } else if (error.message) {
            errorMessage = error.message
          }

          // Set form errors based on API response
          if (error.response?.data?.errors) {
            Object.entries(error.response.data.errors).forEach(
              ([field, message]) => {
                form.setError(field, { message })
              }
            )
          } else {
            form.setError('root', { message: errorMessage })
          }
        },
      })
    } catch (error) {
      form.setError('root', {
        message: 'An unexpected error occurred. Please try again.',
      })
    }
  }

  return (
    <div className='min-h-screen bg-background py-6'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-foreground'>Upload Notes</h1>
          <p className='text-muted-foreground mt-1'>
            Share your study materials with the academic community
          </p>
        </div>

        <Card>
          <CardContent className='p-6'>
            {/* Google Drive Connection */}
            <div className='mb-6'>
              <GoogleDriveConnect onConnected={setDriveConnected} />
            </div>

            {/* Connection Required Notice */}
            {!driveConnected && (
              <Card className='mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800'>
                <CardContent className='p-6'>
                  <div className='flex items-start'>
                    <div className='flex-shrink-0'>
                      <div className='w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center'>
                        <AlertTriangle className='w-4 h-4 text-amber-600 dark:text-amber-400' />
                      </div>
                    </div>
                    <div className='ml-4'>
                      <h3 className='text-lg font-medium text-amber-800 dark:text-amber-200 mb-2'>
                        Google Drive Connection Required
                      </h3>
                      <p className='text-sm text-amber-700 dark:text-amber-300'>
                        You must connect to Google Drive before uploading notes.
                        All notes are stored in your Google Drive for easy
                        access and backup.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Form {...form}>
              <div
                className={`relative ${!driveConnected ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-8'
                >
                  {/* Display root form errors */}
                  {form.formState.errors.root && (
                    <Card className='border-destructive bg-destructive/10 dark:bg-destructive/20'>
                      <CardContent className='p-4'>
                        <div className='flex items-start'>
                          <X className='w-4 h-4 text-destructive mt-0.5 mr-3' />
                          <div>
                            <h3 className='text-sm font-medium text-destructive'>
                              Upload Failed
                            </h3>
                            <div className='mt-2 text-sm text-destructive/80'>
                              {form.formState.errors.root.message}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                              disabled={!driveConnected}
                              onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  onChange(file) // Update form state
                                }
                              }}
                              className={`file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
                                !driveConnected
                                  ? 'file:bg-gray-100 file:text-gray-400 cursor-not-allowed opacity-50'
                                  : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                              }`}
                              // Don't spread field props for file inputs
                            />
                            {value && (
                              <p className='text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2'>
                                <CheckCircle className='w-3 h-3' />
                                Selected: {value.name} (
                                {(value.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload a PDF file (max 100MB). Only PDF files are
                          supported.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Basic Information */}
                  <Card className='bg-muted/50'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <FileText className='w-5 h-5' />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                  disabled={!driveConnected}
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
                                  disabled={!driveConnected}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

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
                            disabled={!driveConnected}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of what this note
                          covers (10-1000 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Additional Information */}
                  <Card className='bg-muted/50'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <Upload className='w-5 h-5' />
                        Additional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                  <SelectTrigger disabled={!driveConnected}>
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
                                  <SelectTrigger disabled={!driveConnected}>
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
                                  <SelectTrigger disabled={!driveConnected}>
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
                    </CardContent>
                  </Card>

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
                          Add comma-separated tags to help others find your
                          notes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Target Audience (Optional) */}
                  <Card className='bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100'>
                        <Target className='w-5 h-5' />
                        Target Audience (Optional)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='mb-4'>
                        <p className='text-sm text-blue-700 dark:text-blue-300'>
                          Help others find your notes by specifying the target
                          audience. Leave empty to make it available for all
                          academic levels (Academic Independent).
                        </p>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        <FormField
                          control={form.control}
                          name='university'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>University</FormLabel>
                              <Select
                                onValueChange={value =>
                                  field.onChange(value === 'all' ? '' : value)
                                }
                                value={field.value || 'all'}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Any University' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value='all'>
                                    Any University
                                  </SelectItem>
                                  {WEST_BENGAL_UNIVERSITIES.map(university => (
                                    <SelectItem
                                      key={university}
                                      value={university}
                                    >
                                      {university}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Leave empty for all universities
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className='lg:col-span-1'>
                          <FormLabel>Degree Type</FormLabel>
                          <Select
                            onValueChange={value => {
                              const degreeValue = value === 'all' ? '' : value
                              setSelectedDegreeType(degreeValue || 'bachelor')
                              form.setValue('degreeType', degreeValue)
                              // Reset department when degree type changes
                              if (degreeValue === '') {
                                form.setValue('department', '')
                              }
                            }}
                            value={form.watch('degreeType') || 'all'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Any Degree Level' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='all'>
                                Any Degree Level
                              </SelectItem>
                              {DEGREE_TYPES.map(degree => (
                                <SelectItem
                                  key={degree.value}
                                  value={degree.value}
                                >
                                  {degree.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Leave empty for all degree levels
                          </FormDescription>
                        </div>

                        <FormField
                          control={form.control}
                          name='department'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select
                                onValueChange={value =>
                                  field.onChange(value === 'all' ? '' : value)
                                }
                                value={field.value || 'all'}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Any Department' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value='all'>
                                    Any Department
                                  </SelectItem>
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
                                Leave empty for all departments
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
                              <FormLabel>Semester</FormLabel>
                              <Select
                                onValueChange={value =>
                                  field.onChange(value === 'all' ? '' : value)
                                }
                                value={field.value || 'all'}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Any Semester' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value='all'>
                                    Any Semester
                                  </SelectItem>
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
                                Leave empty for all semesters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className='lg:col-span-1'>
                          <FormLabel>Graduation Year</FormLabel>
                          <Select
                            onValueChange={value =>
                              form.setValue(
                                'graduationYear',
                                value === 'all' ? '' : value
                              )
                            }
                            value={form.watch('graduationYear') || 'all'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Any Graduation Year' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='all'>
                                Any Graduation Year
                              </SelectItem>
                              {GRADUATION_YEARS.map(year => (
                                <SelectItem key={year.value} value={year.value}>
                                  {year.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className='text-xs'>
                            Leave empty for all graduation years
                          </FormDescription>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <Card className='bg-muted/50 border-t'>
                    <CardContent className='p-6'>
                      <div className='flex items-center justify-between'>
                        <div className='text-sm text-muted-foreground'>
                          {!driveConnected && (
                            <span className='text-amber-600 dark:text-amber-400 flex items-center gap-1'>
                              <AlertTriangle className='w-3 h-3' />
                              Google Drive not connected
                            </span>
                          )}
                          {driveConnected &&
                            form.formState.isDirty &&
                            !isUploading && (
                              <span className='text-emerald-600 dark:text-emerald-400 flex items-center gap-1'>
                                <CheckCircle className='w-3 h-3' />
                                Ready to upload
                              </span>
                            )}
                          {isUploading && (
                            <span className='flex items-center gap-1'>
                              <Loader2 className='w-3 h-3 animate-spin' />
                              Uploading your note...
                            </span>
                          )}
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
                            <RotateCcw className='w-4 h-4' />
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
                              !driveConnected
                                ? 'Connect to Google Drive first'
                                : ''
                            }
                          >
                            {isUploading ? (
                              <div className='flex items-center gap-2'>
                                <Loader2 className='w-4 h-4 animate-spin' />
                                <span>Uploading...</span>
                              </div>
                            ) : !driveConnected ? (
                              'Connect Drive First'
                            ) : (
                              <>
                                <Upload className='w-4 h-4' />
                                Upload Note
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </div>
            </Form>

            {/* Upload Result */}
            {uploadResult && (
              <Card className='mt-6 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'>
                <CardContent className='p-6'>
                  <div className='flex items-start'>
                    <div className='flex-shrink-0'>
                      <div className='w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center'>
                        <CheckCircle className='w-4 h-4 text-emerald-600 dark:text-emerald-400' />
                      </div>
                    </div>
                    <div className='ml-4 flex-1'>
                      <h3 className='text-lg font-medium text-emerald-800 dark:text-emerald-200 mb-3'>
                        Upload Successful!
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-emerald-700 dark:text-emerald-300'>
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
                            {(
                              uploadResult.note.file.size /
                              1024 /
                              1024
                            ).toFixed(2)}{' '}
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
                                <ExternalLink className='w-4 h-4' />
                                View PDF in Google Drive
                              </a>
                            </Button>
                          </div>
                        )}

                      {/* Warning message if available */}
                      {uploadResult.warning && (
                        <div className='mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md'>
                          <p className='text-xs text-amber-700 dark:text-amber-300 italic'>
                            <strong>Note:</strong> {uploadResult.warning}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Error */}
            {uploadError && (
              <Card className='mt-6 bg-destructive/10 dark:bg-destructive/20 border-destructive'>
                <CardContent className='p-6'>
                  <div className='flex items-start'>
                    <div className='flex-shrink-0'>
                      <div className='w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center'>
                        <X className='w-4 h-4 text-destructive' />
                      </div>
                    </div>
                    <div className='ml-4'>
                      <h3 className='text-lg font-medium text-destructive mb-2'>
                        Upload Failed
                      </h3>
                      <p className='text-sm text-destructive/80'>
                        {uploadError?.message ||
                          'An error occurred during upload. Please try again.'}
                      </p>
                      {uploadError?.response?.data?.details && (
                        <div className='mt-2 text-xs text-destructive/70'>
                          <strong>Details:</strong>{' '}
                          {uploadError.response.data.details}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Info */}
            {clerkUser && (
              <Card className='mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'>
                <CardContent className='p-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center'>
                      <User className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                    </div>
                    <div>
                      <h3 className='text-sm font-medium text-blue-800 dark:text-blue-200'>
                        Uploading as:
                      </h3>
                      <p className='text-sm text-blue-700 dark:text-blue-300'>
                        {clerkUser.firstName} {clerkUser.lastName} (
                        {clerkUser.primaryEmailAddress?.emailAddress})
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Progress Dialog */}
      <UploadProgressDialog
        isOpen={showUploadDialog}
        onClose={() => {
          setShowUploadDialog(false)
          setUploadStatus('idle')
          setUploadFileName('')
          setPreventClose(false)
        }}
        uploadStatus={uploadStatus}
        fileName={uploadFileName}
        uploadResult={uploadResult}
        uploadError={uploadError}
      />
    </div>
  )
}

export default UploadNote
