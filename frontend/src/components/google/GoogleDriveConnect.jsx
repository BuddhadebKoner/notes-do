import React, { useState, useEffect } from 'react'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { setAuthToken, API_ENDPOINTS } from '../../config/api.js'

const GoogleDriveConnect = ({ onConnected }) => {
  const { getToken } = useClerkAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [driveToken, setDriveToken] = useState(
    localStorage.getItem('googleDriveToken')
  )
  const [error, setError] = useState(null)

  const connectGoogleDrive = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      console.log('Starting Google Drive connection...')
      console.log('API Base URL:', API_ENDPOINTS.BASE_URL)

      // Get Clerk token for authentication with retry logic
      let token = null
      let retries = 3

      while (retries > 0 && !token) {
        try {
          console.log(`Attempting to get token (attempt ${4 - retries})...`)
          token = await getToken()
          if (token) {
            console.log('Token obtained successfully')
            break
          }
        } catch (tokenError) {
          console.warn(
            `Token fetch attempt failed, ${retries - 1} retries left:`,
            tokenError
          )
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
          }
        }
      }

      if (!token) {
        console.error('Failed to obtain authentication token after all retries')
        throw new Error('Authentication failed. Please sign in again.')
      }

      // Get auth URL from backend
      const apiUrl = `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.GOOGLE.DRIVE_AUTH}`
      console.log('Requesting Google Drive auth URL from:', apiUrl)

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(
          'Server responded with error:',
          response.status,
          errorText
        )
        throw new Error(`Server error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log('Server response:', data)

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
    const handleStorageChange = e => {
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
      <h3 className='font-medium text-blue-900 mb-2'>
        Google Drive Connection
      </h3>

      {driveToken ? (
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <span className='text-green-600'>✅</span>
            <span className='text-sm text-green-700'>
              Connected to Google Drive
            </span>
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
            Connect your Google Drive to upload files to your personal storage
            (free!)
          </p>
          <button
            onClick={connectGoogleDrive}
            disabled={isConnecting}
            className='bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium'
          >
            {isConnecting ? 'Connecting...' : '🔗 Connect Google Drive'}
          </button>
          {error && (
            <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-sm text-red-600 font-medium mb-1'>
                Connection Failed
              </p>
              <p className='text-xs text-red-500'>{error}</p>
              <p className='text-xs text-gray-500 mt-2'>
                If this persists, try signing out and back in, or contact
                support.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GoogleDriveConnect
