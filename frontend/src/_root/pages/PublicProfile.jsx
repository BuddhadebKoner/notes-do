import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser, SignedOut, SignInButton } from '@clerk/clerk-react'
import { useGetPublicProfile } from '../../lib/react-query/queriesAndMutation.js'
import useFollowUserLogic from '../../hooks/useFollowUser.js'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.jsx'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '../../components/ui/avatar.jsx'
import { Badge } from '../../components/ui/badge.jsx'
import { Button } from '../../components/ui/button.jsx'
import { Skeleton } from '../../components/ui/skeleton.jsx'
import ConfirmationDialog from '../../components/ui/confirmation-dialog.jsx'
import PublicUserNotes from '../../components/notes/PublicUserNotes.jsx'
import {
  MapPin,
  Calendar,
  BookOpen,
  Users,
  UserPlus,
  MessageCircle,
  Link2,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Lock,
  Eye,
  School,
  GraduationCap,
  Heart,
  Download,
  FileText,
  UserCheck,
} from 'lucide-react'

const PublicProfile = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: clerkUser } = useUser()

  // State for confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationAction, setConfirmationAction] = useState(null)

  // Use React Query hook for fetching public profile
  const {
    data: profileData,
    isLoading: loading,
    error,
  } = useGetPublicProfile(username)

  // Extract user data from the response
  const userData = profileData?.user

  // Follow logic hook
  const {
    isFollowing,
    canFollow: canFollowUser,
    isLoading: followLoading,
    toggleFollow,
    error: followError,
  } = useFollowUserLogic(
    userData
      ? {
          id: userData.id,
          username: userData.username,
          name: userData.profile?.fullName,
          relationship: userData.relationship,
          privacy: userData.privacy,
        }
      : null
  )

  // Handle follow action with confirmation
  const handleFollow = async () => {
    const action = isFollowing ? 'unfollow' : 'follow'
    setConfirmationAction(action)
    setShowConfirmation(true)
  }

  // Confirm follow/unfollow action
  const confirmFollowAction = async () => {
    try {
      await toggleFollow()
      setShowConfirmation(false)
      setConfirmationAction(null)
    } catch (error) {
      console.error('Follow action failed:', error)
    }
  }

  // Cancel confirmation
  const cancelConfirmation = () => {
    setShowConfirmation(false)
    setConfirmationAction(null)
  }

  // Handle message action (placeholder)
  const handleMessage = () => {
    // TODO: Implement messaging functionality
    console.log('Message user:', userData.username)
  }

  // Social link icons
  const getSocialIcon = platform => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin className='h-4 w-4' />
      case 'github':
        return <Github className='h-4 w-4' />
      case 'twitter':
        return <Twitter className='h-4 w-4' />
      case 'website':
        return <Globe className='h-4 w-4' />
      default:
        return <Link2 className='h-4 w-4' />
    }
  }

  if (loading) {
    return (
      <div className='max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <div className='flex flex-col md:flex-row items-start md:items-center gap-6'>
                <Skeleton className='w-24 h-24 rounded-full' />
                <div className='space-y-2 flex-1'>
                  <Skeleton className='h-8 w-48' />
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-4 w-64' />
                </div>
                <div className='flex gap-2'>
                  <Skeleton className='h-10 w-24' />
                  <Skeleton className='h-10 w-24' />
                </div>
              </div>
            </CardHeader>
          </Card>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className='p-6'>
                  <Skeleton className='h-20 w-full' />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || (!loading && !userData)) {
    const errorMessage =
      error?.message || error || 'Unable to load this profile at the moment.'
    const isUserNotFound =
      errorMessage.toLowerCase().includes('not found') || error?.status === 404

    return (
      <div className='max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
        <Card>
          <CardContent className='p-12 text-center'>
            <div className='text-6xl mb-4'>😕</div>
            <h2 className='text-2xl font-semibold mb-2'>
              {isUserNotFound ? 'User Not Found' : 'Profile Unavailable'}
            </h2>
            <p className='text-gray-600 mb-4'>
              {isUserNotFound
                ? "The user you're looking for doesn't exist or may have changed their username."
                : errorMessage}
            </p>
            <Button onClick={() => navigate('/')} variant='outline'>
              Go Back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { privacy, profile, academic, activity, contact, relationship } =
    userData
  const isOwnProfile = privacy?.isOwnProfile
  const hasAccess = privacy?.hasAccess
  const canFollow = privacy?.canFollow

  return (
    <div className='max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
      <div className='space-y-6'>
        {/* Main Profile Card */}
        <Card>
          <CardHeader>
            <div className='flex flex-col md:flex-row items-start md:items-center gap-6'>
              {/* Avatar and Basic Info */}
              <Avatar className='w-24 h-24 border-4 border-white shadow-lg'>
                <AvatarImage src={profile?.avatar} alt={profile?.fullName} />
                <AvatarFallback className='text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white'>
                  {profile?.firstName?.[0]}
                  {profile?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className='flex-1 space-y-2'>
                <div className='flex items-center gap-2'>
                  <h1 className='text-3xl font-bold'>{profile?.fullName}</h1>
                  {userData.account?.isVerified && (
                    <Badge
                      variant='secondary'
                      className='bg-blue-100 text-blue-800'
                    >
                      <UserCheck className='h-3 w-3 mr-1' />
                      Verified
                    </Badge>
                  )}
                  {privacy?.profileVisibility === 'private' && (
                    <Badge
                      variant='outline'
                      className='bg-gray-100 text-gray-700'
                    >
                      <Lock className='h-3 w-3 mr-1' />
                      Private
                    </Badge>
                  )}
                </div>

                <p className='text-gray-600'>@{userData.username}</p>

                {hasAccess && profile?.bio && (
                  <p className='text-gray-700 max-w-2xl'>{profile.bio}</p>
                )}

                {/* Academic Info */}
                <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                  {academic?.university && (
                    <div className='flex items-center gap-1'>
                      <School className='h-4 w-4' />
                      {academic.university}
                    </div>
                  )}
                  {academic?.department && (
                    <div className='flex items-center gap-1'>
                      <GraduationCap className='h-4 w-4' />
                      {academic.department}
                    </div>
                  )}
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-4 w-4' />
                    Joined{' '}
                    {new Date(userData.account?.createdAt).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className='flex gap-2'>
                  {(canFollow || canFollowUser) && (
                    <>
                      {clerkUser ? (
                        <Button
                          onClick={handleFollow}
                          size='sm'
                          disabled={followLoading}
                          variant={isFollowing ? 'outline' : 'default'}
                        >
                          {followLoading ? (
                            <>
                              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2'></div>
                              {isFollowing ? 'Unfollowing...' : 'Following...'}
                            </>
                          ) : (
                            <>
                              {isFollowing ? (
                                <UserCheck className='h-4 w-4 mr-2' />
                              ) : (
                                <UserPlus className='h-4 w-4 mr-2' />
                              )}
                              {isFollowing ? 'Following' : 'Follow'}
                            </>
                          )}
                        </Button>
                      ) : (
                        <SignedOut>
                          <SignInButton mode='modal'>
                            <Button size='sm' variant='default'>
                              <UserPlus className='h-4 w-4 mr-2' />
                              Follow
                            </Button>
                          </SignInButton>
                        </SignedOut>
                      )}
                    </>
                  )}
                  {clerkUser ? (
                    <Button variant='outline' onClick={handleMessage} size='sm'>
                      <MessageCircle className='h-4 w-4 mr-2' />
                      Message
                    </Button>
                  ) : (
                    <SignedOut>
                      <SignInButton mode='modal'>
                        <Button variant='outline' size='sm'>
                          <MessageCircle className='h-4 w-4 mr-2' />
                          Message
                        </Button>
                      </SignInButton>
                    </SignedOut>
                  )}
                </div>
              )}

              {isOwnProfile && (
                <Button
                  variant='outline'
                  onClick={() => navigate('/profile')}
                  size='sm'
                >
                  <Eye className='h-4 w-4 mr-2' />
                  View My Profile
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Privacy Notice */}
        {!hasAccess && privacy?.profileVisibility === 'private' && (
          <Card>
            <CardContent className='p-6 text-center'>
              <Lock className='h-12 w-12 mx-auto mb-3 text-gray-400' />
              <h3 className='text-lg font-semibold mb-2'>Private Profile</h3>
              <p className='text-gray-600'>
                This user has a private profile.{' '}
                {canFollow
                  ? 'Follow them to see their activity.'
                  : 'Only they can see their profile details.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* University Access Notice */}
        {!hasAccess && privacy?.profileVisibility === 'university' && (
          <Card>
            <CardContent className='p-6 text-center'>
              <School className='h-12 w-12 mx-auto mb-3 text-gray-400' />
              <h3 className='text-lg font-semibold mb-2'>
                University-Only Profile
              </h3>
              <p className='text-gray-600'>
                This profile is only visible to students from{' '}
                {academic?.university}.
                {clerkUser
                  ? ' Make sure your university is set in your profile settings.'
                  : ' Please sign in to view university profiles.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Profile Content - Only show if has access */}
        {hasAccess && (
          <>
            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <Card>
                <CardContent className='p-6 text-center'>
                  <FileText className='h-8 w-8 mx-auto mb-2 text-blue-500' />
                  <p className='text-2xl font-bold'>
                    {activity?.totalUploads || 0}
                  </p>
                  <p className='text-sm text-gray-600'>Notes Uploaded</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6 text-center'>
                  <Download className='h-8 w-8 mx-auto mb-2 text-green-500' />
                  <p className='text-2xl font-bold'>
                    {activity?.totalDownloads || 0}
                  </p>
                  <p className='text-sm text-gray-600'>Total Downloads</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6 text-center'>
                  <Heart className='h-8 w-8 mx-auto mb-2 text-red-500' />
                  <p className='text-2xl font-bold'>
                    {activity?.totalLikesReceived || 0}
                  </p>
                  <p className='text-sm text-gray-600'>Likes Received</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6 text-center'>
                  <Users className='h-8 w-8 mx-auto mb-2 text-purple-500' />
                  <p className='text-2xl font-bold'>
                    {activity?.followersCount || 0}
                  </p>
                  <p className='text-sm text-gray-600'>Followers</p>
                </CardContent>
              </Card>
            </div>

            {/* Social Links */}
            {contact?.socialLinks &&
              Object.keys(contact.socialLinks).some(
                key => contact.socialLinks[key]
              ) && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Link2 className='h-5 w-5' />
                      Social Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='flex gap-4'>
                      {Object.entries(contact.socialLinks).map(
                        ([platform, url]) =>
                          url && (
                            <a
                              key={platform}
                              href={url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
                            >
                              {getSocialIcon(platform)}
                              <span className='capitalize'>{platform}</span>
                            </a>
                          )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* User Notes */}
            <PublicUserNotes
              username={username}
              hasAccess={hasAccess}
              profileVisibility={privacy?.profileVisibility}
            />

            {/* Followers/Following */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {activity?.followers && activity.followers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Users className='h-5 w-5' />
                      Followers ({activity.followers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {activity.followers.slice(0, 5).map(follower => (
                        <div
                          key={follower._id}
                          className='flex items-center gap-3'
                        >
                          <Avatar className='w-8 h-8'>
                            <AvatarImage src={follower.profile?.avatar} />
                            <AvatarFallback className='text-xs'>
                              {follower.profile?.firstName?.[0]}
                              {follower.profile?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-sm'>
                              {follower.profile?.firstName}{' '}
                              {follower.profile?.lastName}
                            </p>
                            <p className='text-xs text-gray-600'>
                              @{follower.username}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {activity.followers.length > 5 && (
                      <div className='mt-4 text-center'>
                        <Button variant='outline' size='sm'>
                          View All ({activity.followers.length})
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activity?.following && activity.following.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Users className='h-5 w-5' />
                      Following ({activity.following.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {activity.following.slice(0, 5).map(followedUser => (
                        <div
                          key={followedUser._id}
                          className='flex items-center gap-3'
                        >
                          <Avatar className='w-8 h-8'>
                            <AvatarImage src={followedUser.profile?.avatar} />
                            <AvatarFallback className='text-xs'>
                              {followedUser.profile?.firstName?.[0]}
                              {followedUser.profile?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-sm'>
                              {followedUser.profile?.firstName}{' '}
                              {followedUser.profile?.lastName}
                            </p>
                            <p className='text-xs text-gray-600'>
                              @{followedUser.username}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {activity.following.length > 5 && (
                      <div className='mt-4 text-center'>
                        <Button variant='outline' size='sm'>
                          View All ({activity.following.length})
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Follow/Unfollow Confirmation Dialog */}
        <ConfirmationDialog
          open={showConfirmation}
          onClose={cancelConfirmation}
          onConfirm={confirmFollowAction}
          title={
            confirmationAction === 'follow'
              ? `Follow @${userData?.username}?`
              : `Unfollow @${userData?.username}?`
          }
          description={
            confirmationAction === 'follow'
              ? `You will start following @${userData?.username} and see their activity in your feed.`
              : `You will no longer see @${userData?.username}'s activity in your feed.`
          }
          confirmText={confirmationAction === 'follow' ? 'Follow' : 'Unfollow'}
          cancelText='Cancel'
          variant={confirmationAction === 'follow' ? 'default' : 'outline'}
          loading={followLoading}
        />
      </div>
    </div>
  )
}

export default PublicProfile
