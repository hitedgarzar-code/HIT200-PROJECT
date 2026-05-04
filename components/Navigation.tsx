'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Menu, X, Shield } from 'lucide-react'
import { CART_KEY } from '@/components/ProductCard'

export default function Navigation() {
  const [user, setUser]               = useState<any>(null)
  const [isAdmin, setIsAdmin]         = useState(false)
  const [loading, setLoading]         = useState(true)
  const [cartCount, setCartCount]     = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])

  // Single source of truth: always localStorage (guest_cart)
  // The DB carts table is not used for display — saves a round-trip
  const fetchCartCount = () => {
    try {
      const items: any[] = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
      const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0)
      setCartCount(count)
    } catch {
      setCartCount(0)
    }
  }

  const checkAdminRole = async (userId: string, userEmail?: string, userMeta?: any) => {
    if (userEmail === 'admin@edgars.com' || userMeta?.is_admin === true) {
      setIsAdmin(true)
      return
    }
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
      setIsAdmin(data?.role === 'admin')
    } catch {
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          const u = session?.user || null
          setUser(u)
          fetchCartCount()
          if (u) checkAdminRole(u.id, u.email, u.user_metadata)
          setLoading(false)
        }
      } catch {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      const u = session?.user || null
      setUser(u)
      fetchCartCount()
      if (u) checkAdminRole(u.id, u.email, u.user_metadata)
      else setIsAdmin(false)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') router.refresh()
    })

    return () => { mounted = false; subscription?.unsubscribe() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refresh cart count on every page navigation and on custom cart-updated events
  useEffect(() => { fetchCartCount() }, [pathname])

  useEffect(() => {
    window.addEventListener('cart-updated', fetchCartCount)
    return () => window.removeEventListener('cart-updated', fetchCartCount)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    router.refresh()
    router.push('/')
  }

  const navLinks = [
    { href: '/',      label: 'Home'   },
    { href: '/shop',  label: 'Shop'   },
    ...(user ? [{ href: '/orders', label: 'Orders' }] : []),
  ]

  return (
    <nav className="bg-primary text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-2xl font-bold hover:text-accent transition">
          edg<span className="text-accent">AR</span>s
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={`hover:text-accent transition ${pathname === l.href ? 'text-accent' : ''}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Cart icon */}
          <Link href="/cart" className="relative hover:text-accent transition">
            <ShoppingCart className="w-6 h-6"/>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* Admin badge */}
          {isAdmin && (
            <Link href="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold transition">
              <Shield className="w-3.5 h-3.5"/>Admin
            </Link>
          )}

          {/* Auth */}
          {loading ? (
            <div className="w-20 h-8 bg-white/20 rounded animate-pulse"/>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-primary text-xs font-bold uppercase">
                    {(user.user_metadata?.full_name || user.email || '?')[0]}
                  </span>
                </div>
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
              </div>
              <Button onClick={handleLogout} size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-medium">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup" className="hidden sm:block">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-primary font-bold">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg">
            {mobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary border-t border-white/10 px-4 py-4 space-y-2">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}
              className="block py-2 hover:text-accent transition">
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-amber-300 hover:text-amber-200 transition">
              <Shield className="w-4 h-4"/>Admin Dashboard
            </Link>
          )}
          <Link href="/cart" onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-accent transition">
            Cart ({cartCount})
          </Link>
        </div>
      )}
    </nav>
  )
}
