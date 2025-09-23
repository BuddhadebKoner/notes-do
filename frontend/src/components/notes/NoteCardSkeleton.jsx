import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { Skeleton } from '../ui/skeleton'

const NoteCardSkeleton = () => {
  return (
    <Card className='h-full flex flex-col'>
      <CardHeader className='p-4 pb-2'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1 min-w-0'>
            <Skeleton className='h-5 w-3/4 mb-2' />
            <Skeleton className='h-4 w-full mb-1' />
            <Skeleton className='h-4 w-2/3' />
          </div>
          <Skeleton className='w-16 h-16 rounded-lg flex-shrink-0' />
        </div>
      </CardHeader>

      <CardContent className='p-4 pt-0 flex-1'>
        {/* Academic Info Skeleton */}
        <div className='space-y-2 mb-3'>
          <div className='flex items-center gap-2'>
            <Skeleton className='w-4 h-4' />
            <Skeleton className='h-3 w-32' />
            <Skeleton className='h-3 w-20' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='w-4 h-4' />
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-3 w-16' />
          </div>
        </div>

        {/* Badges Skeleton */}
        <div className='flex flex-wrap gap-2 mb-3'>
          <Skeleton className='h-6 w-20 rounded-full' />
          <Skeleton className='h-6 w-16 rounded-full' />
          <Skeleton className='h-6 w-14 rounded-full' />
        </div>

        {/* Tags Skeleton */}
        <div className='flex flex-wrap gap-1 mb-3'>
          <Skeleton className='h-5 w-12 rounded-full' />
          <Skeleton className='h-5 w-16 rounded-full' />
          <Skeleton className='h-5 w-14 rounded-full' />
        </div>

        {/* Stats Skeleton */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Skeleton className='h-4 w-8' />
            <Skeleton className='h-4 w-8' />
            <Skeleton className='h-4 w-8' />
          </div>
          <Skeleton className='h-4 w-12' />
        </div>
      </CardContent>

      <CardFooter className='p-4 pt-0'>
        <div className='flex items-center justify-between w-full'>
          <div className='flex items-center gap-2'>
            <Skeleton className='w-6 h-6 rounded-full' />
            <div className='flex flex-col gap-1'>
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-3 w-20' />
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-7 w-16' />
            <Skeleton className='h-7 w-20' />
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default NoteCardSkeleton
