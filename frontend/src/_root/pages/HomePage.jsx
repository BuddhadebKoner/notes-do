import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { BookOpen, Upload, Users, Search } from 'lucide-react'

const HomePage = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      {/* Hero Section */}
      <div className='flex items-center justify-center min-h-screen px-4'>
        <div className='text-center max-w-4xl mx-auto'>
          <h1 className='text-5xl md:text-6xl font-bold text-gray-900 mb-6'>
            Welcome to <span className='text-blue-600'>Notes Share</span>
          </h1>
          <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
            Discover, share, and access study materials from your academic community.
            Build knowledge together with students and educators worldwide.
          </p>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 mb-12'>
            <Link to="/notes">
              <Button size="lg" className='px-8 py-4 text-lg'>
                <Search className='w-5 h-5 mr-2' />
                Browse Notes
              </Button>
            </Link>
            <Link to="/upload">
              <Button variant="outline" size="lg" className='px-8 py-4 text-lg'>
                <Upload className='w-5 h-5 mr-2' />
                Upload Notes
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className='grid md:grid-cols-3 gap-6 max-w-3xl mx-auto'>
            <div className='bg-white rounded-lg shadow-md p-6 text-center'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <BookOpen className='w-6 h-6 text-blue-600' />
              </div>
              <h3 className='text-lg font-semibold mb-2'>Rich Content</h3>
              <p className='text-gray-600 text-sm'>
                Access comprehensive study materials including lecture notes, assignments, and exam prep resources.
              </p>
            </div>

            <div className='bg-white rounded-lg shadow-md p-6 text-center'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <Users className='w-6 h-6 text-green-600' />
              </div>
              <h3 className='text-lg font-semibold mb-2'>Community Driven</h3>
              <p className='text-gray-600 text-sm'>
                Connect with fellow students and educators from your university and beyond.
              </p>
            </div>

            <div className='bg-white rounded-lg shadow-md p-6 text-center'>
              <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <Search className='w-6 h-6 text-purple-600' />
              </div>
              <h3 className='text-lg font-semibold mb-2'>Smart Search</h3>
              <p className='text-gray-600 text-sm'>
                Find exactly what you need with advanced filtering by subject, difficulty, and more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
