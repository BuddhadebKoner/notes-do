import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from '@clerk/clerk-react'
import ApiAuthProvider from './context/ApiAuthProvider'
import NotesFeedPage from './_root/pages/NotesFeedPage'
import ProfilePage from './_root/_profile/ProfilePage'
import GoogleCallback from './components/google/GoogleCallback'
import UploadNote from './_root/_profile/components/UploadNote'
import { Upload } from 'lucide-react'
import NoteDetails from './_root/pages/NoteDetails'
import PublicProfile from './_root/pages/PublicProfile'

// Navigation Component
const Navigation = () => {
  return (
    <nav className='bg-white shadow-lg'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex justify-between h-16'>
          <div className='flex items-center space-x-8'>
            <Link to='/' className='text-xl font-bold text-gray-800'>
              Notes Doo
            </Link>
            <SignedIn>
              <div className='flex space-x-4'>
                <Link
                  to='/profile'
                  className='text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium'
                >
                  Profile
                </Link>
              </div>
            </SignedIn>
          </div>

          <div className='flex items-center space-x-4'>
            <SignedIn>
              <Link
                to='/upload'
                className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2'
              >
                <Upload className='h-4 w-4' />
                <span>Upload Note</span>
              </Link>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode='modal'>
                <button className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm'>
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <ApiAuthProvider>
      <Router>
        <div className='min-h-screen bg-gray-50'>
          <Navigation />
          <main>
            <Routes>
              <Route path='/' element={<NotesFeedPage />} />
              <Route path='/profile/*' element={<ProfilePage />} />
              <Route path='/note/:id' element={<NoteDetails />} />
              <Route path='/user/:username' element={<PublicProfile />} />
              <Route path='/upload' element={<UploadNote />} />
              <Route
                path='/auth/google/callback'
                element={<GoogleCallback />}
              />
            </Routes>
          </main>
        </div>
      </Router>
    </ApiAuthProvider>
  )
}

export default App
