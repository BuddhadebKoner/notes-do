import React, { createContext, useContext } from 'react'
import { useApiAuth } from '../hooks/useAuth.js'

const ApiAuthContext = createContext()

export const useApiAuthContext = () => {
   const context = useContext(ApiAuthContext)
   if (!context) {
      throw new Error('useApiAuthContext must be used within ApiAuthProvider')
   }
   return context
}

export const ApiAuthProvider = ({ children }) => {
   const authState = useApiAuth()

   return (
      <ApiAuthContext.Provider value={authState}>
         {children}
      </ApiAuthContext.Provider>
   )
}

export default ApiAuthProvider