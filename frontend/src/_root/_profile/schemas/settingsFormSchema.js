import { z } from 'zod'

// Profile settings form validation schema
export const settingsFormSchema = z.object({
  // Profile Information
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say'], {
    required_error: 'Please select a gender',
  }),

  // Academic Information
  university: z.string().optional(),
  department: z.string().optional(),
  currentSemester: z.coerce
    .number()
    .int()
    .min(1, 'Semester must be at least 1')
    .max(12, 'Semester cannot exceed 12')
    .optional()
    .or(z.literal('')),
  graduationYear: z.coerce
    .number()
    .int()
    .min(2020, 'Year must be at least 2020')
    .max(2035, 'Year cannot exceed 2035')
    .optional()
    .or(z.literal('')),
  studentId: z.string().optional(),
  degree: z.enum(
    ['bachelor', 'master', 'phd', 'diploma', 'certificate', 'other'],
    {
      required_error: 'Please select a degree type',
    }
  ),

  // Contact Information
  phone: z
    .string()
    .regex(/^[\+]?[0-9\-\(\)\s]*$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
  }),
  socialLinks: z.object({
    linkedin: z
      .string()
      .url('Invalid LinkedIn URL')
      .optional()
      .or(z.literal('')),
    github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
    twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  }),

  // Preferences
  theme: z.enum(['light', 'dark', 'auto'], {
    required_error: 'Please select a theme',
  }),
  language: z.enum(['en', 'es', 'fr', 'de'], {
    required_error: 'Please select a language',
  }),
  emailNotifications: z.object({
    newNotes: z.boolean().default(true),
    comments: z.boolean().default(true),
    likes: z.boolean().default(true),
    weeklyDigest: z.boolean().default(false),
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'university', 'private'], {
      required_error: 'Please select profile visibility',
    }),
    showEmail: z.boolean().default(false),
  }),
})

// Type for form data (JSDoc)
/** @typedef {z.infer<typeof settingsFormSchema>} SettingsFormData */

// Default values for the form
export const defaultSettingsValues = {
  bio: '',
  dateOfBirth: '',
  gender: 'prefer-not-to-say',
  university: '',
  department: '',
  currentSemester: '',
  graduationYear: '',
  studentId: '',
  degree: 'bachelor',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  },
  socialLinks: {
    linkedin: '',
    github: '',
    twitter: '',
    website: '',
  },
  theme: 'auto',
  language: 'en',
  emailNotifications: {
    newNotes: true,
    comments: true,
    likes: true,
    weeklyDigest: false,
  },
  privacy: {
    profileVisibility: 'university',
    showEmail: false,
  },
}
