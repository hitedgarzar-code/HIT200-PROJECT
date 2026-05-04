/**
 * GET /api/payments/paynow/poll?ref=xxx&demo=true
 * Polls payment status. In demo mode, marks as completed immediately.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const ref  = request.nextUrl.searchParams.get('ref')
    const demo = request.nextUrl.searchParams.get('demo') === 'true'

    if (!ref) {
      return NextResponse.json({ status: 'failed', message: 'Missing ref' }, { status: 400 })
    }

    if (demo) {
      // In demo mode just return awaiting_payment — the frontend
      // "Simulate Payment" button will trigger the POST below
      return NextResponse.json({ status: 'awaiting_payment', paid: false, demo: true })
    }

    // ── Live mode: check real PayNow poll URL from DB ──────────
    const supabase = await createClient()

    const { data: txn } = await supabase
      .from('paynow_transactions')
      .select('id, poll_url, status, order_id')
      .eq('reference_id', ref)
      .single()

    if (!txn) {
      return NextResponse.json({ status: 'failed', message: 'Transaction not found' }, { status: 404 })
    }

    if (txn.status === 'completed') {
      return NextResponse.json({ status: 'completed', paid: true })
    }

    if (!txn.poll_url) {
      return NextResponse.json({ status: txn.status, paid: false })
    }

    const { pollPayNowStatus } = await import('@/lib/paynow-real')
    const paynowStatus = await pollPayNowStatus(txn.poll_url)

    if (paynowStatus.paid) {
      await supabase.from('paynow_transactions').update({ status: 'completed' }).eq('id', txn.id)
      await supabase.from('orders').update({ payment_status: 'paid', status: 'confirmed' }).eq('id', txn.order_id)
      return NextResponse.json({ status: 'completed', paid: true })
    }

    return NextResponse.json({ status: 'awaiting_payment', paid: false })
  } catch (err: any) {
    console.error('[PayNow poll]', err)
    return NextResponse.json({ status: 'failed', message: 'Poll error' }, { status: 500 })
  }
}

/**
 * POST /api/payments/paynow/poll
 * Called by the "Simulate Payment Success" button in demo mode.
 */
export async function POST(request: NextRequest) {
  try {
    const { reference, orderId } = await request.json()
    if (!reference) {
      return NextResponse.json({ success: false, message: 'Missing reference' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update transaction
    await supabase
      .from('paynow_transactions')
      .update({ status: 'completed' })
      .eq('reference_id', reference)

    // Update order
    if (orderId) {
      await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'confirmed', payment_method: 'paynow' })
        .eq('id', orderId)
    }

    return NextResponse.json({ success: true, message: 'Payment marked as complete' })
  } catch (err: any) {
    console.error('[PayNow simulate]', err)
    return NextResponse.json({ success: false, message: 'Failed to simulate payment' }, { status: 500 })
  }
}
