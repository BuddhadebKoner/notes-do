import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'
import { Label } from '../ui/label.jsx'
import { Badge } from '../ui/badge.jsx'
import {
  Copy,
  Check,
  Share2,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react'
import {
  useCreateWishlistShareLink,
  useGetWishlistShareInfo,
  useDisableWishlistShareLink,
} from '../../lib/react-query/queriesAndMutation.js'

const ShareWishlistDialog = ({ isOpen, onClose, wishlist }) => {
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)

  // API hooks
  const createShareLinkMutation = useCreateWishlistShareLink()
  const getShareInfoQuery = useGetWishlistShareInfo(
    wishlist?._id,
    isOpen && !!wishlist?._id
  )
  const disableShareLinkMutation = useDisableWishlistShareLink()

  // Update share URL when share info changes
  useEffect(() => {
    if (getShareInfoQuery.data?.success) {
      setShareUrl(getShareInfoQuery.data.data.shareUrl)
    } else {
      setShareUrl('')
    }
  }, [getShareInfoQuery.data])

  const handleCreateShareLink = async (expiryDays = 30) => {
    if (!wishlist?._id) return

    try {
      await createShareLinkMutation.mutateAsync({
        wishlistId: wishlist._id,
        expiryDays,
      })
      // Refetch share info to get updated data
      getShareInfoQuery.refetch()
    } catch (error) {
      console.error('Failed to create wishlist share link:', error)
    }
  }

  const handleDisableShareLink = async () => {
    if (!wishlist?._id) return

    try {
      await disableShareLinkMutation.mutateAsync(wishlist._id)
      setShareUrl('')
      getShareInfoQuery.refetch()
    } catch (error) {
      console.error('Failed to disable wishlist share link:', error)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const shareInfo = getShareInfoQuery.data?.data
  const isLoading =
    createShareLinkMutation.isPending ||
    disableShareLinkMutation.isPending ||
    getShareInfoQuery.isLoading
  const hasActiveLink =
    shareInfo && !shareInfo.isExpired && shareInfo.isShareEnabled

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Share2 className='h-5 w-5' />
            Share Wishlist
          </DialogTitle>
          <DialogDescription>
            Create a secure, trackable link for "{wishlist?.name}"
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Share Link Status */}
          {!hasActiveLink ? (
            <div className='space-y-4'>
              <div className='text-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg'>
                <FolderOpen className='h-12 w-12 mx-auto mb-3 text-muted-foreground' />
                <h3 className='font-medium mb-2'>No Active Share Link</h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  Create a secure, private link that tracks access and expires
                  automatically.
                </p>
                <Button
                  onClick={() => handleCreateShareLink()}
                  disabled={isLoading}
                  className='gap-2'
                >
                  {isLoading ? (
                    <RefreshCw className='h-4 w-4 animate-spin' />
                  ) : (
                    <Share2 className='h-4 w-4' />
                  )}
                  Create Share Link
                </Button>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <Button
                  onClick={() => handleCreateShareLink(7)}
                  variant='outline'
                  disabled={isLoading}
                  className='text-xs'
                >
                  7 Days
                </Button>
                <Button
                  onClick={() => handleCreateShareLink(30)}
                  variant='outline'
                  disabled={isLoading}
                  className='text-xs'
                >
                  30 Days
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Active Share Link */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label>Secure Share Link</Label>
                  <div className='flex items-center gap-2'>
                    {shareInfo?.isExpired ? (
                      <Badge variant='destructive' className='text-xs'>
                        <AlertTriangle className='h-3 w-3 mr-1' />
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant='default' className='text-xs'>
                        Active
                      </Badge>
                    )}
                  </div>
                </div>

                <div className='flex gap-2'>
                  <Input value={shareUrl} readOnly className='flex-1 text-sm' />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleCopyLink}
                    disabled={!shareUrl}
                    className='px-3'
                  >
                    {copied ? (
                      <Check className='h-4 w-4 text-green-600' />
                    ) : (
                      <Copy className='h-4 w-4' />
                    )}
                  </Button>
                </div>

                <div className='text-xs text-muted-foreground space-y-1'>
                  <div className='flex justify-between'>
                    <span>Expires:</span>
                    <span>
                      {shareInfo?.expiryDate
                        ? new Date(shareInfo.expiryDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Total Views:</span>
                    <span>{shareInfo?.stats?.totalViews || 0}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Unique Users:</span>
                    <span>{shareInfo?.stats?.uniqueUsers || 0}</span>
                  </div>
                </div>
              </div>

              {/* Link Actions */}
              <div className='flex gap-3'>
                <Button
                  onClick={() => handleCreateShareLink()}
                  variant='outline'
                  size='sm'
                  disabled={isLoading}
                  className='flex-1'
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Regenerate
                </Button>

                <Button
                  onClick={handleDisableShareLink}
                  variant='outline'
                  size='sm'
                  disabled={isLoading}
                  className='flex-1'
                >
                  Disable Link
                </Button>

                <Button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  variant='outline'
                  size='sm'
                  className='px-3'
                >
                  <BarChart3 className='h-4 w-4' />
                </Button>
              </div>

              {/* Analytics Section */}
              {showAnalytics && shareInfo?.stats && (
                <div className='border rounded-lg p-4 space-y-3'>
                  <h4 className='font-medium text-sm'>Access Analytics</h4>
                  <div className='grid grid-cols-3 gap-4 text-center'>
                    <div>
                      <div className='text-2xl font-bold text-primary'>
                        {shareInfo.stats.totalViews}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Total Views
                      </div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-primary'>
                        {shareInfo.stats.uniqueUsers}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Unique Users
                      </div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-primary'>
                        {shareInfo.stats.lastAccessed
                          ? new Date(
                              shareInfo.stats.lastAccessed
                            ).toLocaleDateString()
                          : 'Never'}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Last Access
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Wishlist Info */}
          <div className='p-3 bg-muted rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <div
                className={`w-3 h-3 rounded-full`}
                style={{
                  backgroundColor: `var(--${wishlist?.color || 'blue'}-500)`,
                }}
              />
              <h4 className='font-medium text-sm'>{wishlist?.name}</h4>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant={wishlist?.isPrivate ? 'secondary' : 'default'}>
                {wishlist?.isPrivate ? 'Private' : 'Public'}
              </Badge>
              <span className='text-xs text-muted-foreground'>
                {wishlist?.notesCount || 0} notes
              </span>
              <span className='text-xs text-muted-foreground'>
                Created:{' '}
                {wishlist?.createdAt
                  ? new Date(wishlist.createdAt).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Security Notice */}
          <div className='text-xs text-muted-foreground bg-purple-50 p-3 rounded-lg border border-purple-200'>
            <strong>🔒 Secure Sharing:</strong> This link is private and
            trackable.
            {wishlist?.isPrivate
              ? ' Only authenticated users can access private wishlists.'
              : ' Anonymous users can only see public notes in this wishlist.'}{' '}
            You can disable it anytime.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShareWishlistDialog
