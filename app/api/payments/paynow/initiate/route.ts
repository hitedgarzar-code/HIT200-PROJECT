/**
 * POST /api/payments/paynow/initiate
 *
 * Works in DEMO mode (no real PayNow API calls).
 * Returns a simulated success so the full checkout flow can be tested end-to-end.
 * When you are ready for live payments, swap the DEMO block for the real PayNow call.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEMO_MODE = true  // ← set to false when ready for real PayNow payments

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, phone, email, method } = await request.json()

    // ── Basic validation ───────────────────────────────────────
    if (!orderId || !amount || !phone || !email || !method) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all required fields' },
        { status: 400 }
      )
    }

    const cleanPhone = phone.replace(/\s/g, '')
    const validPhone =
      /^(077|078|071|073)\d{7}$/.test(cleanPhone) ||
      /^(0|\+?263)(77|78|71|73)\d{7}$/.test(cleanPhone)

    if (!validPhone) {
      return NextResponse.json(
        { success: false, message: 'Enter a valid Zimbabwe number (077/078/071/073)' },
        { status: 400 }
      )
    }

    // ── Auth: try server session, fall back gracefully ─────────
    // The server client reads the session cookie forwarded by middleware.
    // On some Netlify deployments the cookie handshake can lag — we never
    // block the payment just because getUser() returns null; instead we
    // accept the orderId as proof the client already created the order.
    let userId: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      // Non-fatal — continue without server-side user verification
    }

    // ── Generate payment reference ─────────────────────────────
    const reference = `ORD-${orderId.slice(0, 8)}-${Date.now()}`

    if (DEMO_MODE) {
      // ── DEMO: simulate initiated payment ──────────────────────
      // Store a demo transaction record if we have the user id
      if (userId) {
        try {
          const supabase = await createClient()
          await supabase.from('paynow_transactions').insert({
            user_id:        userId,
            order_id:       orderId,
            amount:         parseFloat(amount),
            reference_id:   reference,
            status:         'initiated',
            payment_method: method,
            poll_url:       null,
          })
          // Mark order as awaiting payment
          await supabase
            .from('orders')
            .update({ payment_status: 'awaiting_payment', payment_method: method })
            .eq('id', orderId)
        } catch (dbErr) {
          console.warn('[PayNow] demo DB write skipped:', dbErr)
        }
      }

      return NextResponse.json({
        success:      true,
        reference,
        pollUrl:      `/api/payments/paynow/poll?ref=${encodeURIComponent(reference)}&demo=true`,
        instructions: `DEMO MODE — your $${parseFloat(amount).toFixed(2)} payment request has been sent to ${cleanPhone}. Click "Simulate Payment Success" below to complete the order.`,
        demo:         true,
        message:      'Demo payment initiated',
      })
    }

    // ── LIVE MODE (active when DEMO_MODE = false) ──────────────
    // Import real PayNow integration
    const { initiateMobilePayment } = await import('@/lib/paynow-real')

    const result = await initiateMobilePayment({
      reference,
      amount:      parseFloat(amount),
      phone:       cleanPhone,
      email,
      method:      method as any,
      description: `edgARs Order ${orderId.slice(0, 8)}`,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || 'PayNow payment initiation failed' },
        { status: 502 }
      )
    }

    if (userId) {
      try {
        const supabase = await createClient()
        await supabase.from('paynow_transactions').insert({
          user_id:        userId,
          order_id:       orderId,
          amount:         parseFloat(amount),
          reference_id:   reference,
          status:         'initiated',
          payment_method: method,
          poll_url:       result.pollUrl ?? null,
        })
        await supabase
          .from('orders')
          .update({ payment_status: 'awaiting_payment', payment_method: method })
          .eq('id', orderId)
      } catch (dbErr) {
        console.warn('[PayNow] live DB write failed:', dbErr)
      }
    }

    return NextResponse.json({
      success:      true,
      reference,
      pollUrl:      `/api/payments/paynow/poll?ref=${encodeURIComponent(reference)}`,
      paynowRef:    result.paynowRef,
      instructions: `A payment request of $${parseFloat(amount).toFixed(2)} has been sent to ${cleanPhone}. Approve it on your phone.`,
      message:      'Payment initiated',
    })
  } catch (err: any) {
    console.error('[PayNow initiate]', err)
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}
