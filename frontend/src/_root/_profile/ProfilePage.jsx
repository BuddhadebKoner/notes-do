import React from 'react'
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from '@clerk/clerk-react'

const ProfilePage = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100'>
      <div className='text-center p-8 bg-white rounded-lg shadow-lg'>
        <h1 className='text-4xl font-bold text-gray-900 mb-6'>Profile Page</h1>

        <SignedIn>
          <div className='space-y-4'>
            <p className='text-lg text-gray-600'>Welcome to your profile!</p>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-16 w-16',
                },
              }}
            />
          </div>
        </SignedIn>

        <SignedOut>
          <div className='space-y-4'>
            <p className='text-lg text-gray-600'>
              Please sign in to view your profile
            </p>
            <SignInButton mode='modal'>
              <button className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg'>
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>
    </div>
  )
}

export default ProfilePage
