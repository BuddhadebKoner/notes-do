import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { Button } from './button'
import { GraduationCap, BookOpen } from 'lucide-react'

const RoleSelectionDialog = ({
  open,
  onOpenChange,
  onRoleSelect,
  isLoading,
  error,
}) => {
  const [selectedRole, setSelectedRole] = useState('')

  // Reset selected role when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedRole('')
    }
  }, [open])

  const handleConfirm = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole)
    }
  }

  const handleRetry = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole)
    }
  }

  const roles = [
    {
      value: 'student',
      label: 'Student',
      description: 'I want to access and share study materials',
      icon: <GraduationCap className='w-5 h-5' />,
    },
    {
      value: 'teacher',
      label: 'Teacher',
      description: 'I want to share educational resources with students',
      icon: <BookOpen className='w-5 h-5' />,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent
        className='sm:max-w-md'
        onInteractOutside={e => {
          if (isLoading) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle className='text-center text-xl font-semibold'>
            Welcome to Notes-Do! 🎓
          </DialogTitle>
          <DialogDescription className='text-center text-gray-600'>
            Please select your role to personalize your experience
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select your role' />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem
                  key={role.value}
                  value={role.value}
                  className='flex items-center space-x-2'
                >
                  <div className='flex items-center space-x-3 w-full'>
                    {role.icon}
                    <div className='flex flex-col'>
                      <span className='font-medium'>{role.label}</span>
                      <span className='text-sm text-gray-500'>
                        {role.description}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Visual role preview */}
          {selectedRole && (
            <div className='mt-4 p-3 bg-blue-50 rounded-lg border'>
              <div className='flex items-center space-x-3'>
                {roles.find(r => r.value === selectedRole)?.icon}
                <div>
                  <p className='font-medium text-blue-900'>
                    {roles.find(r => r.value === selectedRole)?.label}
                  </p>
                  <p className='text-sm text-blue-700'>
                    {roles.find(r => r.value === selectedRole)?.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className='mt-4 p-3 bg-red-50 rounded-lg border border-red-200'>
              <p className='text-sm text-red-700'>
                {error.message || 'Failed to create profile. Please try again.'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {error ? (
            <div className='flex space-x-2 w-full'>
              <Button
                onClick={handleRetry}
                disabled={!selectedRole || isLoading}
                className='flex-1'
              >
                {isLoading ? (
                  <div className='flex items-center space-x-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    <span>Retrying...</span>
                  </div>
                ) : (
                  'Try Again'
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={!selectedRole || isLoading}
              className='w-full'
            >
              {isLoading ? (
                <div className='flex items-center space-x-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  <span>Creating Profile...</span>
                </div>
              ) : (
                'Continue'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RoleSelectionDialog
