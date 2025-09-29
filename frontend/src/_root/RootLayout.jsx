import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from '@clerk/clerk-react'
import { Button } from '../components/ui/button'
import { AnimatedBuyButton } from '../components/ui/animated-buy-button'
import { Upload, User } from 'lucide-react'
import { cn } from '../lib/utils'

// Navigation Component
const Navigation = () => {
  return (
    <nav className='sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo and Navigation Links */}
          <div className='flex items-center space-x-8'>
            <Link
              to='/'
              className='text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors'
            >
              Notes Doo
            </Link>
            <div className='hidden md:flex space-x-4 items-center'>
              <Link to='/buy-notes'>
                <AnimatedBuyButton>Buy Notes</AnimatedBuyButton>
              </Link>
              <Link
                to='/notes'
                className='text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors'
              >
                Browse Notes
              </Link>
            </div>
          </div>

          {/* Right side - Profile and Actions */}
          <div className='flex items-center space-x-3'>
            <SignedIn>
              {/* Upload Button - More Eye-catching */}
              <Button
                asChild
                size='default'
                className='bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
                data-tour='upload'
              >
                <Link to='/upload' className='flex items-center space-x-2'>
                  <Upload className='h-4 w-4' />
                  {/* <span className='font-semibold'>Upload Note</span> */}
                </Link>
              </Button>

              {/* Profile Section - Connected Bar */}
              <div className='flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-lg px-3 py-2 border'>
                <Button
                  asChild
                  variant='ghost'
                  size='sm'
                  className='p-0 h-auto hover:bg-transparent'
                >
                  <Link
                    to='/profile'
                    className='flex items-center space-x-2 text-gray-700 hover:text-gray-900'
                  >
                    <User className='h-4 w-4' />
                    <span className='text-sm font-medium'>Profile</span>
                  </Link>
                </Button>
                <div className='w-px h-6 bg-gray-300'></div>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8',
                      userButtonTrigger: 'focus:shadow-none',
                    },
                  }}
                />
              </div>
            </SignedIn>

            <SignedOut>
              <SignUpButton mode='modal'>
                <Button
                  variant='default'
                  size='default'
                  className='bg-gray-900 hover:bg-black text-white'
                >
                  Sign Up
                </Button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  )
}

const RootLayout = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation />
      <main className='flex-1'>
        <Outlet />
      </main>
    </div>
  )
}

export default RootLayout
