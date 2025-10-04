import React from 'react'
import {
  useGetActivityStats,
  useGetFollowers,
  useGetFollowing,
} from '../../../lib/react-query/queriesAndMutation.js'
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

const Activity = () => {
  const { data: statsData, isLoading: statsLoading } = useGetActivityStats()
  const { data: followersData, isLoading: followersLoading } = useGetFollowers()
  const { data: followingData, isLoading: followingLoading } = useGetFollowing()

  if (statsLoading) {
    return (
      <div className='bg-white rounded-lg shadow-lg p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-6 bg-gray-200 rounded w-1/4'></div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='h-24 bg-gray-200 rounded'></div>
            <div className='h-24 bg-gray-200 rounded'></div>
          </div>
        </div>
      </div>
    )
  }

  return <div className='space-y-6'>comming soon...</div>
}

export default Activity
