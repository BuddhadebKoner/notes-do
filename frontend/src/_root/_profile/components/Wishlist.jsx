import React from 'react'
import Wishlists from '../../../components/wishlists/Wishlists.jsx'

const Wishlist = () => {
  return <Wishlists />

  const Pagination = ({ pagination }) => {
    if (!pagination || pagination.totalPages <= 1) return null

    return (
      <div className='flex justify-between items-center mt-6'>
        <div className='text-sm text-muted-foreground'>
          Page {pagination.currentPage} of {pagination.totalPages} •{' '}
          {pagination.totalNotes} items in wishlist
        </div>
        <div className='flex space-x-2'>
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrevPage}
            variant='outline'
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!pagination.hasNextPage}
            className='bg-purple-500 hover:bg-purple-600'
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-6 bg-gray-200 rounded w-1/4'></div>
            <div className='space-y-3'>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded w-3/4'></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className='text-center py-8'>
          <p className='text-destructive mb-4'>
            Error loading your wishlist: {error.message}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className='bg-purple-500 hover:bg-purple-600'
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      <Tabs defaultValue='new-wishlists' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='new-wishlists'>My Wishlists</TabsTrigger>
          <TabsTrigger value='legacy-wishlist'>Legacy Wishlist</TabsTrigger>
        </TabsList>

        <TabsContent value='new-wishlists' className='mt-6'>
          <Wishlists />
        </TabsContent>

        <TabsContent value='legacy-wishlist' className='mt-6'>
          <div className='space-y-6'>
            {/* Header */}
            <Card>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle className='text-2xl'>Legacy Wishlist</CardTitle>
                  <div className='flex items-center space-x-2'>
                    <span className='text-purple-500'>🔖</span>
                    <Badge className='bg-purple-100 text-purple-800 hover:bg-purple-200'>
                      {data?.success ? data.data.pagination.totalNotes : 0}{' '}
                      items saved
                    </Badge>
                  </div>
                </div>
                <p className='text-muted-foreground'>
                  Your old wishlist notes. Consider organizing them into the new
                  wishlist collections.
                </p>
              </CardHeader>
            </Card>

            {/* Wishlist Items */}
            {data?.success && data.data.notes.length > 0 ? (
              <div>
                <div className='grid grid-cols-1 gap-6'>
                  {data.data.notes.map(note => (
                    <NoteCard key={note._id} note={note} />
                  ))}
                </div>
                <Pagination pagination={data.data.pagination} />
              </div>
            ) : (
              <Card>
                <CardContent className='text-center py-12'>
                  <div className='text-6xl mb-4'>🔖</div>
                  <h3 className='text-xl font-semibold mb-2'>
                    Your legacy wishlist is empty
                  </h3>
                  <p className='text-muted-foreground mb-6'>
                    Start building your wishlist by saving notes you're
                    interested in!
                  </p>
                  <Button
                    size='lg'
                    className='bg-purple-500 hover:bg-purple-600'
                    asChild
                  >
                    <a href='/'>Browse Notes</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Wishlist
