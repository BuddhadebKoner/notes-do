import React, { useEffect, useState } from 'react'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../../config/api.js'

const GoogleCallback = () => {
   const { getToken, isLoaded, isSignedIn } = useClerkAuth()
   const navigate = useNavigate()
   const [status, setStatus] = useState('processing')
   const [message, setMessage] = useState('Processing your Google Drive connection...')
   const [hasProcessed, setHasProcessed] = useState(false)

   useEffect(() => {
      // Prevent multiple executions
      if (hasProcessed) {
         console.log('Already processed, skipping...')
         return
      }

      const handleCallback = async () => {
         try {
            console.log('Processing Google Drive callback...')
            console.log('Current URL:', window.location.href)
            console.log('API Base URL:', API_ENDPOINTS.BASE_URL)

            // Ensure we're actually on the callback route
            if (!window.location.pathname.includes('/auth/google/callback')) {
               console.log('Not on callback route, component should not be processing')
               setStatus('error')
               setMessage('This component should only be accessed via Google OAuth callback')
               setTimeout(() => navigate('/'), 2000)
               setHasProcessed(true)
               return
            }

            // Check if Clerk is loaded first
            if (!isLoaded) {
               console.log('Clerk not loaded yet, waiting...')
               setMessage('Loading authentication...')
               return // Just return, useEffect will re-run when isLoaded becomes true
            }

            // Mark as processing to prevent duplicate calls
            setHasProcessed(true)

            // Check if user is signed in
            if (!isSignedIn) {
               console.log('User not signed in')
               setStatus('error')
               setMessage('You must be signed in to complete Google Drive connection. Please sign in first.')
               setTimeout(() => navigate('/'), 3000)
               return
            }

            // Get the authorization code from URL
            const urlParams = new URLSearchParams(window.location.search)
            const code = urlParams.get('code')
            const error = urlParams.get('error')

            console.log('URL params - code:', code ? 'present' : 'missing', 'error:', error)

            if (error) {
               setStatus('error')
               setMessage(`Authentication failed: ${error}`)
               setTimeout(() => {
                  const returnUrl = localStorage.getItem('googleDriveAuthReturn') || '/upload'
                  localStorage.removeItem('googleDriveAuthReturn')
                  navigate(returnUrl)
               }, 3000)
               return
            }

            if (!code) {
               setStatus('error')
               setMessage('No authorization code received from Google')
               setTimeout(() => {
                  const returnUrl = localStorage.getItem('googleDriveAuthReturn') || '/upload'
                  localStorage.removeItem('googleDriveAuthReturn')
                  navigate(returnUrl)
               }, 3000)
               return
            }

            setMessage('Exchanging authorization code for access tokens...')

            // Get Clerk token with retry logic
            let token = null;
            let retries = 3;

            while (retries > 0 && !token) {
               try {
                  token = await getToken()
                  if (token) break;
               } catch (tokenError) {
                  console.warn(`Token fetch attempt failed, ${retries - 1} retries left:`, tokenError)
                  retries--;
                  if (retries > 0) {
                     await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
                  }
               }
            }

            if (!token) {
               setStatus('error')
               setMessage('Authentication failed. Please sign in again and try connecting to Google Drive.')
               setTimeout(() => navigate('/'), 5000)
               return
            }

            // Send code to backend to exchange for tokens
            const apiUrl = `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.GOOGLE.CALLBACK}`
            console.log('Sending authorization code to:', apiUrl)

            const response = await fetch(apiUrl, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
               },
               body: JSON.stringify({ code })
            })

            console.log('Callback response status:', response.status)

            if (!response.ok) {
               const errorText = await response.text()
               console.error('Callback server error:', response.status, errorText)
               throw new Error(`Server error (${response.status}): ${errorText}`)
            }

            const data = await response.json()
            console.log('Callback response data:', data)

            if (data.success) {
               // Store the token in localStorage
               localStorage.setItem('googleDriveToken', data.token)

               setStatus('success')
               setMessage('Google Drive connected successfully! Redirecting...')

               // Redirect back to the original page after 2 seconds
               setTimeout(() => {
                  const returnUrl = localStorage.getItem('googleDriveAuthReturn') || '/upload'
                  localStorage.removeItem('googleDriveAuthReturn')
                  navigate(returnUrl)
               }, 2000)
            } else {
               setStatus('error')
               setMessage(data.message || 'Failed to connect Google Drive')
               setTimeout(() => {
                  const returnUrl = localStorage.getItem('googleDriveAuthReturn') || '/upload'
                  localStorage.removeItem('googleDriveAuthReturn')
                  navigate(returnUrl)
               }, 3000)
            }
         } catch (error) {
            console.error('Callback error:', error)
            setStatus('error')
            setMessage(`Connection failed: ${error.message}`)
            setTimeout(() => {
               const returnUrl = localStorage.getItem('googleDriveAuthReturn') || '/upload'
               localStorage.removeItem('googleDriveAuthReturn')
               navigate(returnUrl)
            }, 3000)
         }
      }

      // Only run if we're actually on the callback route
      if (window.location.pathname.includes('/auth/google/callback')) {
         handleCallback()
      } else {
         console.log('GoogleCallback component rendered on wrong route:', window.location.pathname)
         setStatus('error')
         setMessage('Component loaded incorrectly')
         navigate('/')
      }
   }, [getToken, navigate, isLoaded, isSignedIn, hasProcessed])

   const getStatusIcon = () => {
      if (status === 'processing') {
         return <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
      } else if (status === 'success') {
         return <div className='text-green-600 text-6xl mb-4'>✅</div>
      } else {
         return <div className='text-red-600 text-6xl mb-4'>❌</div>
      }
   }

   const getStatusColor = () => {
      if (status === 'success') return 'text-green-800'
      if (status === 'error') return 'text-red-800'
      return 'text-gray-800'
   }

   return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50'>
         <div className='bg-white p-8 rounded-lg shadow-md text-center max-w-md'>
            {getStatusIcon()}
            <h2 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
               {status === 'processing' && 'Connecting to Google Drive'}
               {status === 'success' && 'Connection Successful!'}
               {status === 'error' && 'Connection Failed'}
            </h2>
            <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
               {message}
            </p>
            {status !== 'processing' && (
               <p className='text-xs text-gray-500 mt-4'>
                  You will be redirected automatically...
               </p>
            )}
         </div>
      </div>
   )
}

export default GoogleCallback