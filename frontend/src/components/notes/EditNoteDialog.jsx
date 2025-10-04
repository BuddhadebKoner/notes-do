import { z } from 'zod'
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'
import { Label } from '../ui/label.jsx'
import { Textarea } from '../ui/textarea.jsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.jsx'
import { SearchableSelect } from '../ui/searchable-select.jsx'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form.jsx'
import { useUpdateNoteDetails } from '../../lib/react-query/queriesAndMutation.js'
import { useQueryClient } from '@tanstack/react-query'
import {
  WEST_BENGAL_UNIVERSITIES,
  BACHELOR_DEPARTMENTS,
  MASTER_DEPARTMENTS,
  DEGREE_TYPES,
  SEMESTER_OPTIONS,
  GRADUATION_YEARS,
} from '../../constants/constantData.js'
import {
  uploadNoteFormSchema,
  categoryOptions,
  difficultyOptions,
  visibilityOptions,
} from '../../_root/_profile/schemas/uploadNoteFormSchema.js'

// Create edit schema based on upload schema (excluding file field and relaxing some validations)
const editNoteFormSchema = uploadNoteFormSchema
  .omit({ noteFile: true })
  .extend({
    // Make academicYear more lenient for editing (it's auto-managed)
    academicYear: z.string().default('2024-25').optional(),
    // Keep tags as string for editing (don't transform to array until submission)
    tags: z.string().optional(),
  })

// Default values for edit form (must match schema defaults)
const defaultEditValues = {
  title: '',
  description: '',
  subject: '',
  university: '',
  degreeType: '',
  department: '',
  semester: '',
  graduationYear: '',
  academicYear: '2024-25', // Must match schema default and format
  category: 'lecture-notes',
  difficulty: 'intermediate',
  visibility: 'public',
  tags: '',
}

