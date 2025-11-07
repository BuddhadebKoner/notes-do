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
      name: 'Buddhadeb Koner',
      role: 'Full Stack Developer',
      avatar:
        'https://res.cloudinary.com/dsfztnp9x/image/upload/v1762492868/next-portfolio/xyxj8fdggwypdx2bwdnp.png',
      initials: 'BK',
      links: {
        portfolio: 'https://buddhadebkoner.vercel.app/',
        github: 'https://github.com/BuddhadebKoner/',
        linkedin: 'https://www.linkedin.com/in/buddhadeb-koner/',
        twitter: 'https://x.com/buddhadeb_koner/',
        instagram: 'https://www.instagram.com/buddhadeb_koner/',
      },
    },
    {
      name: 'Debesh Mondal',
      role: 'Developer',
      avatar:
        'https://res.cloudinary.com/dsfztnp9x/image/upload/v1762527232/Untitled_lbdsac.jpg',
      initials: 'DM',
      links: {
        github: 'https://github.com/DebeshMondal',
        linkedin: 'https://www.linkedin.com/in/debesh-mondal-999167296/',
      },
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
                🎓 Built by Buddhadeb Koner for Students
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
                Built by our team
              </p>
              <div className='flex justify-center items-center flex-wrap gap-6'>
                {teamMembers.map((member, index) => (
                  <div key={index} className='flex items-center'>
                    <a
                      href={member.links?.portfolio || member.links?.github || '#'}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='mr-3'
                    >
                      <Avatar
                        className='w-12 h-12 hover:scale-110 transition-transform duration-200 cursor-pointer ring-2 ring-white hover:ring-gray-300'
                        title={`${member.name} - ${member.role}`}
                      >
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className='bg-gray-900 text-white font-semibold text-xs'>
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                    </a>
                    <div className='text-left'>
                      <a
                        href={member.links?.portfolio || member.links?.github || '#'}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm font-medium text-gray-900 hover:underline block'
                      >
                        {member.name}
                      </a>
                      <p className='text-xs text-gray-500'>
                        {member.role}
                      </p>
                      <div className='flex gap-2 mt-1'>
                        {member.links?.github && (
                          <a
                            href={member.links.github}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-gray-400 hover:text-gray-900 transition-colors'
                            title='GitHub'
                          >
                            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                              <path fillRule='evenodd' d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' clipRule='evenodd' />
                            </svg>
                          </a>
                        )}
                        {member.links?.linkedin && (
                          <a
                            href={member.links.linkedin}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-gray-400 hover:text-blue-600 transition-colors'
                            title='LinkedIn'
                          >
                            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                              <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
                            </svg>
                          </a>
                        )}
                        {member.links?.twitter && (
                          <a
                            href={member.links.twitter}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-gray-400 hover:text-blue-400 transition-colors'
                            title='Twitter/X'
                          >
                            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                              <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
              className='px-8 py-3 text-lg border-2 border-white text-white bg-transparent hover:bg-white hover:text-gray-900 transition-all duration-200'
            >
              <Link to='/notes' className='flex items-center'>
                <BookOpen className='mr-2 h-5 w-5' />
                <span>Explore Notes</span>
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
