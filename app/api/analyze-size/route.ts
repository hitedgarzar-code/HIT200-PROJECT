import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { photoDataUrl, category } = await request.json()

    if (!photoDataUrl) {
      return NextResponse.json({ size: null }, { status: 400 })
    }

    const base64 = photoDataUrl.replace(/^data:image\/\w+;base64,/, '')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: [
              {
                type:   'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
              },
              {
                type: 'text',
                text: `You are a fashion sizing expert. Look at this person and suggest the best clothing size for a ${category} garment. Respond ONLY with a JSON object, no other text:
{"size": "M", "confidence": "high", "reason": "Athletic build with broad shoulders"}
Size options: XS, S, M, L, XL, XXL
Confidence options: low, medium, high`,
              },
            ],
          },
        ],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({
      size:       parsed.size ?? null,
      confidence: parsed.confidence ?? 'low',
      reason:     parsed.reason ?? '',
    })
  } catch (e: any) {
    console.error('[analyze-size] error:', e)
    return NextResponse.json({ size: null }, { status: 500 })
  }
}
