/**
 * POST /api/payments/paylater/create
 * Creates a Pay Later instalment plan for an order.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateInstallmentPlans, createPayLaterPlanInDB } from '@/lib/paylater'

export async function POST(request: NextRequest) {
  try {
    const { orderId, totalAmount, months, phone, email } = await request.json()

    // ── Validate ───────────────────────────────────────────────
    if (!orderId || !totalAmount || !months || !phone || !email) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (![3, 6, 12].includes(months)) {
      return NextResponse.json(
        { success: false, message: 'Months must be 3, 6, or 12' },
        { status: 400 }
      )
    }

    // ── Auth — try server session, fall back gracefully ────────
    // Same pattern as paynow/initiate — never block the plan creation
    // just because the server-side session cookie lags on Netlify.
    let userId: string | null = null
    const supabase = await createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      // Non-fatal
    }

    if (!userId) {
      // As a last resort, fetch userId from the order itself
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('user_id')
          .eq('id', orderId)
          .single()
        userId = order?.user_id ?? null
      } catch {
        // Still non-fatal
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Could not identify user. Please sign in and try again.' },
        { status: 401 }
      )
    }

    // ── Create the plan ────────────────────────────────────────
    const result = await createPayLaterPlanInDB(supabase, userId, {
      orderId,
      totalAmount: parseFloat(totalAmount),
      months:      months as 3 | 6 | 12,
      phone,
      email,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success:     true,
      planId:      result.planId,
      plan:        result.plan,
      monthlyAmt:  result.plan?.monthlyAmount.toFixed(2),
      totalAmount: result.plan?.totalAmount.toFixed(2),
      months,
      message:     result.message,
    })
  } catch (err: any) {
    console.error('[PayLater create] unexpected:', err)
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}
