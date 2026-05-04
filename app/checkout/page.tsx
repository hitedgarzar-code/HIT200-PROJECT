'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { PayNowPayment } from '@/components/PayNowPayment'
import { PayLaterPlans } from '@/components/PayLaterPlans'
import { getCart, saveCart, CartItem } from '@/components/ProductCard'
import {
  AlertCircle, CheckCircle, CreditCard, Clock,
  ArrowLeft, Package, ShieldCheck, Truck
} from 'lucide-react'
import { toast } from 'sonner'

type PayMethod = 'paynow' | 'paylater' | 'cod' | null

export default function CheckoutPage() {
  const [user, setUser]             = useState<any>(null)
  const [items, setItems]           = useState<CartItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [processing, setProcessing] = useState(false)

  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [fullName, setFullName] = useState('')
  const [address, setAddress]   = useState('')
  const [city, setCity]         = useState('')
  const [zipCode, setZipCode]   = useState('')

  const [paymentMethod, setPaymentMethod]   = useState<PayMethod>(null)
  const [orderId, setOrderId]               = useState<string | null>(null)
  const [orderCreated, setOrderCreated]     = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError]     = useState<string | null>(null)

  const supabase = createClient()
  const router   = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) { router.push('/auth/login?redirectTo=/checkout'); return }

        setUser(authUser)
        setEmail(authUser.email || '')
        setPhone(authUser.phone || authUser.user_metadata?.phone || '')
        setFullName(authUser.user_metadata?.full_name || '')

        // Read cart from localStorage — works for everyone
        const cart = getCart()
        const valid = cart.filter(i => i.product_id && i.name && i.price > 0 && i.quantity > 0)
        setItems(valid)

        if (valid.length > 0) {
          const qty = valid.reduce((s, i) => s + i.quantity, 0)
          toast.success(`${qty} item${qty !== 1 ? 's' : ''} ready for checkout`)
        }
      } catch (err) {
        console.error('[Checkout] load:', err)
        toast.error('Could not load your cart. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const shipping  = subtotal > 50 ? 0 : 9.99
  const tax       = subtotal * 0.10
  const total     = subtotal + shipping + tax
  const formValid = !!(fullName && address && city && phone && email)

  const createOrder = async (): Promise<string | null> => {
    if (!items.length)  { toast.error('Your cart is empty'); return null }
    if (!formValid)     { toast.error('Please fill in all required fields'); return null }

    setProcessing(true)
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      const { data: order, error } = await supabase.from('orders').insert({
        user_id:          user.id,
        order_number:     orderNumber,
        items,
        subtotal,
        shipping,
        tax,
        total,
        status:           'pending_payment',
        payment_status:   'pending',
        payment_method:   null,
        shipping_address: { fullName, address, city, zipCode, email, phone },
      }).select('id').single()

      if (error) throw new Error(error.message)

      setOrderId(order.id)
      setOrderCreated(true)
      toast.success('Order created! Choose a payment method below.')
      return order.id
    } catch (err: any) {
      console.error('[Checkout] createOrder:', err)
      toast.error(`Order failed: ${err.message}`)
      return null
    } finally {
      setProcessing(false)
    }
  }

  const clearCart = async () => {
    saveCart([])
    window.dispatchEvent(new CustomEvent('cart-updated'))
  }

  const handlePaymentSuccess = async (ref: string) => {
    setPaymentSuccess(true)
    setPaymentError(null)
    toast.success('Payment confirmed! Thank you for your order.', { description: `Ref: ${ref}` })
    await clearCart()
    setTimeout(() => router.push('/orders'), 2500)
  }

  const handlePaymentError = (err: string) => {
    setPaymentError(err)
    toast.error('Payment failed', { description: err })
  }

  const confirmCOD = async () => {
    if (!orderId) return
    setProcessing(true)
    try {
      await supabase.from('orders').update({
        payment_method: 'cod',
        payment_status: 'pending',
        status:         'confirmed',
      }).eq('id', orderId)

      await clearCart()
      setPaymentSuccess(true)
      toast.success('Order confirmed! Pay when your order arrives.')
      setTimeout(() => router.push('/orders'), 2500)
    } catch (err: any) {
      toast.error(`Could not confirm: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="p-8 text-center">
        <p className="mb-4 text-muted-foreground">Please log in to continue</p>
        <Link href="/auth/login?redirectTo=/checkout"><Button className="bg-primary text-white">Go to Login</Button></Link>
      </Card>
    </div>
  )

  if (items.length === 0 && !orderCreated) return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/cart" className="flex items-center gap-2 text-primary mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-xl text-muted-foreground mb-6">Your cart is empty</p>
          <Link href="/shop"><Button className="bg-primary text-white">Continue Shopping</Button></Link>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link href="/cart" className="flex items-center gap-2 text-primary hover:text-accent mb-8 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>
        <h1 className="text-4xl font-bold text-primary mb-1">Checkout</h1>
        <p className="text-neutral-500 mb-8">Complete your order from edgARs</p>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── Left: Steps ───────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Step 1: Contact */}
            <Card className="p-6 rounded-2xl border-2 border-neutral-200">
              <h2 className="text-lg font-bold text-primary mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold shrink-0">1</span>
                Contact Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="John Doe" disabled={orderCreated} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" disabled={orderCreated} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="077XXXXXXX" disabled={orderCreated} />
                </div>
              </div>
            </Card>

            {/* Step 2: Shipping */}
            <Card className="p-6 rounded-2xl border-2 border-neutral-200">
              <h2 className="text-lg font-bold text-primary mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold shrink-0">2</span>
                Shipping Address
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Street Address *</label>
                  <Input value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="123 Main St" disabled={orderCreated} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <Input value={city} onChange={e => setCity(e.target.value)}
                    placeholder="Harare" disabled={orderCreated} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP / Area Code</label>
                  <Input value={zipCode} onChange={e => setZipCode(e.target.value)}
                    placeholder="Optional" disabled={orderCreated} />
                </div>
              </div>
            </Card>

            {/* Step 3: Payment */}
            {orderCreated && orderId && !paymentSuccess && (
              <Card className="p-6 rounded-2xl border-2 border-primary/30">
                <h2 className="text-lg font-bold text-primary mb-5 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold shrink-0">3</span>
                  Payment Method
                </h2>

                {paymentError && (
                  <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Payment Error</p>
                      <p className="text-sm">{paymentError}</p>
                    </div>
                  </div>
                )}

                {/* Method tabs */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <button onClick={() => setPaymentMethod('paynow')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${paymentMethod === 'paynow' ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-primary/50'}`}>
                    <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === 'paynow' ? 'text-primary' : 'text-neutral-400'}`} />
                    <p className="font-bold text-sm">PayNow</p>
                    <p className="text-xs text-neutral-500">Mobile wallet</p>
                  </button>
                  <button onClick={() => setPaymentMethod('paylater')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${paymentMethod === 'paylater' ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-primary/50'}`}>
                    <Clock className={`w-6 h-6 mb-2 ${paymentMethod === 'paylater' ? 'text-primary' : 'text-neutral-400'}`} />
                    <p className="font-bold text-sm">Pay Later</p>
                    <p className="text-xs text-neutral-500">3–12 months</p>
                  </button>
                  <button onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-primary/50'}`}>
                    <Package className={`w-6 h-6 mb-2 ${paymentMethod === 'cod' ? 'text-primary' : 'text-neutral-400'}`} />
                    <p className="font-bold text-sm">Cash on Delivery</p>
                    <p className="text-xs text-neutral-500">Pay on arrival</p>
                  </button>
                </div>

                {paymentMethod === 'paynow' && (
                  <PayNowPayment orderId={orderId} amount={total}
                    userEmail={email} userPhone={phone}
                    onSuccess={handlePaymentSuccess} onError={handlePaymentError} />
                )}
                {paymentMethod === 'paylater' && (
                  <PayLaterPlans orderId={orderId} amount={total}
                    phone={phone} email={email}
                    onSuccess={handlePaymentSuccess} onError={handlePaymentError} />
                )}
                {paymentMethod === 'cod' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <Truck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-800">Cash on Delivery</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Have <strong>${total.toFixed(2)}</strong> ready in cash when your order arrives.
                        </p>
                      </div>
                    </div>
                    <ul className="text-sm text-neutral-600 space-y-1 pl-4">
                      <li>• Delivery within 2–5 business days</li>
                      <li>• USD cash payment only</li>
                      <li>• You will receive an SMS confirmation</li>
                    </ul>
                    <Button onClick={confirmCOD} disabled={processing}
                      className="w-full bg-primary text-white py-6 text-base font-bold rounded-xl shadow-lg">
                      {processing ? 'Confirming...' : `Confirm Order — Pay $${total.toFixed(2)} on Delivery`}
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Success state */}
            {paymentSuccess && (
              <Card className="p-10 rounded-2xl border-2 border-green-300 bg-green-50 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">Order Confirmed!</h2>
                <p className="text-green-700 mb-1">Thank you for shopping at edgARs.</p>
                <p className="text-sm text-green-600">Redirecting to your orders...</p>
              </Card>
            )}

            {/* Continue to Payment button */}
            {!orderCreated && (
              <>
                <Button onClick={createOrder} disabled={processing || !formValid}
                  className="w-full bg-gradient-to-r from-primary to-primary-dark text-white text-lg py-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                  {processing ? 'Creating order...' : 'Continue to Payment →'}
                </Button>
                {!formValid && (
                  <p className="text-xs text-center text-neutral-400">Fill in all required fields (*) to continue</p>
                )}
              </>
            )}
          </div>

          {/* ── Right: Order Summary ───────────────── */}
          <div className="lg:col-span-2">
            <Card className="p-6 sticky top-24 rounded-2xl border-2 border-neutral-200 shadow-lg">
              <h2 className="text-lg font-bold text-primary mb-5">Order Summary</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-5 pr-1">
                {items.map(item => (
                  <div key={`${item.product_id}-${item.size}`} className="flex items-start gap-3">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name}
                        className="w-14 h-14 object-cover rounded-lg shrink-0 border border-neutral-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-neutral-500">Size: {item.size} · Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm text-primary shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-600 font-semibold">FREE</span> : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-neutral-600"><span>Tax (10%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold text-primary pt-3 border-t">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>Secured by PayNow Zimbabwe</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Truck className="w-4 h-4 text-primary" />
                  <span>Free shipping on orders over $50</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
