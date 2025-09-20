import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { setAuthToken } from '../config/api.js'

// Hook to manage API token - simplified to only handle Clerk token
export const useApiAuth = () => {
   const { getToken, isLoaded, isSignedIn } = useAuth()

   useEffect(() => {
      const updateToken = async () => {
         if (isLoaded && isSignedIn) {
            try {
               const token = await getToken()
               setAuthToken(token)
            } catch (error) {
               console.error('Error setting auth token:', error)
               setAuthToken(null)
            }
         } else {
            setAuthToken(null)
         }
      }

      updateToken()
   }, [isLoaded, isSignedIn, getToken])

   return { isLoaded, isSignedIn }
}