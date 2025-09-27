import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useGetNotesFeed } from '../../lib/react-query/queriesAndMutation'
import NoteCard from '../../components/notes/NoteCard'
import NoteCardSkeleton from '../../components/notes/NoteCardSkeleton'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination'
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  BookOpen,
  RefreshCw,
} from 'lucide-react'

const NotesFeedPage = () => {
  // Filter and pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    difficulty: 'all',
    university: '',
    department: '',
    subject: '',
    semester: '',
    sortBy: 'uploadDate',
    sortOrder: 'desc',
  })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }))
    setCurrentPage(1) // Reset to first page when search changes
  }, [debouncedSearch])

  // Memoize filters to prevent unnecessary API calls
  const memoizedFilters = useMemo(() => {
    return filters
  }, [
    filters.search,
    filters.category,
    filters.difficulty,
    filters.university,
    filters.department,
    filters.subject,
    filters.semester,
    filters.sortBy,
    filters.sortOrder,
  ])

  // Fetch notes feed data - filter cleaning is now handled in the React Query hook
  const {
    data: feedData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetNotesFeed(currentPage, itemsPerPage, memoizedFilters)

  // Handle filter changes
  const updateFilter = useCallback((key, value) => {
    if (key === 'search') {
      setSearchTerm(value)
      return
    }

    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }, [])

  const handleSearch = e => {
    e.preventDefault()
    // Search is handled automatically by debounced input
    setDebouncedSearch(searchTerm)
  }

  const clearAllFilters = useCallback(() => {
    setSearchTerm('')
    setDebouncedSearch('')
    setFilters({
      search: '',
      category: 'all',
      difficulty: 'all',
      university: '',
      department: '',
      subject: '',
      semester: '',
      sortBy: 'uploadDate',
      sortOrder: 'desc',
    })
    setCurrentPage(1)
  }, [])

  const clearSpecificFilter = useCallback(filterKey => {
    if (filterKey === 'search') {
      setSearchTerm('')
      setDebouncedSearch('')
    } else {
      const defaultValue =
        filterKey === 'category' || filterKey === 'difficulty' ? 'all' : ''
      setFilters(prev => ({ ...prev, [filterKey]: defaultValue }))
    }
    setCurrentPage(1)
  }, [])

  // Handle pagination
  const handlePageChange = useCallback(
    page => {
      const totalPages = feedData?.pagination?.totalPages || 1
      const validPage = Math.max(1, Math.min(page, totalPages))

      setCurrentPage(validPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [feedData?.pagination?.totalPages]
  )

  // Handle items per page change
  const handleItemsPerPageChange = useCallback(newLimit => {
    setItemsPerPage(newLimit)
    setCurrentPage(1) // Reset to first page
  }, [])

  // Handle note actions
  const handleViewNote = noteId => {
    // TODO: Navigate to note detail page or open in modal
    console.log('View note:', noteId)
    window.open(`/note/${noteId}`, '_blank')
  }

  const handleDownloadNote = noteId => {
    // TODO: Handle note download
    console.log('Download note:', noteId)
    window.open(`/api/notes/${noteId}/download`, '_blank')
  }

  // Category options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'lecture-notes', label: 'Lecture Notes' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'exam-preparation', label: 'Exam Preparation' },
    { value: 'project-report', label: 'Project Report' },
    { value: 'research-paper', label: 'Research Paper' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'lab-manual', label: 'Lab Manual' },
    { value: 'reference-material', label: 'Reference Material' },
    { value: 'other', label: 'Other' },
  ]

  const difficultyOptions = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ]

  const sortOptions = [
    { value: 'uploadDate', label: 'Upload Date' },
    { value: 'title', label: 'Title' },
    { value: 'social.views', label: 'Views' },
    { value: 'social.downloads', label: 'Downloads' },
    { value: 'social.rating.averageRating', label: 'Rating' },
  ]

  // Render pagination component
  const renderPagination = () => {
    if (!feedData?.pagination || feedData.pagination.totalPages <= 1)
      return null

    const {
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPrevPage,
    } = feedData.pagination
    const maxVisiblePages = 5

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    return (
      <Pagination className='mt-8'>
        <PaginationContent>
          {hasPrevPage && (
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className='cursor-pointer'
              />
            </PaginationItem>
          )}

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink
                  onClick={() => handlePageChange(1)}
                  className='cursor-pointer'
                >
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}

          {Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => startPage + i
          ).map(pageNum => (
            <PaginationItem key={pageNum}>
              <PaginationLink
                onClick={() => handlePageChange(pageNum)}
                isActive={pageNum === page}
                className='cursor-pointer'
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink
                  onClick={() => handlePageChange(totalPages)}
                  className='cursor-pointer'
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          {hasNextPage && (
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                className='cursor-pointer'
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-6'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
                <BookOpen className='w-8 h-8 text-blue-600' />
                Notes Feed
              </h1>
              <p className='text-gray-600 mt-1'>
                Discover and download study materials from your academic
                community
              </p>
            </div>

            <div className='flex items-center gap-3'>
              {/* Refresh Button */}
              <Button
                variant='outline'
                size='sm'
                onClick={() => refetch()}
                disabled={isFetching}
                className='flex items-center gap-2'
              >
                <RefreshCw
                  className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className='bg-white rounded-lg shadow-sm border p-6 mb-6'>
          {/* Search Bar */}
          <form onSubmit={handleSearch} className='mb-4'>
            <div className='flex gap-2'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  type='text'
                  placeholder='Search notes by title, description, subject, university...'
                  value={searchTerm}
                  onChange={e => updateFilter('search', e.target.value)}
                  className='pl-10'
                />
              </div>
              <Button type='submit' disabled={isFetching}>
                <Search className='w-4 h-4' />
              </Button>
            </div>
          </form>

          {/* Filter Controls */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4'>
            {/* Category Filter */}
            <Select
              value={filters.category}
              onValueChange={value => updateFilter('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Category' />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select
              value={filters.difficulty}
              onValueChange={value => updateFilter('difficulty', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Difficulty' />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* University Filter */}
            <Input
              placeholder='University'
              value={filters.university}
              onChange={e => updateFilter('university', e.target.value)}
            />

            {/* Department Filter */}
            <Input
              placeholder='Department'
              value={filters.department}
              onChange={e => updateFilter('department', e.target.value)}
            />

            {/* Subject Filter */}
            <Input
              placeholder='Subject'
              value={filters.subject}
              onChange={e => updateFilter('subject', e.target.value)}
            />

            {/* Semester Filter */}
            <Input
              type='number'
              placeholder='Semester'
              min='1'
              max='12'
              value={filters.semester}
              onChange={e => updateFilter('semester', e.target.value)}
            />
          </div>

          {/* Sort and Actions */}
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div className='flex items-center gap-2'>
              <Filter className='w-4 h-4 text-gray-500' />
              <span className='text-sm text-gray-600'>Sort by:</span>
              <Select
                value={filters.sortBy}
                onValueChange={value => updateFilter('sortBy', value)}
              >
                <SelectTrigger className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  updateFilter(
                    'sortOrder',
                    filters.sortOrder === 'asc' ? 'desc' : 'asc'
                  )
                }
                className='px-3'
              >
                {filters.sortOrder === 'asc' ? (
                  <SortAsc className='w-4 h-4' />
                ) : (
                  <SortDesc className='w-4 h-4' />
                )}
              </Button>
            </div>

            <div className='flex items-center gap-2'>
              {/* Active Filters Display */}
              {(searchTerm ||
                Object.entries(filters).some(
                  ([key, value]) =>
                    key !== 'sortBy' &&
                    key !== 'sortOrder' &&
                    value &&
                    value !== 'all'
                )) && (
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='text-sm text-gray-600'>Active:</span>
                  {searchTerm && (
                    <Badge
                      variant='secondary'
                      className='text-xs cursor-pointer hover:bg-gray-200'
                      onClick={() => clearSpecificFilter('search')}
                    >
                      search: "{searchTerm}" ×
                    </Badge>
                  )}
                  {Object.entries(filters).map(([key, value]) => {
                    if (
                      key === 'sortBy' ||
                      key === 'sortOrder' ||
                      !value ||
                      value === 'all'
                    )
                      return null
                    return (
                      <Badge
                        key={key}
                        variant='secondary'
                        className='text-xs cursor-pointer hover:bg-gray-200'
                        onClick={() => clearSpecificFilter(key)}
                      >
                        {key}: {value} ×
                      </Badge>
                    )
                  })}
                </div>
              )}

              <Button
                variant='outline'
                size='sm'
                onClick={clearAllFilters}
                className='text-sm'
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        {feedData && (
          <div className='flex items-center justify-between mb-6'>
            <div className='text-sm text-gray-600'>
              Showing{' '}
              <span className='font-medium'>{feedData.notes?.length || 0}</span>{' '}
              of{' '}
              <span className='font-medium'>
                {feedData.pagination?.totalItems || 0}
              </span>{' '}
              notes
            </div>
            <div className='text-sm text-gray-600'>
              Page{' '}
              <span className='font-medium'>
                {feedData.pagination?.currentPage || 1}
              </span>{' '}
              of{' '}
              <span className='font-medium'>
                {feedData.pagination?.totalPages || 1}
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className='text-center py-12'>
            <div className='max-w-md mx-auto'>
              <div className='text-red-600 mb-6'>
                <p className='text-lg font-medium mb-2'>Failed to load notes</p>
                <p className='text-sm text-gray-600 mb-4'>
                  {error?.message ||
                    error?.data?.message ||
                    'Something went wrong while fetching notes. Please check your connection and try again.'}
                </p>
                {error?.status && (
                  <p className='text-xs text-gray-500 mb-4'>
                    Error Code: {error.status}
                  </p>
                )}
              </div>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <Button
                  onClick={() => refetch()}
                  variant='outline'
                  disabled={isFetching}
                  className='min-w-[120px]'
                >
                  {isFetching ? 'Retrying...' : 'Try Again'}
                </Button>
                <Button
                  onClick={clearAllFilters}
                  variant='ghost'
                  className='min-w-[120px]'
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Grid */}
        {isLoading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4'>
            {Array.from({ length: itemsPerPage }, (_, i) => (
              <NoteCardSkeleton key={i} />
            ))}
          </div>
        ) : feedData?.notes?.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4'>
            {feedData.notes.map(note => (
              <NoteCard
                key={note._id}
                note={note}
                onView={handleViewNote}
                onDownload={handleDownloadNote}
              />
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <BookOpen className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No notes found
            </h3>
            <p className='text-gray-600 mb-4'>
              Try adjusting your filters or search terms to find more notes.
            </p>
            <Button onClick={clearAllFilters} variant='outline'>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>
    </div>
  )
}

export default NotesFeedPage
