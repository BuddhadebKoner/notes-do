import React, { useState, useEffect } from 'react'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { setAuthToken, API_ENDPOINTS } from '../../config/api.js'

const GoogleDriveConnect = ({ onConnected }) => {
   const { getToken } = useClerkAuth()
   const [isConnecting, setIsConnecting] = useState(false)
   const [driveToken, setDriveToken] = useState(localStorage.getItem('googleDriveToken'))
   const [error, setError] = useState(null)

   const connectGoogleDrive = async () => {
      setIsConnecting(true)
      setError(null)
      try {
         // Get Clerk token for authentication
         const token = await getToken()
         if (!token) {
            throw new Error('No authentication token available')
         }

         // Get auth URL from backend
         const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.GOOGLE.DRIVE_AUTH}`, {
            headers: {
               'Authorization': `Bearer ${token}`
            }
         })
         const data = await response.json()

         if (data.success) {
            // Store the current page URL to return after OAuth
            localStorage.setItem('googleDriveAuthReturn', window.location.pathname)

            // Redirect to Google OAuth in the same window
            window.location.href = data.authUrl
         } else {
            throw new Error(data.message || 'Failed to get auth URL')
         }
      } catch (error) {
         console.error('Failed to connect Google Drive:', error)
         setError(error.message || 'Connection failed')
         setIsConnecting(false)
      }
   }

   // Effect to check for existing token on mount and when returning from OAuth
   useEffect(() => {
      const token = localStorage.getItem('googleDriveToken')
      if (token) {
         setDriveToken(token)
         if (onConnected) onConnected(true)
      }
      setIsConnecting(false) // Reset connecting state
   }, [])

   // Listen for storage changes (when token is added from callback)
   useEffect(() => {
      const handleStorageChange = (e) => {
         if (e.key === 'googleDriveToken') {
            if (e.newValue) {
               setDriveToken(e.newValue)
               if (onConnected) onConnected(true)
               setError(null)
            } else {
               setDriveToken(null)
               if (onConnected) onConnected(false)
            }
         }
      }

      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
   }, [onConnected])

   const disconnectGoogleDrive = () => {
      localStorage.removeItem('googleDriveToken')
      setDriveToken(null)
      if (onConnected) onConnected(false)
   }

   return (
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
         <h3 className='font-medium text-blue-900 mb-2'>Google Drive Connection</h3>

         {driveToken ? (
            <div className='flex items-center justify-between'>
               <div className='flex items-center space-x-2'>
                  <span className='text-green-600'>✅</span>
                  <span className='text-sm text-green-700'>Connected to Google Drive</span>
               </div>
               <button
                  onClick={disconnectGoogleDrive}
                  className='text-sm text-red-600 hover:text-red-700'
               >
                  Disconnect
               </button>
            </div>
         ) : (
            <div>
               <p className='text-sm text-blue-700 mb-3'>
                  Connect your Google Drive to upload files to your personal storage (free!)
               </p>
               <button
                  onClick={connectGoogleDrive}
                  disabled={isConnecting}
                  className='bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium'
               >
                  {isConnecting ? 'Connecting...' : '🔗 Connect Google Drive'}
               </button>
               {error && (
                  <p className='text-sm text-red-600 mt-2'>
                     Error: {error}
                  </p>
               )}
            </div>
         )}
      </div>
   )
}

export default GoogleDriveConnect