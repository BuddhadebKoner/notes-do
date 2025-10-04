import React, { useState, useEffect } from 'react'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { useGetGoogleDriveAccountInfo } from '../../lib/react-query/queriesAndMutation.js'
import { Badge } from '../ui/badge.jsx'
import { Avatar } from '../ui/avatar.jsx'
import { Card, CardContent } from '../ui/card.jsx'
import { Button } from '../ui/button.jsx'
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  XCircle,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { setAuthToken, API_ENDPOINTS } from '../../config/api.js'

const GoogleDriveStatus = ({ onConnectionChange, className = '' }) => {
  const { getToken } = useClerkAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  // Check if user has Google Drive token
  const googleDriveToken = localStorage.getItem('googleDriveToken')
  const isConnected = !!googleDriveToken

  // Only fetch account info if connected
  const {
    data: accountData,
    isLoading: isLoadingAccount,
    error: accountError,
    isError: hasAccountError,
    refetch: refetchAccount,
  } = useGetGoogleDriveAccountInfo(isConnected)

  // Determine upload capability
  const canUpload =
    isConnected &&
    accountData?.success &&
    accountData?.accountInfo?.hasEnoughSpace

  // Notify parent component of connection changes
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange({
        isConnected,
        canUpload,
        accountInfo: accountData?.accountInfo || null,
      })
    }
  }, [isConnected, canUpload, accountData, onConnectionChange])

  const connectGoogleDrive = async () => {
    setIsConnecting(true)
    setConnectionError(null)

    try {
      // Get Clerk token for authentication
      let token = null
      let retries = 3

      while (retries > 0 && !token) {
        try {
          token = await getToken()
          if (token) break
        } catch (tokenError) {
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      if (!token) {
        throw new Error('Authentication failed. Please sign in again.')
      }

      // Get auth URL from backend
      setAuthToken(token)
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.GOOGLE.DRIVE_AUTH}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(
          `Failed to get Google Drive auth URL: ${response.status} ${errorData}`
        )
      }

      const data = await response.json()

      if (!data.success || !data.authUrl) {
        throw new Error(data.message || 'Failed to get authentication URL')
      }

      // Redirect to Google's OAuth page
      window.location.href = data.authUrl
    } catch (error) {
      console.error('Google Drive connection error:', error)
      setConnectionError(error.message)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectGoogleDrive = () => {
    localStorage.removeItem('googleDriveToken')
    window.location.reload() // Refresh to update connection status
  }

  // Not connected state
  if (!isConnected) {
    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className='pt-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-full bg-blue-100 p-2'>
              <WifiOff className='h-4 w-4 text-blue-600' />
            </div>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <p className='text-sm font-medium text-blue-800'>
                  Google Drive Not Connected
                </p>
                <Badge
                  variant='secondary'
                  className='bg-blue-100 text-blue-700 text-xs'
                >
                  Upload Disabled
                </Badge>
              </div>
              <p className='text-xs text-blue-600 mb-2'>
                Connect your Google Drive to upload files directly to your
                account
              </p>

              <Button
                onClick={connectGoogleDrive}
                disabled={isConnecting}
                size='sm'
                className='bg-blue-600 hover:bg-blue-700'
              >
                {isConnecting ? (
                  <>
                    <Loader2 className='h-3 w-3 mr-1 animate-spin' />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className='h-3 w-3 mr-1' />
                    Connect Google Drive
                  </>
                )}
              </Button>

              {connectionError && (
                <div className='mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs'>
                  <p className='text-red-600 font-medium'>Connection Failed</p>
                  <p className='text-red-500'>{connectionError}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading account info state
  if (isLoadingAccount) {
    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className='pt-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-full bg-blue-100 p-2'>
              <Loader2 className='h-4 w-4 text-blue-600 animate-spin' />
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium text-blue-800'>
                Verifying Google Drive Connection...
              </p>
              <p className='text-xs text-blue-600'>
                Checking account details and storage availability
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Account error state
  if (hasAccountError || !accountData?.success) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className='pt-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-full bg-red-100 p-2'>
              <XCircle className='h-4 w-4 text-red-600' />
            </div>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <p className='text-sm font-medium text-red-800'>
                  Connection Error
                </p>
                <Badge
                  variant='secondary'
                  className='bg-red-100 text-red-700 text-xs'
                >
                  Upload Disabled
                </Badge>
              </div>
              <p className='text-xs text-red-600 mb-2'>
                {accountError?.message ||
                  accountData?.error ||
                  'Failed to verify Google Drive connection'}
              </p>

              <div className='flex gap-2'>
                <Button
                  onClick={() => refetchAccount()}
                  size='sm'
                  variant='outline'
                  className='text-xs'
                >
                  Retry
                </Button>
                <Button
                  onClick={disconnectGoogleDrive}
                  size='sm'
                  variant='outline'
                  className='text-xs text-red-600 border-red-200'
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Connected and verified state
  const accountInfo = accountData.accountInfo
  const hasEnoughSpace = accountInfo.hasEnoughSpace

  return (
    <Card
      className={`${canUpload ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'} ${className}`}
    >
      <CardContent className='pt-4'>
        <div className='flex items-center gap-3'>
          {/* Status Icon */}
          <div
            className={`rounded-full p-2 ${canUpload ? 'bg-green-100' : 'bg-amber-100'}`}
          >
            {canUpload ? (
              <CheckCircle className='h-4 w-4 text-green-600' />
            ) : (
              <AlertCircle className='h-4 w-4 text-amber-600' />
            )}
          </div>

          {/* Profile Picture */}
          {accountInfo.photoUrl && (
            <Avatar className='h-8 w-8'>
              <img
                src={accountInfo.photoUrl}
                alt={accountInfo.name}
                className='rounded-full'
                onError={e => {
                  e.target.style.display = 'none'
                }}
              />
            </Avatar>
          )}

          {/* Account Details */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1'>
              <p
                className={`text-sm font-medium truncate ${canUpload ? 'text-green-800' : 'text-amber-800'}`}
              >
                {accountInfo.name}
              </p>
              <Badge
                variant='secondary'
                className={`text-xs ${canUpload ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
              >
                {canUpload
                  ? 'Upload Ready'
                  : hasEnoughSpace
                    ? 'Connected'
                    : 'Low Space'}
              </Badge>
            </div>

            <p
              className={`text-xs truncate ${canUpload ? 'text-green-600' : 'text-amber-600'}`}
            >
              {accountInfo.email}
            </p>

            {!hasEnoughSpace && (
              <p className='text-xs text-amber-600 mt-1'>
                ⚠️ Less than 100MB available - please free up space to upload
              </p>
            )}
          </div>

          {/* Disconnect Button */}
          <Button
            onClick={disconnectGoogleDrive}
            size='sm'
            variant='ghost'
            className='text-xs text-gray-500 hover:text-red-600'
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default GoogleDriveStatus
