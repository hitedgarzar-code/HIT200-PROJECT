import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { photoDataUrl, category } = await request.json()

    if (!photoDataUrl) {
      return NextResponse.json({ size: null, error: 'No photo provided' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ size: null, error: 'API key not configured' }, { status: 500 })
    }

    const base64 = photoDataUrl.replace(/^data:image\/\w+;base64,/, '')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-5',
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
                text: `You are a fashion sizing expert. Look at this person and suggest the best clothing size for a ${category ?? 'T-Shirt'} garment. Respond ONLY with a JSON object, no other text:
{"size": "M", "confidence": "high", "reason": "Athletic build with broad shoulders"}
Size options: XS, S, M, L, XL, XXL
Confidence options: low, medium, high`,
              },
            ],
          },
        ],
      }),
    })

    const responseText = await response.text()
    console.log('[analyze-size] status:', response.status)
    console.log('[analyze-size] body:', responseText.slice(0, 800))

    if (!response.ok) {
      return NextResponse.json({ size: null, error: `Anthropic error ${response.status}: ${responseText.slice(0, 200)}` }, { status: 500 })
    }

    const data = JSON.parse(responseText)
    const text = data.content?.[0]?.text ?? ''
    console.log('[analyze-size] Claude text:', text)

    const clean = text.replace(/```json|```/g, '').trim()

    let parsed: any = {}
    try {
      parsed = JSON.parse(clean)
    } catch {
      console.error('[analyze-size] JSON parse failed:', clean)
      return NextResponse.json({ size: 'M', confidence: 'low', reason: 'Default' })
    }

    return NextResponse.json({
      size:       parsed.size       ?? 'M',
      confidence: parsed.confidence ?? 'low',
      reason:     parsed.reason     ?? '',
    })

  } catch (e: any) {
    console.error('[analyze-size] Unexpected error:', e)
    return NextResponse.json({ size: null, error: e?.message }, { status: 500 })
  }
}
