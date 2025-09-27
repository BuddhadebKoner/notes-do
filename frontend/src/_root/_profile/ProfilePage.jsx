import React from 'react'
import { Navigate } from 'react-router-dom'

// This component is now deprecated in favor of ProfileLayout
// Redirect to the new profile route structure
const ProfilePage = () => {
  return <Navigate to='/profile' replace />
}

export default ProfilePage
