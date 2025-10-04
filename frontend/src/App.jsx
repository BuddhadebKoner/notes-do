import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ApiAuthProvider from './context/ApiAuthProvider'
import RootLayout from './_root/RootLayout'
import HomePage from './_root/pages/HomePage'
import NotesFeedPage from './_root/pages/NotesFeedPage'
import ComingSoon from './_root/pages/ComingSoon'
import ProfileLayout from './_root/_profile/ProfileLayout'
import ProfileOverview from './_root/_profile/components/ProfileOverview'
import UploadedNotes from './_root/_profile/components/UploadedNotes'
import Favorites from './_root/_profile/components/Favorites'
import Wishlist from './_root/_profile/components/Wishlist'
import Activity from './_root/_profile/components/Activity'
import Settings from './_root/_profile/components/Settings'
import GoogleCallback from './components/google/GoogleCallback'
import UploadNote from './_root/_profile/components/UploadNote'
import NoteDetails from './_root/pages/NoteDetails'
import PublicProfile from './_root/pages/PublicProfile'
import SharePage from './pages/SharePage'
import SharedWishlistPage from './pages/SharedWishlistPage'
import Drive from './_root/_profile/components/Drive'

function App() {
  return (
    <ApiAuthProvider>
      <Router>
        <Routes>
          <Route path='/' element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path='notes' element={<NotesFeedPage />} />
            <Route path='buy-notes' element={<ComingSoon />} />
            <Route path='profile' element={<ProfileLayout />}>
              <Route index element={<ProfileOverview />} />
              <Route path='uploaded' element={<UploadedNotes />} />
              <Route path='favorites' element={<Favorites />} />
              <Route path='wishlist' element={<Wishlist />} />
              <Route path='activity' element={<Activity />} />
              <Route path='settings' element={<Settings />} />
              <Route path='drive' element={<Drive />} />
            </Route>
            <Route path='note/:id' element={<NoteDetails />} />
            <Route path='user/:username' element={<PublicProfile />} />
            <Route path='upload' element={<UploadNote />} />
          </Route>
          <Route path='/share/:noteId' element={<SharePage />} />
          <Route
            path='/wishlist/:wishlistId'
            element={<SharedWishlistPage />}
          />
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
