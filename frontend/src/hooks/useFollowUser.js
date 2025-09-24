import { useState, useMemo } from 'react'
import { useUser } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'
import {
  useFollowUser,
  useUnfollowUser,
  useGetProfile,
} from '../lib/react-query/queriesAndMutation.js'

/**
 * Custom hook for managing follow/unfollow functionality
 * @param {Object} targetUser - The user object to follow/unfollow
 * @param {string} targetUser.username - Username of the target user
 * @param {string} targetUser.id - ID of the target user
 * @param {Object} targetUser.relationship - Relationship data including isFollowing
 * @returns {Object} Hook return object with follow state and handlers
 */
export const useFollowUserLogic = targetUser => {
  const { user: clerkUser } = useUser()
  const isLoggedIn = !!clerkUser

  // This will now return undefined when not logged in due to enabled: isLoggedIn
  const { data: profileData } = useGetProfile()

  // Get mutations
  const followMutation = useFollowUser()
  const unfollowMutation = useUnfollowUser()

  // Remove local loading state - use mutation loading states instead

  // Determine if currently following
  const isFollowing = useMemo(() => {
    if (!targetUser || !profileData?.user || !isLoggedIn) return false

    // Check from target user's relationship data first (most reliable)
    if (targetUser.relationship?.isFollowing !== undefined) {
      return targetUser.relationship.isFollowing
    }

    // Fallback: check current user's following list
    if (profileData?.user?.activity?.following) {
      const currentUserFollowing = profileData.user.activity.following || []
      return currentUserFollowing.some(
        user => user._id === targetUser.id || user.id === targetUser.id
      )
    }

    return false
  }, [targetUser, profileData, isLoggedIn])

  // Check if can follow (not own profile, user exists, etc.)
  const canFollow = useMemo(() => {
    if (!isLoggedIn || !targetUser) return false

    // Can't follow yourself - check against both clerk user and profile data
    if (clerkUser?.username === targetUser.username) return false
    if (profileData?.user?.username === targetUser.username) return false

    // Check privacy settings if available
    if (targetUser.privacy?.canFollow === false) return false

    return true
  }, [isLoggedIn, clerkUser, targetUser, profileData])

  // Handle follow action
  const handleFollow = async () => {
    if (!canFollow || !targetUser?.username) {
      toast.error('Unable to follow this user')
      return
    }

    if (followMutation.isLoading) return

    try {
      await followMutation.mutateAsync(targetUser.username)

      // Show success message
      toast.success(
        `You are now following ${targetUser.name || targetUser.username}`
      )
    } catch (error) {
      console.error('Follow error:', error)

      // Show specific error message
      const errorMessage = error.message || 'Failed to follow user'
      toast.error(errorMessage)
    }
  }

  // Handle unfollow action
  const handleUnfollow = async () => {
    if (!targetUser?.username) {
      toast.error('Unable to unfollow this user')
      return
    }

    if (followMutation.isLoading || unfollowMutation.isLoading) return

    try {
      // No need for setLocalLoading, use mutation loading state instead
      await unfollowMutation.mutateAsync(targetUser.username)

      // Show success message
      toast.success(`You unfollowed ${targetUser.name || targetUser.username}`)
    } catch (error) {
      console.error('Unfollow error:', error)

      // Show specific error message
      const errorMessage = error.message || 'Failed to unfollow user'
      toast.error(errorMessage)
    }
  }

  // Toggle follow state
  const toggleFollow = async () => {
    if (isFollowing) {
      await handleUnfollow()
    } else {
      await handleFollow()
    }
  }

  // Combined loading state
  const isLoading = followMutation.isLoading || unfollowMutation.isLoading

  // Error state
  const error = followMutation.error || unfollowMutation.error

  return {
    isFollowing,
    canFollow,
    isLoading,
    error,
    handleFollow,
    handleUnfollow,
    toggleFollow,
    // Additional states for granular control
    isFollowLoading: followMutation.isLoading,
    isUnfollowLoading: unfollowMutation.isLoading,
  }
}

export default useFollowUserLogic
