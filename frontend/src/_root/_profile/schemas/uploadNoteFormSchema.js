import { z } from 'zod'

// File validation schema
const fileSchema = z
  .instanceof(File)
  .refine(file => file.type === 'application/pdf', {
    message: 'Only PDF files are allowed',
  })
  .refine(
    file => file.size <= 50 * 1024 * 1024, // 50MB
    { message: 'File size must be less than 50MB' }
  )

// Upload note form validation schema
export const uploadNoteFormSchema = z.object({
  // File upload (required)
  noteFile: fileSchema,

  // Basic Information (required)
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),

  subject: z
    .string()
    .min(2, 'Subject must be at least 2 characters')
    .max(100, 'Subject must be less than 100 characters'),

  // Academic Information (required)
  university: z.string().min(1, 'Please select a university'),

  degreeType: z.string().min(1, 'Please select a degree type').optional(),

  department: z.string().min(1, 'Please select a department'),

  semester: z.string().min(1, 'Please select a semester'),

  // Optional fields with defaults
  graduationYear: z.string().optional(),

  academicYear: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Academic year must be in format YYYY-YY')
    .default('2024-25'),

  category: z
    .enum([
      'lecture-notes',
      'assignment',
      'exam-preparation',
      'project-report',
      'research-paper',
      'tutorial',
      'lab-manual',
      'reference-material',
    ])
    .default('lecture-notes'),

  difficulty: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .default('intermediate'),

  visibility: z
    .enum(['public', 'university', 'department', 'course', 'private'])
    .default('university'),

  tags: z
    .string()
    .optional()
    .transform(
      str =>
        str
          ?.split(',')
          .map(tag => tag.trim())
          .filter(Boolean) || []
    ),
})

// Type for form data
/** @typedef {z.infer<typeof uploadNoteFormSchema>} UploadNoteFormData */

// Default values for the form
export const defaultUploadValues = {
  noteFile: undefined, // Use undefined for file inputs to keep them uncontrolled
  title: '',
  description: '',
  subject: '',
  university: '',
  degreeType: 'bachelor',
  department: '',
  semester: '',
  graduationYear: '',
  academicYear: '2024-25',
  category: 'lecture-notes',
  difficulty: 'intermediate',
  visibility: 'university',
  tags: '',
}

// Category options for select
export const categoryOptions = [
  { value: 'lecture-notes', label: 'Lecture Notes' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'exam-preparation', label: 'Exam Preparation' },
  { value: 'project-report', label: 'Project Report' },
  { value: 'research-paper', label: 'Research Paper' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'lab-manual', label: 'Lab Manual' },
  { value: 'reference-material', label: 'Reference Material' },
]

// Difficulty options for select
export const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

// Visibility options for select
export const visibilityOptions = [
  { value: 'public', label: 'Public' },
  { value: 'university', label: 'University Only' },
  { value: 'department', label: 'Department Only' },
  { value: 'course', label: 'Course Only' },
  { value: 'private', label: 'Private' },
]
