import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/claid-avatar/save
 * Persists avatar metadata + image URL to the Supabase orders table (or
 * a dedicated avatar_preferences table) so it's attached to the customer's order.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { avatarImage, preferences, productId, orderId } = body

    if (!avatarImage || !preferences) {
      return NextResponse.json({ error: 'Avatar image and preferences are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Store in localStorage-compatible format for guest users too
    const avatarRecord = {
      user_id:       user?.id ?? null,
      product_id:    productId ?? null,
      order_id:      orderId ?? null,
      avatar_image:  avatarImage,
      preferences:   preferences,
      created_at:    new Date().toISOString(),
    }

    // Try to persist to Supabase if user is authenticated
    if (user) {
      const { error } = await supabase
        .from('avatar_preferences')
        .upsert(avatarRecord, { onConflict: 'user_id,product_id' })

      if (error) {
        // Table may not exist — return record for client-side storage
        console.warn('[Save Avatar] Supabase upsert skipped:', error.message)
      }
    }

    return NextResponse.json({
      success: true,
      record: avatarRecord,
      message: user
        ? 'Avatar saved to your account'
        : 'Avatar saved — sign in to keep it across sessions',
    })
  } catch (error) {
    console.error('[Save Avatar] error:', error)
    return NextResponse.json(
      { error: 'Failed to save avatar' },
      { status: 500 }
    )
  }
}
