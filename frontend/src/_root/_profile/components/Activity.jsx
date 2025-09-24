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

  const StatCard = ({ title, value, icon, color = 'blue', description }) => (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between mb-2'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>{title}</p>
            <p className={`text-3xl font-bold text-${color}-600`}>
              {value || 0}
            </p>
          </div>
          <div className={`text-4xl text-${color}-500`}>{icon}</div>
        </div>
        {description && (
          <p className='text-xs text-muted-foreground mt-2'>{description}</p>
        )}
      </CardContent>
    </Card>
  )

  const UserCard = ({ user, type = 'follower' }) => (
    <div className='flex items-center justify-between p-4 bg-muted/50 rounded-lg border'>
      <div className='flex items-center space-x-3'>
        <Avatar className='w-10 h-10'>
          <AvatarImage
            src={user.profile?.avatar || '/default-avatar.png'}
            alt={user.profile?.firstName}
          />
          <AvatarFallback>
            {user.profile?.firstName?.[0]}
            {user.profile?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className='font-medium'>
            {user.profile?.firstName} {user.profile?.lastName}
          </p>
          <Badge variant='outline' className='text-xs mb-1'>
            @{user.username}
          </Badge>
          {user.academic?.university && (
            <p className='text-xs text-muted-foreground'>
              {user.academic?.university} • {user.academic?.department}
            </p>
          )}
        </div>
      </div>
      <Button
        size='sm'
        variant={type === 'following' ? 'destructive' : 'default'}
      >
        {type === 'following' ? 'Unfollow' : 'Follow Back'}
      </Button>
    </div>
  )

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

  return (
    <div className='space-y-6'>
      {/* Activity Overview */}
      <div className='bg-white rounded-lg shadow-lg p-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-6'>
          Activity Dashboard
        </h2>

        {statsData?.success && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <StatCard
              title='Total Notes'
              value={statsData.data.overview.totalNotes}
              icon='📄'
              color='blue'
              description='Notes you have uploaded'
            />
            <StatCard
              title='Total Downloads'
              value={statsData.data.overview.totalDownloads}
              icon='⬇️'
              color='green'
              description='Times your notes were downloaded'
            />
            <StatCard
              title='Total Views'
              value={statsData.data.overview.totalViews}
              icon='👁️'
              color='purple'
              description='Views across all your notes'
            />
            <StatCard
              title='Average Rating'
              value={statsData.data.overview.avgRating?.toFixed(1)}
              icon='⭐'
              color='yellow'
              description='Average rating of your notes'
            />
          </div>
        )}
      </div>

      {/* Social Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Engagement Stats */}
        {statsData?.success && (
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Engagement Stats
            </h3>
            <div className='grid grid-cols-2 gap-4'>
              <StatCard
                title='Total Likes'
                value={statsData.data.overview.totalLikes}
                icon='❤️'
                color='red'
              />
              <StatCard
                title='Followers'
                value={statsData.data.overview.followers}
                icon='👥'
                color='indigo'
              />
              <StatCard
                title='Following'
                value={statsData.data.overview.following}
                icon='➡️'
                color='green'
              />
              <StatCard
                title='Wishlist Items'
                value={statsData.data.overview.wishlistItems}
                icon='🔖'
                color='purple'
              />
            </div>
          </div>
        )}

        {/* Category Performance */}
        {statsData?.success && statsData.data.categoryStats.length > 0 && (
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Notes by Category
            </h3>
            <div className='space-y-3'>
              {statsData.data.categoryStats
                .slice(0, 5)
                .map((category, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                  >
                    <div>
                      <p className='font-medium capitalize'>
                        {category._id.replace('-', ' ')}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {category.count} notes
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-medium text-green-600'>
                        {category.totalDownloads} downloads
                      </p>
                      <p className='text-xs text-gray-500'>
                        {category.count > 0
                          ? (category.totalDownloads / category.count).toFixed(
                              1
                            )
                          : '0'}{' '}
                        avg
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {statsData?.success && statsData.data.recentActivity.length > 0 && (
        <div className='bg-white rounded-lg shadow-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Recent Uploads (Last 30 Days)
          </h3>
          <div className='space-y-3'>
            {statsData.data.recentActivity.map((note, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
              >
                <div>
                  <p className='font-medium text-gray-900'>{note.title}</p>
                  <p className='text-sm text-gray-600'>
                    Uploaded {new Date(note.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-medium text-green-600'>
                    {note.engagement?.downloads || 0} downloads
                  </p>
                  <p className='text-xs text-gray-500'>
                    {note.engagement?.views || 0} views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Followers & Following */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Followers */}
        <div className='bg-white rounded-lg shadow-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Followers</h3>
            <span className='text-sm text-gray-600'>
              {followersData?.success ? followersData.data.count : 0} followers
            </span>
          </div>

          {followersLoading ? (
            <div className='animate-pulse space-y-3'>
              <div className='h-16 bg-gray-200 rounded'></div>
              <div className='h-16 bg-gray-200 rounded'></div>
            </div>
          ) : followersData?.success &&
            followersData.data.followers.length > 0 ? (
            <div className='space-y-3 max-h-64 overflow-y-auto'>
              {followersData.data.followers.slice(0, 5).map(follower => (
                <UserCard key={follower._id} user={follower} type='follower' />
              ))}
              {followersData.data.followers.length > 5 && (
                <p className='text-sm text-gray-500 text-center mt-2'>
                  +{followersData.data.followers.length - 5} more followers
                </p>
              )}
            </div>
          ) : (
            <div className='text-center py-8'>
              <p className='text-gray-500'>No followers yet</p>
            </div>
          )}
        </div>

        {/* Following */}
        <div className='bg-white rounded-lg shadow-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Following</h3>
            <span className='text-sm text-gray-600'>
              {followingData?.success ? followingData.data.count : 0} following
            </span>
          </div>

          {followingLoading ? (
            <div className='animate-pulse space-y-3'>
              <div className='h-16 bg-gray-200 rounded'></div>
              <div className='h-16 bg-gray-200 rounded'></div>
            </div>
          ) : followingData?.success &&
            followingData.data.following.length > 0 ? (
            <div className='space-y-3 max-h-64 overflow-y-auto'>
              {followingData.data.following.slice(0, 5).map(following => (
                <UserCard
                  key={following._id}
                  user={following}
                  type='following'
                />
              ))}
              {followingData.data.following.length > 5 && (
                <p className='text-sm text-gray-500 text-center mt-2'>
                  +{followingData.data.following.length - 5} more users
                </p>
              )}
            </div>
          ) : (
            <div className='text-center py-8'>
              <p className='text-gray-500'>Not following anyone yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      {statsData?.success && (
        <div className='bg-white rounded-lg shadow-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Performance Insights
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <div className='text-2xl mb-2'>📈</div>
              <h4 className='font-semibold text-gray-900'>
                Upload Consistency
              </h4>
              <p className='text-sm text-gray-600 mt-2'>
                {statsData.data.recentActivity.length > 0
                  ? `${statsData.data.recentActivity.length} uploads in the last 30 days`
                  : 'No recent uploads'}
              </p>
            </div>

            <div className='text-center p-4 bg-green-50 rounded-lg'>
              <div className='text-2xl mb-2'>🎯</div>
              <h4 className='font-semibold text-gray-900'>Engagement Rate</h4>
              <p className='text-sm text-gray-600 mt-2'>
                {statsData.data.overview.totalNotes > 0
                  ? `${(statsData.data.overview.totalDownloads / statsData.data.overview.totalNotes).toFixed(1)} downloads per note`
                  : 'No data yet'}
              </p>
            </div>

            <div className='text-center p-4 bg-purple-50 rounded-lg'>
              <div className='text-2xl mb-2'>🏆</div>
              <h4 className='font-semibold text-gray-900'>Top Category</h4>
              <p className='text-sm text-gray-600 mt-2'>
                {statsData.data.categoryStats.length > 0
                  ? statsData.data.categoryStats[0]._id.replace('-', ' ')
                  : 'No categories yet'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Activity