const EditNoteDialog = ({ isOpen, onClose, note }) => {
  const queryClient = useQueryClient()
  const [selectedDegreeType, setSelectedDegreeType] = useState('')
  const [originalValues, setOriginalValues] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  const {
    mutate: updateNoteDetails,
    isPending: isLoading,
    error: updateError,
  } = useUpdateNoteDetails()

  const form = useForm({
    resolver: zodResolver(editNoteFormSchema),
    defaultValues: defaultEditValues,
    mode: 'onChange', // Validate on change for better UX
    reValidateMode: 'onChange', // Re-validate on change
  })

  // Watch form values to detect changes
  const watchedValues = form.watch()

  // Reset form when note changes
  useEffect(() => {
    if (note && isOpen) {
      const degreeType = note.academic?.degree || 'bachelor'
      setSelectedDegreeType(degreeType)

      // Ensure academicYear is in correct format (YYYY-YY)
      const ensureAcademicYearFormat = academicYear => {
        if (!academicYear) return '2024-25'
        if (
          typeof academicYear === 'string' &&
          academicYear.match(/^\d{4}-\d{2}$/)
        ) {
          return academicYear
        }
        // Default to current academic year if format is invalid
        return '2024-25'
      }

      const formValues = {
        title: note.title || '',
        description: note.description || '',
        subject: note.subject?.name || note.subject || '',
        university:
          note.academic?.university === 'ALL'
            ? ''
            : note.academic?.university || '',
        degreeType: degreeType === 'ALL' ? '' : degreeType,
        department:
          note.academic?.department === 'ALL'
            ? ''
            : note.academic?.department || '',
        semester:
          note.academic?.semester === 0
            ? ''
            : note.academic?.semester?.toString() || '',
        graduationYear: note.academic?.graduationYear?.toString() || '',
        academicYear: ensureAcademicYearFormat(note.academic?.academicYear),
        category: note.subject?.category || 'lecture-notes',
        difficulty: note.subject?.difficulty || 'intermediate',
        visibility: note.visibility || 'public',
        tags: Array.isArray(note.tags) ? note.tags.join(', ') : note.tags || '',
      }

      form.reset(formValues)
      setOriginalValues(formValues)
      setHasChanges(false)
    }
  }, [note, isOpen, form])

  // Detect changes by comparing current values with original values
  useEffect(() => {
    if (Object.keys(originalValues).length === 0) return

    const currentValues = form.getValues()
    const hasFormChanges = Object.keys(originalValues).some(key => {
      const original = originalValues[key]
      const current = currentValues[key]

      // Handle empty strings and undefined as equivalent for optional fields
      const normalizeValue = val => {
        if (val === '' || val === undefined || val === null) return ''
        return String(val).trim()
      }

      return normalizeValue(original) !== normalizeValue(current)
    })

    setHasChanges(hasFormChanges)
  }, [watchedValues, originalValues, form, hasChanges])

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
    try {
      // Pre-validation checks
      if (!note?._id) {
        form.setError('root', {
          message: 'Note ID is missing',
        })
        return
      }

      // Transform data for API - react-hook-form already validated with Zod
      const updateData = {
        title: values.title.trim(),
        description: values.description.trim(),
        subject: values.subject.trim(),
        university: values.university,
        degree: values.degreeType,
        department: values.department,
        semester: values.semester,
        graduationYear: values.graduationYear,
        // Preserve course information (required fields)
        courseCode: note.academic?.course?.code,
        courseName: note.academic?.course?.name,
        courseCredits: note.academic?.course?.credits,
        category: values.category,
        difficulty: values.difficulty,
        visibility: values.visibility,
        tags: values.tags || '',
      }

      updateNoteDetails(
        { noteId: note._id, ...updateData },
        {
          onSuccess: data => {
            // Clear any lingering errors
            form.clearErrors()
            setHasChanges(false)
            // Update original values to reflect the changes
            const newValues = form.getValues()
            setOriginalValues(newValues)

            // Invalidate relevant queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['notes'] })
            queryClient.invalidateQueries({ queryKey: ['note', note._id] })
            queryClient.invalidateQueries({ queryKey: ['userNotes'] })

            onClose()
          },
          onError: error => {
            // Handle different API error structures
            let errorMessage = 'Failed to update note. Please try again.'

            if (error) {
              // Handle array of errors
              if (error.errors && Array.isArray(error.errors)) {
                errorMessage = error.errors.join(', ')
              }
              // Handle single error message
              else if (error.message) {
                errorMessage = error.message
              }
              // Handle string error
              else if (typeof error === 'string') {
                errorMessage = error
              }
            }

            form.setError('root', {
              message: errorMessage,
            })
          },
        }
      )
    } catch (error) {
      form.setError('root', {
        message: 'An unexpected error occurred. Please try again.',
      })
    }
  }

  const handleClose = () => {
    // Reset form to default state
    form.reset(defaultEditValues)
    form.clearErrors()
    setSelectedDegreeType('bachelor')
    setOriginalValues({})
    setHasChanges(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[800px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            Edit Note
            {hasChanges && (
              <span className='text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full'>
                Unsaved changes
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Update your note details. Changes will only be saved when you click
            "Update Note".
          </DialogDescription>

          {/* File restriction notice */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center'>
                  <span className='text-blue-600 text-xs'>ℹ️</span>
                </div>
              </div>
              <div className='ml-3'>
                <p className='text-sm text-blue-800'>
                  <strong>Edit Note Details:</strong> You can update all
                  information except the uploaded file. No Google Drive
                  connection required for editing.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Error Display */}
            {(form.formState.errors.root || updateError) && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <div className='flex'>
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-red-800'>Error</h3>
                    <div className='mt-2 text-sm text-red-700'>
                      {form.formState.errors.root?.message ||
                        updateError?.message ||
                        'An error occurred'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className='bg-gray-50 rounded-lg p-4'>
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
                        <Input placeholder='e.g., Data Structures' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='mt-4'>
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
              </div>
            </div>

            {/* Academic Information */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Academic Information (Optional)
              </h3>
              <p className='text-sm text-gray-600 mb-4'>
                Help others find your notes by providing academic context. All
                fields are optional.
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='university'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={WEST_BENGAL_UNIVERSITIES.map(university => ({
                            label: university,
                            value: university,
                          }))}
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          placeholder='Select university (optional)'
                          searchPlaceholder='Search universities...'
                          emptyText='No university found.'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='degreeType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree Type</FormLabel>
                      <Select
                        onValueChange={value => {
                          field.onChange(value)
                          setSelectedDegreeType(value)
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select degree type (optional)' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEGREE_TYPES.map(degree => (
                            <SelectItem key={degree.value} value={degree.value}>
                              {degree.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optional field to help categorize your notes
                      </FormDescription>
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
                        <SearchableSelect
                          options={getDepartmentOptions()}
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          placeholder='Select department (optional)'
                          searchPlaceholder='Search departments...'
                          emptyText='No department found.'
                        />
                      </FormControl>
                      <FormDescription>
                        Optional field to help categorize your notes
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
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select semester (optional)' />
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
                        <SearchableSelect
                          options={GRADUATION_YEARS.map(year => ({
                            label: year.label,
                            value: year.value,
                          }))}
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          placeholder='Select graduation year (optional)'
                          searchPlaceholder='Search years...'
                          emptyText='No year found.'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className='bg-gray-50 rounded-lg p-4'>
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
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select category' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
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
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select difficulty' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {difficultyOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
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
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select visibility' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {visibilityOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
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

            <DialogFooter className='flex flex-col gap-2'>
              {/* Help text for update button state */}
              {!hasChanges && !isLoading && (
                <p className='text-xs text-gray-500 text-center'>
                  Make changes to enable the Update button
                </p>
              )}
              {hasChanges && !form.formState.isValid && (
                <p className='text-xs text-red-500 text-center'>
                  Please fix form errors before updating
                </p>
              )}

              <div className='flex gap-2 justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isLoading || !hasChanges || !form.formState.isValid}
                  className='min-w-32'
                  variant={
                    hasChanges && form.formState.isValid
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {isLoading ? (
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Note'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditNoteDialog
