import React, { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card.jsx'
import { Button } from '../../../components/ui/button.jsx'
import { Badge } from '../../../components/ui/badge.jsx'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../components/ui/avatar.jsx'
import { GraduationCap, BookOpen, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

const ProfileOnboarding = ({ onRoleSelect, isLoading, error }) => {
  const { user: clerkUser } = useUser()
  const [selectedRole, setSelectedRole] = useState('')

  const roles = [
    {
      value: 'student',
      label: 'Student',
      description: 'I want to access and share study materials',
      icon: <GraduationCap className='w-12 h-12' />,
    },
    {
      value: 'teacher',
      label: 'Teacher',
      description: 'I want to share educational resources',
      icon: <BookOpen className='w-12 h-12' />,
    },
  ]

  const handleRoleSelect = role => {
    setSelectedRole(role)

    // Small celebration confetti when role is selected
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })

    onRoleSelect(role)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8'>
      <div className='max-w-2xl mx-auto'>
        {/* Welcome Header */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center mb-4'>
            <Sparkles className='w-8 h-8 text-blue-600 mr-2' />
            <h1 className='text-3xl font-bold text-gray-900'>
              Welcome to Notes-Do!
            </h1>
          </div>
          <p className='text-lg text-gray-600'>Let's get your profile set up</p>
        </div>

        {/* User Info */}
        {clerkUser && (
          <Card className='mb-8 border-blue-200'>
            <CardContent className='p-6'>
              <div className='flex items-center space-x-4'>
                <Avatar className='h-16 w-16'>
                  <AvatarImage
                    src={clerkUser.imageUrl}
                    alt={clerkUser.fullName}
                  />
                  <AvatarFallback className='text-lg font-semibold'>
                    {clerkUser.fullName
                      ?.split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className='text-xl font-bold text-gray-900'>
                    {clerkUser.fullName}
                  </h2>
                  <p className='text-gray-600'>
                    {clerkUser.primaryEmailAddress?.emailAddress}
                  </p>
                  <Badge variant='secondary' className='mt-2'>
                    New Member
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role Selection */}
        <Card>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl text-gray-900'>
              Choose Your Role
            </CardTitle>
            <p className='text-gray-600'>
              This helps us customize your experience
            </p>
          </CardHeader>
          <CardContent className='p-6'>
            <div className='grid md:grid-cols-2 gap-4 mb-6'>
              {roles.map(role => (
                <Card
                  key={role.value}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 ${
                    selectedRole === role.value
                      ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedRole(role.value)}
                >
                  <CardContent className='p-6 text-center'>
                    <div className='flex justify-center mb-4 text-blue-600'>
                      {role.icon}
                    </div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      {role.label}
                    </h3>
                    <p className='text-gray-600 text-sm'>{role.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className='mb-4 p-4 bg-red-50 rounded-lg border border-red-200'>
                <p className='text-sm text-red-700'>
                  {error.message ||
                    'Failed to create profile. Please try again.'}
                </p>
              </div>
            )}

            {/* Create Profile Button */}
            <Button
              onClick={() => handleRoleSelect(selectedRole)}
              disabled={!selectedRole || isLoading}
              className='w-full'
              size='lg'
            >
              {isLoading ? (
                <div className='flex items-center space-x-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  <span>Creating Profile...</span>
                </div>
              ) : (
                'Create Profile'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfileOnboarding
