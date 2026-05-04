'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface Order {
  id: string
  order_id: string
  total: number
  status: string
  payment_method: string
  payment_status: string
  created_at: string
  items: any[]
  pay_later_plan_id?: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        setUser(authUser)

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders(data || [])
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg mb-8">You haven't placed any orders yet</p>
            <Link href="/shop">
              <Button className="bg-primary hover:bg-primary-light text-white">Start Shopping</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <Card key={order.id} className="p-8">
                {/* Header */}
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                    <p className="font-semibold text-foreground">{order.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p className="font-semibold text-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total</p>
                    <p className="font-semibold text-primary text-lg">
                      ZWL {order.total.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className={
                      order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment</p>
                    <Badge className={
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                      order.payment_status === 'pay_later_active' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>

                {/* Payment Method Badge */}
                <div className="mb-6 flex items-center gap-3 pb-6 border-b border-neutral-200">
                  {order.payment_method === 'paynow' && (
                    <>
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold text-primary">PayNow Instant Payment</p>
                        <p className="text-sm text-neutral-600">Mobile wallet payment processed</p>
                      </div>
                    </>
                  )}
                  {order.payment_method === 'pay_later' && (
                    <>
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-blue-600">Pay Later Instalment Plan</p>
                        <p className="text-sm text-neutral-600">Flexible payment schedule active</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground mb-4">Items Ordered</h3>
                  <div className="space-y-3 bg-neutral-50 p-4 rounded-lg">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-neutral-600">Size: {item.size} × {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-primary">
                          ZWL {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shipping_address && (
                  <div className="mb-6 pb-6 border-b border-neutral-200">
                    <h3 className="font-semibold text-foreground mb-3">Shipping Address</h3>
                    <div className="text-sm text-neutral-600">
                      <p>{order.shipping_address.fullName}</p>
                      <p>{order.shipping_address.address}</p>
                      <p>{order.shipping_address.city}, {order.shipping_address.zipCode}</p>
                    </div>
                  </div>
                )}

                {/* Payment Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Order Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-neutral-600">
                        <span>Subtotal</span>
                        <span>ZWL {(order.total * 0.9).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600">
                        <span>Shipping</span>
                        <span>{order.total > 500 ? 'FREE' : 'ZWL 50.00'}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600 pb-2 border-b border-neutral-200">
                        <span>Tax (10%)</span>
                        <span>ZWL {(order.total * 0.1).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-primary">
                        <span>Total</span>
                        <span>ZWL {order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pay Later Info */}
                  {order.payment_method === 'pay_later' && order.pay_later_plan_id && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3">Instalment Plan Active</h3>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>First payment due in 30 days</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Automatic monthly reminders</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Late fee: 2% per month</span>
                        </div>
                      </div>
                      <Link href={`/pay-later/${order.pay_later_plan_id}`}>
                        <Button variant="outline" className="w-full mt-4">
                          View Instalment Schedule
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
