import React from 'react'
import { ChevronRight, Crown, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'
import { AnimatedGradientText } from './animated-gradient-text'

export function AnimatedBuyButton({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'group relative flex items-center justify-center rounded-full px-5 py-2 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-all duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f] hover:scale-105 cursor-pointer bg-white/80 backdrop-blur-sm border border-white/20',
        className
      )}
      {...props}
    >
      <span
        className='animate-gradient absolute inset-0 block h-full w-full rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/60 via-[#9c40ff]/60 to-[#ffaa40]/60 bg-[length:300%_100%] p-[1px]'
        style={{
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'subtract',
          WebkitClipPath: 'padding-box',
        }}
      />
      <Crown className='size-4 stroke-amber-500 mr-2' />
      <hr className='mx-2 h-4 w-px shrink-0 bg-neutral-300/50' />
      <AnimatedGradientText
        className='text-sm font-bold tracking-wide'
        speed={1.5}
        colorFrom='#ffaa40'
        colorTo='#9c40ff'
      >
        {children || 'Buy Premium Notes'}
      </AnimatedGradientText>
      {/* <Sparkles className="ml-2 size-3 stroke-violet-500 animate-pulse" /> */}
      {/* <ChevronRight className="ml-1 size-4 stroke-neutral-600 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" /> */}
    </div>
  )
}
