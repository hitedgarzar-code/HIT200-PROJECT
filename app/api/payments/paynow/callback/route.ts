import { NextRequest, NextResponse } from 'next/server'
import { simulatePaymentCompletion } from '@/lib/paynow'

/**
 * POST /api/payments/paynow/callback
 * Handles PayNow payment callback from the payment gateway
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference, status } = body

    if (!reference) {
      return NextResponse.json(
        { error: 'Missing payment reference' },
        { status: 400 }
      )
    }

    // Handle different statuses
    if (status === 'completed' || status === 'Paid') {
      const result = await simulatePaymentCompletion(reference)

      if (result.success) {
        return NextResponse.json({ success: true, message: result.message })
      } else {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        )
      }
    }

    // For other statuses, just acknowledge
    return NextResponse.json({ 
      success: true, 
      message: `Payment status received: ${status}` 
    })
  } catch (error) {
    console.error('PayNow callback error:', error)
    return NextResponse.json(
      { error: 'Failed to process callback' },
      { status: 500 }
    )
  }
}
