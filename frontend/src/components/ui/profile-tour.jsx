import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './card.jsx'
import { Button } from './button.jsx'
import { Badge } from './badge.jsx'
import { X, Settings, Upload, Eye } from 'lucide-react'

export function ProfileTour({ isActive, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  const tourSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Your Profile!',
      description:
        "Let's take a quick tour to help you get started with Notes-Do",
      highlight: false,
    },
    {
      id: 'settings',
      title: 'Complete Your Profile',
      description:
        'The Settings section (highlighted with blue border) lets you add your university, department, and bio. This helps other students find and connect with you!',
      target: '[data-tour="settings"]',
      icon: <Settings className='w-4 h-4' />,
      highlight: true,
    },
    {
      id: 'upload',
      title: 'Upload Your First Note',
      description:
        'Use the Upload button (highlighted with blue border) to share your study materials with other students and start building your reputation!',
      target: '[data-tour="upload"]',
      icon: <Upload className='w-4 h-4' />,
      highlight: true,
    },
    {
      id: 'my-notes',
      title: 'Manage Your Notes',
      description:
        "The My Notes section (highlighted with blue border) is where you can view, edit, and manage all your uploaded study materials. You're all set to explore Notes-Do!",
      target: '[data-tour="uploaded"]',
      icon: <Eye className='w-4 h-4' />,
      highlight: true,
    },
  ]

  const currentTourStep = tourSteps[currentStep]

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      finishTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const finishTour = () => {
    setIsCompleting(true)
    // Clean up all highlights and effects
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight')
    })
    // Small delay for smooth completion
    setTimeout(() => {
      onComplete()
      setIsCompleting(false)
      setCurrentStep(0)
    }, 300)
  }

  const skipTour = () => {
    setIsCompleting(true)
    // Clean up all highlights and effects
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight')
    })
    setTimeout(() => {
      onSkip()
      setIsCompleting(false)
      setCurrentStep(0)
    }, 200)
  }

  // Always center the tour card for better responsiveness
  const getTooltipPosition = () => {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  // Block scrolling when tour is active
  useEffect(() => {
    if (isActive) {
      // Prevent scrolling
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      // Restore scrolling
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
  }, [isActive])

  // Add highlight to target element
  useEffect(() => {
    if (
      isActive &&
      currentTourStep.target &&
      currentTourStep.highlight &&
      !isCompleting
    ) {
      const targetElement = document.querySelector(currentTourStep.target)
      if (targetElement) {
        targetElement.classList.add('tour-highlight')
        // Gentle scroll to center the element without disturbing layout
        setTimeout(() => {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          })
        }, 200)
      }
    }

    return () => {
      // Clean up highlights when step changes
      if (!isCompleting) {
        document.querySelectorAll('.tour-highlight').forEach(el => {
          el.classList.remove('tour-highlight')
        })
      }
    }
  }, [currentStep, isActive, isCompleting])

  if (!isActive) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          isCompleting ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Tour Card - Always Centered */}
      <div
        className='fixed z-50 w-80 max-w-[calc(100vw-2rem)] mx-4 sm:mx-0'
        style={getTooltipPosition()}
      >
        <Card className='shadow-xl border-2 border-blue-200 bg-white animate-in fade-in duration-300'>
          <CardContent className='p-6'>
            {/* Header */}
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                {currentTourStep.icon && (
                  <div className='p-2 bg-blue-100 rounded-full text-blue-600'>
                    {currentTourStep.icon}
                  </div>
                )}
                <div>
                  <h3 className='font-semibold text-gray-900 text-sm'>
                    {currentTourStep.title}
                  </h3>
                  <Badge variant='secondary' className='text-xs mt-1'>
                    Step {currentStep + 1} of {tourSteps.length}
                  </Badge>
                </div>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={skipTour}
                className='p-1 h-auto text-gray-400 hover:text-gray-600'
              >
                <X className='w-4 h-4' />
              </Button>
            </div>

            {/* Content */}
            <p className='text-gray-600 text-sm mb-6'>
              {currentTourStep.description}
            </p>

            {/* Navigation */}
            <div className='flex items-center justify-between'>
              <div className='flex space-x-1'>
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <div className='flex space-x-2'>
                {currentStep > 0 && (
                  <Button variant='outline' size='sm' onClick={prevStep}>
                    Back
                  </Button>
                )}
                <Button size='sm' onClick={nextStep}>
                  {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// CSS for highlights (add to your global CSS)
export const tourStyles = `
  .tour-highlight {
    position: relative;
    z-index: 35 !important;
    border-radius: 8px;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.8) !important;
    animation: pulse-highlight 2s infinite;
  }
  
  @keyframes pulse-highlight {
    0%, 100% { 
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.8);
    }
    50% { 
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 1);
    }
  }
  
  /* Ensure tour elements stay above everything */
  .tour-highlight * {
    z-index: 36 !important;
  }
  
  /* Mobile responsiveness for tour */
  @media (max-width: 768px) {
    .tour-highlight {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.8) !important;
    }
    
    @keyframes pulse-highlight {
      0%, 100% { 
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.8);
      }
      50% { 
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 1);
      }
    }
  }
`
