import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authAPI, apiHelpers } from '../services/api.js'
import { setAuthToken } from '../config/api.js'
import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'

// Query keys for React Query
export const QUERY_KEYS = {
   AUTH_STATUS: ['auth', 'status'],
   CURRENT_USER: ['auth', 'user'],
}

// Hook to manage API token
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

// Hook to check authentication status
export const useAuthStatus = () => {
   return useQuery({
      queryKey: QUERY_KEYS.AUTH_STATUS,
      queryFn: authAPI.checkStatus,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
   })
}

// Hook to get current user info
export const useCurrentUser = () => {
   const { isSignedIn } = useAuth()

   return useQuery({
      queryKey: QUERY_KEYS.CURRENT_USER,
      queryFn: authAPI.getCurrentUser,
      enabled: isSignedIn, // Only run if user is signed in
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
   })
}

// Hook to verify token
export const useVerifyToken = () => {
   const queryClient = useQueryClient()

   return useMutation({
      mutationFn: authAPI.verifyToken,
      onSuccess: (data) => {
         // Update auth status cache
         queryClient.setQueryData(QUERY_KEYS.AUTH_STATUS, {
            success: true,
            isAuthenticated: true,
            user: data.user,
         })

         // Update current user cache
         queryClient.setQueryData(QUERY_KEYS.CURRENT_USER, {
            success: true,
            user: data.user,
         })
      },
      onError: (error) => {
         console.error('Token verification failed:', error)
         // Clear auth caches on verification failure
         queryClient.removeQueries({ queryKey: QUERY_KEYS.AUTH_STATUS })
         queryClient.removeQueries({ queryKey: QUERY_KEYS.CURRENT_USER })
      },
   })
}

// Hook to logout
export const useLogout = () => {
   const queryClient = useQueryClient()
   const { signOut } = useAuth()

   return useMutation({
      mutationFn: authAPI.logout,
      onSuccess: async () => {
         // Sign out from Clerk
         await signOut()

         // Clear all caches
         queryClient.clear()

         console.log('Logout successful')
      },
      onError: (error) => {
         console.error('Logout error:', error)
      },
   })
}

// Custom hook for API error handling
export const useApiError = () => {
   const handleError = (error) => {
      const formattedError = apiHelpers.handleError(error)

      // You can add global error handling logic here
      // For example, show toast notifications, redirect on 401, etc.

      return formattedError
   }

   return { handleError }
}