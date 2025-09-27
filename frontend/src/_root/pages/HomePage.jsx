import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { CardStack } from '../../components/ui/card-stack'
import {
  BookOpen,
  Upload,
  Download,
  Users,
  Star,
  Search,
  FileText,
  GraduationCap,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { cn } from '../../lib/utils'

// Small utility to highlight the content of specific section of a testimonial content
export const Highlight = ({ children, className }) => {
  return (
    <span
      className={cn(
        'font-bold bg-gray-100 text-gray-900 dark:bg-gray-700/[0.2] dark:text-gray-300 px-1 py-0.5',
        className
      )}
    >
      {children}
    </span>
  )
}

const HomePage = () => {
  // Team members data
  const teamMembers = [
    {
      name: 'Alex Chen',
      role: 'Lead Developer',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      initials: 'AC',
    },
    {
      name: 'Sarah Kim',
      role: 'UI/UX Designer',
      avatar:
        'https://images.unsplash.com/photo-1494790108755-2616b612b2c9?w=150&h=150&fit=crop&crop=face',
      initials: 'SK',
    },
    {
      name: 'Mike Johnson',
      role: 'Backend Engineer',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      initials: 'MJ',
    },
    {
      name: 'Emma Davis',
      role: 'Product Manager',
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      initials: 'ED',
    },
  ]

  // Card stack testimonials
  const CARDS = [
    {
      id: 0,
      name: 'Priya Sharma',
      designation: 'Computer Science Student, IIT Delhi',
      content: (
        <p>
          Notes Doo has been a <Highlight>game-changer</Highlight> for my
          studies. I found amazing notes from seniors and it helped me ace my
          exams!
        </p>
      ),
    },
    {
      id: 1,
      name: 'Rahul Patel',
      designation: 'Mechanical Engineering, NIT Surat',
      content: (
        <p>
          The <Highlight>quality of notes</Highlight> here is outstanding. I can
          easily find notes specific to my university and curriculum.
        </p>
      ),
    },
    {
      id: 2,
      name: 'Ananya Gupta',
      designation: 'MBA Student, IIM Bangalore',
      content: (
        <p>
          <Highlight>Sharing knowledge</Highlight> has never been easier. I love
          how I can help junior students while accessing great content myself.
        </p>
      ),
    },
  ]

  // Popular categories
  const categories = [
    {
      name: 'Lecture Notes',
      icon: BookOpen,
      count: '2,500+',
      color: 'bg-gray-900',
    },
    {
      name: 'Assignments',
      icon: FileText,
      count: '1,800+',
      color: 'bg-gray-800',
    },
    {
      name: 'Exam Prep',
      icon: GraduationCap,
      count: '1,200+',
      color: 'bg-gray-700',
    },
    {
      name: 'Research Papers',
      icon: Star,
      count: '800+',
      color: 'bg-gray-600',
    },
    { name: 'Lab Manuals', icon: Upload, count: '600+', color: 'bg-gray-500' },
    { name: 'Tutorials', icon: Zap, count: '400+', color: 'bg-gray-900' },
  ] // Features
  const features = [
    {
      icon: Shield,
      title: 'Secure & Private',
      description:
        'Your notes are stored securely with privacy controls for university, department, or public sharing.',
    },
    {
      icon: Search,
      title: 'Smart Search',
      description:
        'Find exactly what you need with advanced filters by subject, university, difficulty, and more.',
    },
    {
      icon: Users,
      title: 'Academic Community',
      description:
        'Connect with students from your university and department to share knowledge and resources.',
    },
    {
      icon: TrendingUp,
      title: 'Quality Content',
      description:
        'All notes are reviewed and rated by the community to ensure high-quality academic content.',
    },
  ]

  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <section className='relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center'>
            <div className='flex justify-center mb-6'>
              <Badge
                variant='secondary'
                className='px-4 py-2 text-sm font-medium bg-gray-100 text-gray-900 border-gray-200'
              >
                🎓 Built by Students, for Students
              </Badge>
            </div>

            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6'>
              Share Knowledge,{' '}
              <span className='text-black underline decoration-2 underline-offset-4'>
                Excel Together
              </span>
            </h1>

            <p className='text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed'>
              The ultimate platform for students to upload, discover, and
              download high-quality academic notes. Connect with your university
              community and accelerate your learning journey.
            </p>

            {/* Team Members */}
            <div className='mb-12'>
              <p className='text-sm text-gray-500 mb-6'>
                Meet our founding team
              </p>
              <div className='flex justify-center items-center'>
                <div className='flex -space-x-3 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-white hover:*:data-[slot=avatar]:ring-gray-300 transition-all duration-200'>
                  {teamMembers.map((member, index) => (
                    <Avatar
                      key={index}
                      className='w-12 h-12 hover:scale-110 transition-transform duration-200 cursor-pointer'
                      title={`${member.name} - ${member.role}`}
                    >
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className='bg-gray-900 text-white font-semibold text-xs'>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className='ml-4 text-left'>
                  <p className='text-sm font-medium text-gray-900'>
                    4 passionate developers
                  </p>
                  <p className='text-xs text-gray-500'>
                    Building the future of note sharing
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
              <SignedOut>
                <SignInButton mode='modal'>
                  <Button
                    size='lg'
                    className='px-8 py-3 text-lg bg-black text-white hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl'
                  >
                    Get Started Free
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <Button
                  asChild
                  size='lg'
                  className='px-8 py-3 text-lg bg-black text-white hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl'
                >
                  <Link to='/notes'>
                    Browse Notes
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
              </SignedIn>

              <Button
                asChild
                variant='outline'
                size='lg'
                className='px-8 py-3 text-lg border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-200'
              >
                <Link to='/notes'>
                  <Search className='mr-2 h-5 w-5' />
                  Explore Library
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className='py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Popular Categories
            </h2>
            <p className='text-lg text-gray-600'>
              Discover notes across various academic disciplines
            </p>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {categories.map((category, index) => (
              <Card
                key={index}
                className='hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer border border-gray-200 hover:border-gray-900'
              >
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <div
                      className={`p-3 rounded-lg ${category.color} text-white`}
                    >
                      <category.icon className='h-6 w-6' />
                    </div>
                    <Badge
                      variant='secondary'
                      className='text-xs bg-gray-100 text-gray-900'
                    >
                      {category.count}
                    </Badge>
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    {category.name}
                  </h3>
                  <p className='text-sm text-gray-600'>
                    High-quality {category.name.toLowerCase()} from top
                    universities
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>{' '}
          <div className='text-center mt-8'>
            <Button
              asChild
              variant='outline'
              size='lg'
              className='border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
            >
              <Link to='/notes'>
                View All Categories
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Student Testimonials Section */}
      <section className='py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-200'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <div>
              <h2 className='text-3xl font-bold text-gray-900 mb-4'>
                What Students Say
              </h2>
              <p className='text-lg text-gray-600 mb-6'>
                Hear from thousands of students who have transformed their
                academic journey with Notes Doo.
              </p>
              <div className='space-y-4'>
                <div className='flex items-center space-x-2'>
                  <div className='flex text-yellow-400'>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className='w-5 h-5 fill-current' />
                    ))}
                  </div>
                  <span className='text-sm text-gray-600'>
                    4.9/5 from 2,000+ reviews
                  </span>
                </div>
                <p className='text-gray-600'>
                  Join students from over 500 universities who trust Notes Doo
                  for their academic success.
                </p>
              </div>
            </div>
            <div className='flex justify-center'>
              <CardStack items={CARDS} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Why Choose Notes Doo?
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              Built specifically for students, by students. Experience the
              future of academic collaboration.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {features.map((feature, index) => (
              <div key={index} className='text-center group'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-xl text-white mb-4 group-hover:scale-110 group-hover:bg-black transition-all duration-200'>
                  <feature.icon className='h-8 w-8' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                  {feature.title}
                </h3>
                <p className='text-gray-600 leading-relaxed'>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className='py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-200'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              How It Works
            </h2>
            <p className='text-lg text-gray-600'>
              Getting started is simple and takes less than 2 minutes
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='w-12 h-12 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 border border-gray-300'>
                1
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Sign Up & Join Your University
              </h3>
              <p className='text-gray-600'>
                Create your account and connect with students from your
                university and department.
              </p>
            </div>

            <div className='text-center'>
              <div className='w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4'>
                2
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Upload & Discover Notes
              </h3>
              <p className='text-gray-600'>
                Share your notes with the community and discover high-quality
                content from peers.
              </p>
            </div>

            <div className='text-center'>
              <div className='w-12 h-12 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 border border-gray-300'>
                3
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Learn & Excel Together
              </h3>
              <p className='text-gray-600'>
                Access quality study materials, collaborate with peers, and
                excel in your academics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-gray-200'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-3xl font-bold text-white mb-4'>
            Ready to Transform Your Study Experience?
          </h2>
          <p className='text-xl text-gray-300 mb-8'>
            Join thousands of students who are already sharing knowledge and
            excelling together.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
            <SignedOut>
              <SignInButton mode='modal'>
                <Button
                  size='lg'
                  variant='secondary'
                  className='px-8 py-3 text-lg bg-white text-gray-900 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg'
                >
                  <Users className='mr-2 h-5 w-5' />
                  Join the Community
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Button
                asChild
                size='lg'
                variant='secondary'
                className='px-8 py-3 text-lg bg-white text-gray-900 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg'
              >
                <Link to='/upload'>
                  <Upload className='mr-2 h-5 w-5' />
                  Upload Your First Note
                </Link>
              </Button>
            </SignedIn>

            <Button
              asChild
              variant='outline'
              size='lg'
              className='px-8 py-3 text-lg border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-200'
            >
              <Link to='/notes'>
                <BookOpen className='mr-2 h-5 w-5' />
                Explore Notes
              </Link>
            </Button>
          </div>

          <div className='mt-8 flex justify-center items-center space-x-8 text-gray-300 text-sm'>
            <div className='flex items-center'>
              <CheckCircle className='h-4 w-4 mr-2' />
              Free to use
            </div>
            <div className='flex items-center'>
              <CheckCircle className='h-4 w-4 mr-2' />
              Secure storage
            </div>
            <div className='flex items-center'>
              <CheckCircle className='h-4 w-4 mr-2' />
              University verified
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
