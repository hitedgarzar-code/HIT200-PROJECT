'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CART_KEY, getCart, saveCart, CartItem } from '@/components/ProductCard'

export default function CartPage() {
  const [items, setItems]     = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser]       = useState<any>(null)

  useEffect(() => {
    // Load user for display purposes (checkout button label)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u))

    // Load cart purely from localStorage — works for everyone
    const cart = getCart()
    setItems(cart)
    setLoading(false)

    if (cart.length > 0) {
      const totalQty = cart.reduce((s, i) => s + i.quantity, 0)
      toast.success(`Cart loaded — ${totalQty} item${totalQty !== 1 ? 's' : ''}`, {
        description: 'Ready to checkout whenever you are',
      })
    }

    // Re-sync when cart is updated from another component
    const sync = () => setItems(getCart())
    window.addEventListener('cart-updated', sync)
    return () => window.removeEventListener('cart-updated', sync)
  }, [])

  const removeItem = (productId: string, size: string) => {
    const removed = items.find(i => i.product_id === productId && i.size === size)
    const updated = items.filter(i => !(i.product_id === productId && i.size === size))
    setItems(updated)
    saveCart(updated)
    toast.success(`${removed?.name} removed from cart`)
  }

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    const newQty  = Math.max(1, quantity)
    const updated = items.map(i =>
      i.product_id === productId && i.size === size ? { ...i, quantity: newQty } : i
    )
    setItems(updated)
    saveCart(updated)
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const shipping  = subtotal > 50 ? 0 : 9.99
  const tax       = subtotal * 0.1
  const total     = subtotal + shipping + tax

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">Shopping Cart</h1>

        {/* Guest prompt */}
        {!user && items.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <p className="text-blue-800 text-sm">Sign in to save your cart and track orders.</p>
            <Link href="/auth/login">
              <Button size="sm" className="bg-primary text-white shrink-0">Sign In</Button>
            </Link>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-8">Your cart is empty</p>
            <Link href="/shop">
              <Button className="bg-primary text-white px-8">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, idx) => (
                <div key={`${item.product_id}-${item.size}-${idx}`}
                  className="bg-card rounded-xl p-5 flex gap-5 border border-neutral-200 shadow-sm">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg truncate">{item.name}</h3>
                    <p className="text-muted-foreground text-sm mb-1">Size: {item.size}</p>
                    <p className="text-accent font-bold mb-3">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity - 1)}
                          className="w-8 h-8 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center font-bold">−</button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity + 1)}
                          className="w-8 h-8 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center font-bold">+</button>
                      </div>
                      <button onClick={() => removeItem(item.product_id, item.size)}
                        className="ml-auto text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-card rounded-xl p-7 h-fit border border-neutral-200 shadow-sm">
              <h2 className="text-xl font-bold text-primary mb-5">Order Summary</h2>
              <div className="space-y-3 mb-5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shipping === 0
                    ? <span className="text-green-600 font-semibold">Free</span>
                    : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (10%)</span><span>${tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t pt-4 mb-5">
                <div className="flex justify-between font-bold text-lg text-primary">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>

              {user ? (
                <Link href="/checkout">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white py-3 font-semibold rounded-xl mb-3">
                    Proceed to Checkout
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login?redirectTo=/checkout">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white py-3 font-semibold rounded-xl mb-3">
                    Sign In to Checkout
                  </Button>
                </Link>
              )}

              <Link href="/shop">
                <Button variant="outline" className="w-full rounded-xl">Continue Shopping</Button>
              </Link>

              {subtotal < 50 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Add ${(50 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
