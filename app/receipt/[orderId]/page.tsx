import { use } from 'react'
import { createClient } from '@/lib/supabase/server'
import ReceiptPrinter from '@/components/ReceiptPrinter'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ReceiptPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  const supabase = await createClient()

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">Receipt not found</p>
            <Link href="/">
              <Button className="bg-primary text-white">Back to Home</Button>
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/orders" className="inline-flex items-center gap-2 text-accent hover:text-accent-dark mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>

          <ReceiptPrinter
            receiptNumber={order.receipt_number || 'REC-000000'}
            orderId={order.id}
            orderDate={order.created_at}
            items={order.items}
            subtotal={order.subtotal}
            shipping={order.shipping}
            tax={order.tax}
            total={order.total}
            customer={{
              name: order.shipping_address?.fullName || '',
              email: order.shipping_address?.email || '',
              phone: order.shipping_address?.phone || '',
              address: order.shipping_address?.address || '',
              city: order.shipping_address?.city || '',
              zipCode: order.shipping_address?.zipCode || '',
            }}
            paymentMethod={order.payment_method || 'N/A'}
            paymentReference={order.payment_reference}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading receipt:', error)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Error loading receipt</p>
          <Link href="/">
            <Button className="bg-primary text-white">Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }
}
