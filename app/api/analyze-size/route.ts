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

    // Strip the data URL prefix and truncate if too large
    let base64 = photoDataUrl.replace(/^data:image\/\w+;base64,/, '')

    // If base64 is too large (over 1MB), reject it
    if (base64.length > 1_400_000) {
      console.log('[analyze-size] Image too large, returning default size')
      return NextResponse.json({ size: 'M', confidence: 'low', reason: 'Image too large for analysis' })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    let response: Response
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:      'claude-opus-4-5',
          max_tokens: 100,
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
                  text: `Fashion sizing expert. What size ${category ?? 'clothing'} should this person wear? Reply ONLY with JSON: {"size":"M","confidence":"high","reason":"brief reason"} Sizes: XS S M L XL XXL`,
                },
              ],
            },
          ],
        }),
      })
    } finally {
      clearTimeout(timeout)
    }

    const responseText = await response.text()
    console.log('[analyze-size] status:', response.status)
    console.log('[analyze-size] body:', responseText.slice(0, 400))

    if (!response.ok) {
      console.error('[analyze-size] API error:', responseText.slice(0, 300))
      return NextResponse.json({ size: 'M', confidence: 'low', reason: 'API error' })
    }

    const data = JSON.parse(responseText)
    const text = (data.content?.[0]?.text ?? '').replace(/```json|```/g, '').trim()
    console.log('[analyze-size] Claude text:', text)

    try {
      const parsed = JSON.parse(text)
      return NextResponse.json({
        size:       parsed.size       ?? 'M',
        confidence: parsed.confidence ?? 'low',
        reason:     parsed.reason     ?? '',
      })
    } catch {
      // Try to extract just the size letter from the response
      const match = text.match(/\b(XS|S|M|L|XL|XXL)\b/)
      return NextResponse.json({
        size:       match?.[1] ?? 'M',
        confidence: 'low',
        reason:     'Extracted from response',
      })
    }

  } catch (e: any) {
    console.error('[analyze-size] Unexpected error:', e?.message)
    return NextResponse.json({ size: 'M', confidence: 'low', reason: 'Analysis unavailable' })
  }
}
