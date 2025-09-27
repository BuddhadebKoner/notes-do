import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Clock,
  Sparkles,
  ArrowLeft,
  Bell,
  CreditCard,
  Star,
  Zap,
} from 'lucide-react'

const ComingSoon = () => {
  const upcomingFeatures = [
    {
      icon: CreditCard,
      title: 'Premium Notes Marketplace',
      description:
        'Buy high-quality, verified notes from top students and educators',
    },
    {
      icon: Star,
      title: 'Expert-Reviewed Content',
      description:
        'Access professionally reviewed and rated academic materials',
    },
    {
      icon: Zap,
      title: 'Instant Download',
      description: 'Get your purchased notes immediately with lifetime access',
    },
  ]

  return (
    <div className='min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-4xl mx-auto text-center'>
        {/* Header */}
        <div className='mb-12'>
          <Badge
            variant='secondary'
            className='px-4 py-2 text-sm font-medium bg-gray-100 text-gray-900 border-gray-200 mb-6'
          >
            <Sparkles className='w-4 h-4 mr-2' />
            Coming Soon
          </Badge>

          <h1 className='text-4xl sm:text-5xl font-bold text-gray-900 mb-6'>
            Buy Notes Feature
          </h1>

          <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
            We're working on an amazing marketplace where you can purchase
            premium, high-quality notes from verified students and educators.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ComingSoon
