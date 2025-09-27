import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Switch } from '../ui/switch.jsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.jsx'
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
import {
  WEST_BENGAL_UNIVERSITIES,
  BACHELOR_DEPARTMENTS,
  MASTER_DEPARTMENTS,
  DEGREE_TYPES,
  SEMESTER_OPTIONS,
  GRADUATION_YEARS,
} from '../../constants/constantData.js'

// Edit note form validation schema with proper Zod state management
const editNoteFormSchema = z.object({
  // Basic Information - Required fields
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .refine(val => val.length > 0, 'Title is required'),

  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .refine(val => val.length > 0, 'Description is required'),

  subject: z
    .string()
    .trim()
    .min(2, 'Subject must be at least 2 characters')
    .max(100, 'Subject must be less than 100 characters')
    .refine(val => val.length > 0, 'Subject is required'),

  // Academic Information - Required fields with validation
  university: z
    .string()
    .trim()
    .min(1, 'Please select a university')
    .refine(
      val => WEST_BENGAL_UNIVERSITIES.includes(val),
      'Please select a valid university'
    ),

  degreeType: z
    .string()
    .min(1, 'Please select a degree type')
    .refine(
      val => DEGREE_TYPES.some(type => type.value === val),
      'Please select a valid degree type'
    ),

  department: z
    .string()
    .trim()
    .min(1, 'Please select a department')
    .refine(val => {
      const allDepartments = [...BACHELOR_DEPARTMENTS, ...MASTER_DEPARTMENTS]
      return allDepartments.includes(val)
    }, 'Please select a valid department'),

  semester: z
    .string()
    .min(1, 'Please select a semester')
    .refine(val => {
      const semesterNum = parseInt(val)
      return semesterNum >= 1 && semesterNum <= 12
    }, 'Please select a valid semester (1-12)'),

  graduationYear: z
    .string()
    .min(1, 'Please select graduation year')
    .refine(val => {
      const year = parseInt(val)
      const currentYear = new Date().getFullYear()
      return year >= currentYear && year <= currentYear + 15
    }, 'Please select a valid graduation year'),

  // Additional Information with defaults and validation
  category: z
    .enum(
      [
        'lecture-notes',
        'assignment',
        'exam-preparation',
        'project-report',
        'research-paper',
        'tutorial',
        'lab-manual',
        'reference-material',
      ],
      {
        errorMap: () => ({ message: 'Please select a valid category' }),
      }
    )
    .default('lecture-notes'),

  difficulty: z
    .enum(['beginner', 'intermediate', 'advanced'], {
      errorMap: () => ({ message: 'Please select a valid difficulty level' }),
    })
    .default('intermediate'),

  visibility: z
    .enum(['public', 'university', 'department', 'course', 'private'], {
      errorMap: () => ({ message: 'Please select a valid visibility option' }),
    })
    .default('university'),

  // Tags - optional with validation
  tags: z
    .string()
    .optional()
    .transform(val => val?.trim() || '')
    .refine(val => {
      if (!val) return true
      const tags = val
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
      return tags.length <= 10
    }, 'Maximum 10 tags allowed')
    .refine(val => {
      if (!val) return true
      const tags = val
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
      return tags.every(tag => tag.length <= 50)
    }, 'Each tag must be 50 characters or less'),
})

// Infer the type from schema for TypeScript-like validation
const defaultEditValues = {
  title: '',
  description: '',
  subject: '',
  university: '',
  degreeType: 'bachelor',
  department: '',
  semester: '',
  graduationYear: '',
  category: 'lecture-notes',
  difficulty: 'intermediate',
  visibility: 'university',
  tags: '',
}

const categoryOptions = [
  { value: 'lecture-notes', label: 'Lecture Notes' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'exam-preparation', label: 'Exam Preparation' },
  { value: 'project-report', label: 'Project Report' },
  { value: 'research-paper', label: 'Research Paper' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'lab-manual', label: 'Lab Manual' },
  { value: 'reference-material', label: 'Reference Material' },
]

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const visibilityOptions = [
  { value: 'public', label: 'Public' },
  { value: 'university', label: 'University Only' },
  { value: 'department', label: 'Department Only' },
  { value: 'course', label: 'Course Only' },
  { value: 'private', label: 'Private' },
]

const EditNoteDialog = ({ isOpen, onClose, note }) => {
  const [selectedDegreeType, setSelectedDegreeType] = useState('')

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

  // Reset form when note changes
  useEffect(() => {
    if (note && isOpen) {
      console.log('Setting form data with note:', note)

      const degreeType = note.academic?.degree || 'bachelor'
      setSelectedDegreeType(degreeType)

      // Calculate graduation year if missing (current year + typical degree duration)
      const currentYear = new Date().getFullYear()
      const semesterNum = note.academic?.semester || 1

      // Estimate based on degree type and current semester
      let estimatedGradYear = currentYear
      if (degreeType === 'bachelor') {
        estimatedGradYear =
          currentYear + Math.max(1, Math.ceil((8 - semesterNum) / 2))
      } else if (degreeType === 'master') {
        estimatedGradYear =
          currentYear + Math.max(1, Math.ceil((4 - semesterNum) / 2))
      } else {
        estimatedGradYear = currentYear + 1 // Default for other degrees
      }

      // Ensure the estimated year is within valid range (current year to +15 years)
      estimatedGradYear = Math.max(
        currentYear,
        Math.min(currentYear + 15, estimatedGradYear)
      )

      console.log('Graduation year data:', {
        existing: note.academic?.graduationYear,
        estimated: estimatedGradYear,
        willUse:
          note.academic?.graduationYear?.toString() ||
          estimatedGradYear.toString(),
      })

      form.reset({
        title: note.title || '',
        description: note.description || '',
        subject: note.subject?.name || note.subject || '',
        university: note.academic?.university || '',
        degreeType: degreeType,
        department: note.academic?.department || '',
        semester: note.academic?.semester?.toString() || '',
        graduationYear:
          note.academic?.graduationYear?.toString() ||
          estimatedGradYear.toString(),
        category: note.subject?.category || 'lecture-notes',
        difficulty: note.subject?.difficulty || 'intermediate',
        visibility: note.visibility || 'university',
        tags: Array.isArray(note.tags) ? note.tags.join(', ') : note.tags || '',
      })
    }
  }, [note, isOpen, form])

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

      // Additional Zod validation with custom rules
      const validationResult = editNoteFormSchema.safeParse(values)

      if (!validationResult.success) {
        // Set field-specific errors from Zod validation
        validationResult.error.errors.forEach(error => {
          const fieldName = error.path[0]
          if (fieldName) {
            form.setError(fieldName, {
              message: error.message,
            })
          }
        })
        return
      }

      const validatedData = validationResult.data

      // Validate department compatibility with degree type
      if (
        !validateDepartmentForDegreeType(
          validatedData.department,
          validatedData.degreeType
        )
      ) {
        form.setError('department', {
          message: `Selected department is not available for ${validatedData.degreeType} degree`,
        })
        return
      }

      console.log('Submitting validated note data:', {
        noteId: note._id,
        ...validatedData,
      })

      // Transform data for API with validated values
      const updateData = {
        title: validatedData.title.trim(),
        description: validatedData.description.trim(),
        subject: validatedData.subject.trim(),
        university: validatedData.university,
        degree: validatedData.degreeType,
        department: validatedData.department,
        semester: validatedData.semester,
        graduationYear: validatedData.graduationYear,
        // Preserve course information (required fields)
        courseCode: note.academic?.course?.code,
        courseName: note.academic?.course?.name,
        courseCredits: note.academic?.course?.credits,
        category: validatedData.category,
        difficulty: validatedData.difficulty,
        visibility: validatedData.visibility,
        tags: validatedData.tags || '',
      }

      updateNoteDetails(
        { noteId: note._id, ...updateData },
        {
          onSuccess: data => {
            console.log('Note updated successfully:', data)
            // Clear any lingering errors
            form.clearErrors()
            onClose()
          },
          onError: error => {
            console.error('Update failed:', error)

            // Handle specific API errors
            if (error.errors && Array.isArray(error.errors)) {
              error.errors.forEach(err => {
                form.setError('root', {
                  message: err,
                })
              })
            } else {
              form.setError('root', {
                message:
                  error.message || 'Failed to update note. Please try again.',
              })
            }
          },
        }
      )
    } catch (error) {
      console.error('Unexpected error during submission:', error)
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
    onClose()
  }

  // Validate form on department selection based on degree type
  const validateDepartmentForDegreeType = (department, degreeType) => {
    if (!department || !degreeType) return true

    const validDepartments =
      degreeType === 'bachelor'
        ? BACHELOR_DEPARTMENTS
        : degreeType === 'master'
          ? MASTER_DEPARTMENTS
          : [...BACHELOR_DEPARTMENTS, ...MASTER_DEPARTMENTS]

    return validDepartments.includes(department)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[800px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>
            Update your note details. You can modify all information except the
            file itself.
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
                Academic Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

                <FormField
                  control={form.control}
                  name='degreeType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree Type *</FormLabel>
                      <Select
                        onValueChange={value => {
                          field.onChange(value)
                          setSelectedDegreeType(value)

                          // Reset and validate department when degree type changes
                          const currentDepartment = form.getValues('department')
                          if (
                            !validateDepartmentForDegreeType(
                              currentDepartment,
                              value
                            )
                          ) {
                            form.setValue('department', '', {
                              shouldValidate: true,
                            })
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select degree type' />
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
                        This will filter available departments
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
                      <FormLabel>Department *</FormLabel>
                      <Select
                        onValueChange={value => {
                          field.onChange(value)
                          // Trigger validation
                          form.trigger('department')
                        }}
                        value={field.value}
                        disabled={!selectedDegreeType}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                selectedDegreeType
                                  ? 'Select department'
                                  : 'Select degree type first'
                              }
                            />
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
                        {selectedDegreeType
                          ? `Showing ${getDepartmentOptions().length} ${selectedDegreeType} departments`
                          : 'Please select a degree type first'}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='graduationYear'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Graduation Year *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select graduation year' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADUATION_YEARS.map(year => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading} className='min-w-32'>
                {isLoading ? (
                  <div className='flex items-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditNoteDialog
