import { ClerkProvider } from '@clerk/clerk-react'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('Missing Publishable Key')
}

export default function ClerkProviderWrapper({ children }) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignInUrl='/profile'
      afterSignUpUrl='/profile'
    >
      {children}
    </ClerkProvider>
  )
}
