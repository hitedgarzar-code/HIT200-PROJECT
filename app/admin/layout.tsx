import type { Metadata } from 'next'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'edgARs Admin — Dashboard',
  description: 'edgARs store administration panel',
}

/**
 * Isolated layout for all /admin/* routes.
 * Deliberately excludes the storefront Navigation, Footer, and SplashProvider
 * so the admin dashboard renders as its own full-screen app.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </>
  )
}
