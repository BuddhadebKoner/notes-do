import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  HardDrive,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/config/api'

const formatBytes = bytes => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const SubjectFolder = ({ subject }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className='ml-6 border-l-2 border-border pl-4 mt-2'>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='flex items-center gap-2 w-full text-left py-2 hover:bg-accent/50 rounded-md px-2 transition-colors'
      >
        {isExpanded ? (
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        ) : (
          <ChevronRight className='h-4 w-4 text-muted-foreground' />
        )}
        <Folder className='h-4 w-4 text-blue-500' />
        <span className='font-medium'>{subject.name}</span>
        <span className='text-sm text-muted-foreground ml-auto'>
          {subject.fileCount} files • {formatBytes(subject.size)}
        </span>
      </button>

      {isExpanded && (
        <div className='ml-6 mt-1 space-y-1'>
          {subject.files.map(file => (
            <a
              key={file.id}
              href={file.webViewLink}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 py-2 px-2 hover:bg-accent/50 rounded-md transition-colors group'
            >
              <FileText className='h-4 w-4 text-muted-foreground group-hover:text-primary' />
              <span className='text-sm truncate flex-1'>{file.name}</span>
              <span className='text-xs text-muted-foreground'>
                {formatBytes(file.size)}
              </span>
            </a>
          ))}
          {subject.files.length === 0 && (
            <p className='text-sm text-muted-foreground py-2 px-2'>No files</p>
          )}
        </div>
      )}
    </div>
  )
}

const YearFolder = ({ year }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className='mb-3'>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='flex items-center gap-2 w-full text-left py-2 hover:bg-accent/50 rounded-lg px-3 transition-colors'
      >
        {isExpanded ? (
          <ChevronDown className='h-5 w-5 text-muted-foreground' />
        ) : (
          <ChevronRight className='h-5 w-5 text-muted-foreground' />
        )}
        <Folder className='h-5 w-5 text-yellow-500' />
        <span className='font-semibold text-lg'>{year.name}</span>
        <span className='text-sm text-muted-foreground ml-auto'>
          {year.subjects.length} subjects
        </span>
      </button>

      {isExpanded && (
        <div className='mt-2'>
          {year.subjects.map(subject => (
            <SubjectFolder key={subject.id} subject={subject} />
          ))}
          {year.subjects.length === 0 && (
            <p className='text-sm text-muted-foreground ml-12 py-2'>
              No subjects
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const DrivePage = () => {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [driveData, setDriveData] = useState(null)
  const [accountInfo, setAccountInfo] = useState(null)
  const [error, setError] = useState(null)
  const [needsReauth, setNeedsReauth] = useState(false)

  const googleDriveToken = user?.publicMetadata?.googleDriveToken

  const fetchDriveData = async () => {
    if (!googleDriveToken) {
      setError('Google Drive not connected')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch folder structure
      const folderResponse = await api.post('/api/google/folder-structure', {
        googleDriveToken,
      })

      if (!folderResponse.data.success) {
        throw new Error(folderResponse.data.message)
      }

      setDriveData(folderResponse.data)

      // Fetch account info for storage quota
      const accountResponse = await api.post('/api/google/account-info', {
        googleDriveToken,
      })

      if (accountResponse.data.success) {
        setAccountInfo(accountResponse.data.accountInfo)
      }
    } catch (err) {
      console.error('Failed to fetch Drive data:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load Drive data'
      )

      if (err.response?.data?.needsReauth) {
        setNeedsReauth(true)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDriveData()
  }, [googleDriveToken])

  const handleReconnect = () => {
    window.location.href = `${api.defaults.baseURL}/api/google/google-drive-auth`
  }

  const storageUsed = accountInfo?.storageQuota?.usage || 0
  const storageLimit = accountInfo?.storageQuota?.limit || 1
  const storagePercent = Math.min((storageUsed / storageLimit) * 100, 100)

  if (!googleDriveToken) {
    return (
      <div className='container mx-auto py-8 px-4'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <HardDrive className='h-6 w-6' />
              Google Drive
            </CardTitle>
            <CardDescription>
              Connect your Google Drive to visualize your Notes-Do storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Google Drive is not connected. Please connect your account to
                view folder structure.
              </AlertDescription>
            </Alert>
            <Button onClick={handleReconnect} className='mt-4'>
              Connect Google Drive
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-6xl'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <HardDrive className='h-8 w-8' />
            Google Drive
          </h1>
          <p className='text-muted-foreground mt-1'>
            View your Notes-Do folder structure and storage
          </p>
        </div>
        <Button
          onClick={fetchDriveData}
          variant='outline'
          disabled={loading}
          className='gap-2'
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant='destructive' className='mb-6'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            {error}
            {needsReauth && (
              <Button
                onClick={handleReconnect}
                variant='outline'
                size='sm'
                className='ml-4'
              >
                Reconnect
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className='grid gap-6 md:grid-cols-3 mb-6'>
        {/* Storage Card */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            {accountInfo ? (
              <div className='space-y-2'>
                <div className='text-2xl font-bold'>
                  {formatBytes(storageUsed)}
                </div>
                <Progress value={storagePercent} className='h-2' />
                <p className='text-xs text-muted-foreground'>
                  {formatBytes(storageLimit)} total
                </p>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Total Files Card */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {driveData?.totalFiles || 0}
            </div>
            <p className='text-xs text-muted-foreground'>In Notes-Do folder</p>
          </CardContent>
        </Card>

        {/* Notes Size Card */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Notes Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatBytes(driveData?.totalSize || 0)}
            </div>
            <p className='text-xs text-muted-foreground'>All uploaded notes</p>
          </CardContent>
        </Card>
      </div>

      {/* Folder Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Folder Structure</CardTitle>
          <CardDescription>
            Notes-Do/{'{year}'}/{'{subject}'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <RefreshCw className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : driveData && driveData.folderStructure.length > 0 ? (
            <div className='space-y-2'>
              <div className='flex items-center gap-2 mb-4 p-3 bg-accent/50 rounded-lg'>
                <Folder className='h-5 w-5 text-primary' />
                <span className='font-semibold'>Notes-Do</span>
              </div>
              {driveData.folderStructure.map(year => (
                <YearFolder key={year.id} year={year} />
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <Folder className='h-16 w-16 mx-auto text-muted-foreground/50 mb-4' />
              <p className='text-muted-foreground'>
                No folders found. Upload some notes to get started!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DrivePage
