import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx'
import { Badge } from '../ui/badge.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx'
import { BarChart3, Eye, Download, Heart, TrendingUp } from 'lucide-react'

const AnalysisDialog = ({ isOpen, onClose, note }) => {
  // Mock analytics data - replace with real data later
  const analytics = {
    totalViews: 245,
    totalDownloads: 89,
    totalLikes: 34,
    weeklyViews: 67,
    weeklyDownloads: 23,
    weeklyLikes: 12,
    topReferrers: [
      { source: 'Direct', count: 123 },
      { source: 'Search', count: 89 },
      { source: 'Social', count: 33 },
    ],
    dailyStats: [
      { date: '2024-01-20', views: 12, downloads: 4 },
      { date: '2024-01-21', views: 18, downloads: 7 },
      { date: '2024-01-22', views: 15, downloads: 5 },
      { date: '2024-01-23', views: 22, downloads: 8 },
    ],
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[600px] max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Note Analytics
          </DialogTitle>
          <DialogDescription>
            Performance insights for "{note?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Overview Stats */}
          <div className='grid grid-cols-3 gap-4'>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-2xl font-bold'>{analytics.totalViews}</p>
                    <p className='text-xs text-muted-foreground'>Total Views</p>
                  </div>
                  <Eye className='h-4 w-4 text-muted-foreground' />
                </div>
                <div className='flex items-center gap-1 mt-2'>
                  <TrendingUp className='h-3 w-3 text-green-500' />
                  <span className='text-xs text-green-500'>
                    +{analytics.weeklyViews} this week
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-2xl font-bold'>
                      {analytics.totalDownloads}
                    </p>
                    <p className='text-xs text-muted-foreground'>Downloads</p>
                  </div>
                  <Download className='h-4 w-4 text-muted-foreground' />
                </div>
                <div className='flex items-center gap-1 mt-2'>
                  <TrendingUp className='h-3 w-3 text-green-500' />
                  <span className='text-xs text-green-500'>
                    +{analytics.weeklyDownloads} this week
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-2xl font-bold'>{analytics.totalLikes}</p>
                    <p className='text-xs text-muted-foreground'>Likes</p>
                  </div>
                  <Heart className='h-4 w-4 text-muted-foreground' />
                </div>
                <div className='flex items-center gap-1 mt-2'>
                  <TrendingUp className='h-3 w-3 text-green-500' />
                  <span className='text-xs text-green-500'>
                    +{analytics.weeklyLikes} this week
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {analytics.topReferrers.map((referrer, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between'
                  >
                    <span className='text-sm'>{referrer.source}</span>
                    <div className='flex items-center gap-2'>
                      <div className='w-24 bg-muted rounded-full h-2'>
                        <div
                          className='bg-primary h-2 rounded-full'
                          style={{
                            width: `${(referrer.count / analytics.totalViews) * 100}%`,
                          }}
                        />
                      </div>
                      <span className='text-sm font-medium w-8 text-right'>
                        {referrer.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                Recent Activity (Last 4 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {analytics.dailyStats.map((day, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between text-sm'
                  >
                    <span>{new Date(day.date).toLocaleDateString()}</span>
                    <div className='flex gap-4'>
                      <span className='text-muted-foreground'>
                        {day.views} views
                      </span>
                      <span className='text-muted-foreground'>
                        {day.downloads} downloads
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Note Details */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Note Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Upload Date:
                  </span>
                  <span className='text-sm'>
                    {note?.uploadDate
                      ? new Date(note.uploadDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Visibility:
                  </span>
                  <Badge
                    variant={
                      note?.visibility?.isPublic ? 'default' : 'secondary'
                    }
                  >
                    {note?.visibility?.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Conversion Rate:
                  </span>
                  <span className='text-sm'>
                    {analytics.totalViews > 0
                      ? `${((analytics.totalDownloads / analytics.totalViews) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AnalysisDialog
