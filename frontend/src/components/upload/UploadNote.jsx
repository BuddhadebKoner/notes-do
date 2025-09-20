import React, { useState } from 'react'
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'
import { setAuthToken } from '../../config/api.js'
import { useUploadNote } from '../../lib/react-query/queriesAndMutation.js'
import GoogleDriveConnect from '../google/GoogleDriveConnect.jsx'

const UploadNote = () => {
   const { getToken } = useClerkAuth()
   const { user: clerkUser } = useUser()
   const { mutate: uploadNote, data: uploadResult, isPending: isUploading, error: uploadError } = useUploadNote()

   const [formData, setFormData] = useState({
      title: '',
      description: '',
      university: '',
      department: '',
      subject: '',
      semester: '',
      academicYear: '2024-25',
      category: 'lecture-notes',
      difficulty: 'intermediate',
      tags: '',
      visibility: 'university'
   })

   const [selectedFile, setSelectedFile] = useState(null)
   const [clientError, setClientError] = useState(null)
   const [driveConnected, setDriveConnected] = useState(localStorage.getItem('googleDriveToken') !== null)

   const handleInputChange = (e) => {
      const { name, value } = e.target
      setFormData(prev => ({
         ...prev,
         [name]: value
      }))
   }

   const handleFileChange = (e) => {
      const file = e.target.files[0]
      if (file) {
         if (file.type !== 'application/pdf') {
            setClientError('Only PDF files are allowed')
            return
         }
         if (file.size > 50 * 1024 * 1024) { // 50MB
            setClientError('File size must be less than 50MB')
            return
         }
         setSelectedFile(file)
         setClientError(null)
      }
   }

   const handleUpload = async (e) => {
      e.preventDefault()

      if (!selectedFile) {
         setClientError('Please select a PDF file')
         return
      }

      // Validate required fields
      const requiredFields = ['title', 'description', 'university', 'department', 'subject', 'semester']
      const missingFields = requiredFields.filter(field => !formData[field])

      if (missingFields.length > 0) {
         setClientError(`Missing required fields: ${missingFields.join(', ')}`)
         return
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
         uploadFormData.append('noteFile', selectedFile)

         // Add form data
         Object.keys(formData).forEach(key => {
            if (formData[key]) {
               uploadFormData.append(key, formData[key])
            }
         })

         // Add Google Drive token if available
         const googleDriveToken = localStorage.getItem('googleDriveToken')
         if (googleDriveToken) {
            uploadFormData.append('googleDriveToken', googleDriveToken)
         }

         // Use React Query mutation
         uploadNote(uploadFormData, {
            onSuccess: (result) => {
               if (result.success) {
                  // Reset form on success
                  setFormData({
                     title: '',
                     description: '',
                     university: '',
                     department: '',
                     subject: '',
                     semester: '',
                     academicYear: '2024-25',
                     category: 'lecture-notes',
                     difficulty: 'intermediate',
                     tags: '',
                     visibility: 'university'
                  })
                  setSelectedFile(null)
                  // Reset file input
                  const fileInput = document.getElementById('noteFile')
                  if (fileInput) fileInput.value = ''
               }
            }
         })

      } catch (error) {
         console.error('Upload error:', error)
      }
   }

   return (
      <div className='max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg'>
         <h2 className='text-2xl font-bold text-gray-900 mb-6'>Upload Notes</h2>

         {/* Google Drive Connection */}
         <div className='mb-6'>
            <GoogleDriveConnect onConnected={setDriveConnected} />
         </div>

         <form onSubmit={handleUpload} className='space-y-6'>
            {/* File Upload */}
            <div>
               <label htmlFor='noteFile' className='block text-sm font-medium text-gray-700 mb-2'>
                  PDF File *
               </label>
               <input
                  type='file'
                  id='noteFile'
                  accept='.pdf'
                  onChange={handleFileChange}
                  className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                  required
               />
               {selectedFile && (
                  <p className='text-sm text-green-600 mt-1'>
                     Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
               )}
            </div>

            {/* Basic Info */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
               <div>
                  <label htmlFor='title' className='block text-sm font-medium text-gray-700 mb-1'>
                     Title *
                  </label>
                  <input
                     type='text'
                     id='title'
                     name='title'
                     value={formData.title}
                     onChange={handleInputChange}
                     className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                     placeholder='e.g., Data Structures - Linked Lists'
                     required
                  />
               </div>

               <div>
                  <label htmlFor='subject' className='block text-sm font-medium text-gray-700 mb-1'>
                     Subject *
                  </label>
                  <input
                     type='text'
                     id='subject'
                     name='subject'
                     value={formData.subject}
                     onChange={handleInputChange}
                     className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                     placeholder='e.g., Data Structures'
                     required
                  />
               </div>
            </div>

            {/* Description */}
            <div>
               <label htmlFor='description' className='block text-sm font-medium text-gray-700 mb-1'>
                  Description *
               </label>
               <textarea
                  id='description'
                  name='description'
                  value={formData.description}
                  onChange={handleInputChange}
                  rows='3'
                  className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Brief description of the notes content...'
                  required
               />
            </div>

            {/* Academic Info */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
               <div>
                  <label htmlFor='university' className='block text-sm font-medium text-gray-700 mb-1'>
                     University *
                  </label>
                  <input
                     type='text'
                     id='university'
                     name='university'
                     value={formData.university}
                     onChange={handleInputChange}
                     className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                     placeholder='e.g., MIT'
                     required
                  />
               </div>

               <div>
                  <label htmlFor='department' className='block text-sm font-medium text-gray-700 mb-1'>
                     Department *
                  </label>
                  <input
                     type='text'
                     id='department'
                     name='department'
                     value={formData.department}
                     onChange={handleInputChange}
                     className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                     placeholder='e.g., Computer Science'
                     required
                  />
               </div>

               <div>
                  <label htmlFor='semester' className='block text-sm font-medium text-gray-700 mb-1'>
                     Semester *
                  </label>
                  <input
                     type='number'
                     id='semester'
                     name='semester'
                     value={formData.semester}
                     onChange={handleInputChange}
                     min='1'
                     max='12'
                     className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                     placeholder='e.g., 5'
                     required
                  />
               </div>
            </div>

            {/* Additional Info */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
               <div>
                  <label htmlFor='category' className='block text-sm font-medium text-gray-700 mb-1'>
                     Category
                  </label>
                  <select
                     id='category'
                     name='category'
                     value={formData.category}
                     onChange={handleInputChange}
                     className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                     <option value='lecture-notes'>Lecture Notes</option>
                     <option value='assignment'>Assignment</option>
                     <option value='exam-preparation'>Exam Preparation</option>
                     <option value='project-report'>Project Report</option>
                     <option value='research-paper'>Research Paper</option>
                     <option value='tutorial'>Tutorial</option>
                     <option value='lab-manual'>Lab Manual</option>
                     <option value='reference-material'>Reference Material</option>
                  </select>
               </div>

               <div>
                  <label htmlFor='difficulty' className='block text-sm font-medium text-gray-700 mb-1'>
                     Difficulty
                  </label>
                  <select
                     id='difficulty'
                     name='difficulty'
                     value={formData.difficulty}
                     onChange={handleInputChange}
                     className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                     <option value='beginner'>Beginner</option>
                     <option value='intermediate'>Intermediate</option>
                     <option value='advanced'>Advanced</option>
                  </select>
               </div>

               <div>
                  <label htmlFor='visibility' className='block text-sm font-medium text-gray-700 mb-1'>
                     Visibility
                  </label>
                  <select
                     id='visibility'
                     name='visibility'
                     value={formData.visibility}
                     onChange={handleInputChange}
                     className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                     <option value='public'>Public</option>
                     <option value='university'>University</option>
                     <option value='department'>Department</option>
                     <option value='course'>Course</option>
                     <option value='private'>Private</option>
                  </select>
               </div>
            </div>

            {/* Tags */}
            <div>
               <label htmlFor='tags' className='block text-sm font-medium text-gray-700 mb-1'>
                  Tags (comma separated)
               </label>
               <input
                  type='text'
                  id='tags'
                  name='tags'
                  value={formData.tags}
                  onChange={handleInputChange}
                  className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='e.g., algorithms, data structures, programming'
               />
            </div>

            {/* Submit Button */}
            <div>
               <button
                  type='submit'
                  disabled={isUploading || !selectedFile}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium ${isUploading || !selectedFile
                     ? 'bg-gray-400 cursor-not-allowed'
                     : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                     }`}
               >
                  {isUploading ? 'Uploading...' : 'Upload Note'}
               </button>
            </div>
         </form>

         {/* Upload Result */}
         {uploadResult && (
            <div className='mt-6 p-4 bg-green-50 border border-green-200 rounded-md'>
               <h3 className='text-lg font-medium text-green-800 mb-2'>Upload Successful!</h3>
               <div className='text-sm text-green-700'>
                  <p><strong>Title:</strong> {uploadResult.note.title}</p>
                  <p><strong>Subject:</strong> {uploadResult.note.subject?.name || uploadResult.note.subject}</p>
                  <p><strong>University:</strong> {uploadResult.note.academic?.university || uploadResult.note.university}</p>
                  <p><strong>Status:</strong> {uploadResult.note.status}</p>
                  <p><strong>File Size:</strong> {(uploadResult.note.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p><strong>Storage:</strong> {uploadResult.storageLocation === 'google-drive' ? 'Google Drive' : 'Local Storage'}</p>

                  {/* View PDF Button */}
                  {uploadResult.file?.webViewLink && uploadResult.file.webViewLink !== 'https://drive.google.com/drive/my-drive' && (
                     <div className='mt-3'>
                        <a
                           href={uploadResult.file.webViewLink}
                           target="_blank"
                           rel="noopener noreferrer"
                           className='inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors'
                        >
                           <span>📄</span>
                           <span className='ml-2'>View PDF in Google Drive</span>
                        </a>
                     </div>
                  )}

                  {/* Warning message if available */}
                  {uploadResult.warning && (
                     <p className='text-xs text-yellow-600 mt-2 italic'>
                        {uploadResult.warning}
                     </p>
                  )}
               </div>
            </div>
         )}

         {/* Upload Error */}
         {(uploadError || clientError) && (
            <div className='mt-6 p-4 bg-red-50 border border-red-200 rounded-md'>
               <h3 className='text-lg font-medium text-red-800 mb-2'>Upload Failed</h3>
               <p className='text-sm text-red-700'>
                  {clientError || uploadError?.message || 'An error occurred during upload'}
               </p>
            </div>
         )}

         {/* User Info */}
         {clerkUser && (
            <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md'>
               <h3 className='text-sm font-medium text-blue-800 mb-1'>Uploading as:</h3>
               <p className='text-sm text-blue-700'>
                  {clerkUser.firstName} {clerkUser.lastName} ({clerkUser.primaryEmailAddress?.emailAddress})
               </p>
            </div>
         )}
      </div>
   )
}

export default UploadNote