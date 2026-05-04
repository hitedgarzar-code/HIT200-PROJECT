'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-primary mb-2">Email Verification Failed</h1>
          <p className="text-muted-foreground mb-8">
            The verification link has expired or is invalid. Please request a new one.
          </p>

          <div className="space-y-3">
            <Link href="/auth/signup" className="block">
              <Button className="w-full bg-primary hover:bg-primary-dark text-white">
                Sign Up Again
              </Button>
            </Link>
            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
