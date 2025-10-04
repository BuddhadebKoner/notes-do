import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { setAuthToken, setTokenRefreshFunction } from '../config/api.js'

// Hook to manage API token with automatic refresh
export const useApiAuth = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    const updateToken = async () => {
      if (isLoaded && isSignedIn) {
        try {
          // Get initial token
          const token = await getToken()
          setAuthToken(token)

          // Register the token refresh function with the API client
          setTokenRefreshFunction(getToken)
        } catch (error) {
          console.error('Error setting auth token:', error)
          setAuthToken(null)
          setTokenRefreshFunction(null)
        }
      } else {
        setAuthToken(null)
        setTokenRefreshFunction(null)
      }
    }

    updateToken()
  }, [isLoaded, isSignedIn, getToken])

  return { isLoaded, isSignedIn }
}
