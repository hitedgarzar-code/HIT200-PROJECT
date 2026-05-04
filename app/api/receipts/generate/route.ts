import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get the next receipt number atomically
    const { data, error } = await supabase.rpc('get_next_receipt_number')

    if (error) {
      console.error('Error generating receipt number:', error)
      return NextResponse.json(
        { error: 'Failed to generate receipt number' },
        { status: 500 }
      )
    }

    const receiptNumber = data as number
    const formattedNumber = `REC-${String(receiptNumber).padStart(6, '0')}`

    return NextResponse.json({
      success: true,
      receipt_number: receiptNumber,
      formatted_receipt: formattedNumber,
    })
  } catch (error: any) {
    console.error('Receipt generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
