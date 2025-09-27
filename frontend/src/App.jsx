import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ApiAuthProvider from './context/ApiAuthProvider'
import RootLayout from './_root/RootLayout'
import HomePage from './_root/pages/HomePage'
import NotesFeedPage from './_root/pages/NotesFeedPage'
import ComingSoon from './_root/pages/ComingSoon'
import ProfilePage from './_root/_profile/ProfilePage'
import GoogleCallback from './components/google/GoogleCallback'
import UploadNote from './_root/_profile/components/UploadNote'
import NoteDetails from './_root/pages/NoteDetails'
import PublicProfile from './_root/pages/PublicProfile'

function App() {
  return (
    <ApiAuthProvider>
      <Router>
        <Routes>
          <Route path='/' element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path='notes' element={<NotesFeedPage />} />
            <Route path='buy-notes' element={<ComingSoon />} />
            <Route path='profile/*' element={<ProfilePage />} />
            <Route path='note/:id' element={<NoteDetails />} />
            <Route path='user/:username' element={<PublicProfile />} />
            <Route path='upload' element={<UploadNote />} />
          </Route>
          <Route path='/auth/google/callback' element={<GoogleCallback />} />
        </Routes>
        <Toaster
          position='top-right'
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '8px',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </ApiAuthProvider>
  )
}

export default App
