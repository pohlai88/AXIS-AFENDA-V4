/**
 * Email Verification Page
 * 
 * Displays verification status after user clicks email verification link.
 * Shows loading state, success message, or error state.
 * 
 * @route /verify-email?token=xxx
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'

type VerificationState = 'loading' | 'success' | 'error' | 'already-verified'

interface VerificationResult {
  success: boolean
  message: string
  alreadyVerified?: boolean
  error?: string
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [state, setState] = useState<VerificationState>('loading')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('Invalid verification link. Please check your email and try again.')
      return
    }

    // Verify email with token
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data: VerificationResult = await response.json()

        if (response.ok && data.success) {
          if (data.alreadyVerified) {
            setState('already-verified')
            setMessage(data.message)
          } else {
            setState('success')
            setMessage(data.message)
          }
        } else {
          setState('error')
          setMessage(data.error || 'Verification failed. Please try again.')
        }
      })
      .catch((error) => {
        console.error('Verification error:', error)
        setState('error')
        setMessage('An unexpected error occurred. Please try again later.')
      })
  }, [token])

  const handleResendEmail = async () => {
    // This would require the user's email - you might want to prompt for it
    // or store it in localStorage from the registration flow
    setIsResending(true)
    // Implementation would go here
    setIsResending(false)
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  const handleGoToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
            {state === 'loading' && (
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            )}
            {state === 'success' && (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            )}
            {state === 'already-verified' && (
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            )}
            {state === 'error' && (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>

          <CardTitle className="text-2xl font-bold">
            {state === 'loading' && 'Verifying Email...'}
            {state === 'success' && 'Email Verified! 🎉'}
            {state === 'already-verified' && 'Already Verified ✓'}
            {state === 'error' && 'Verification Failed'}
          </CardTitle>

          <CardDescription>
            {state === 'loading' && 'Please wait while we verify your email address'}
            {state === 'success' && 'Your email has been successfully verified'}
            {state === 'already-verified' && 'This email has already been verified'}
            {state === 'error' && 'We encountered an issue verifying your email'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {state === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message || 'Welcome to NEXIS AFENDA! Your account is now active and ready to use.'}
              </AlertDescription>
            </Alert>
          )}

          {state === 'already-verified' && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                {message || 'Your email is already verified. You can proceed to login.'}
              </AlertDescription>
            </Alert>
          )}

          {state === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {state === 'success' && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <h4 className="mb-2 font-semibold text-purple-900">Next Steps:</h4>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>✓ Complete your profile</li>
                <li>✓ Invite team members</li>
                <li>✓ Create your first project</li>
                <li>✓ Explore features and integrations</li>
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {state === 'success' && (
            <Button 
              onClick={handleGoToDashboard} 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Go to Dashboard
            </Button>
          )}

          {(state === 'already-verified' || state === 'error') && (
            <Button 
              onClick={handleGoToLogin} 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Go to Login
            </Button>
          )}

          {state === 'error' && (
            <Button 
              onClick={handleResendEmail}
              variant="outline"
              className="w-full"
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
