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
  text: `You are a clothing size measurement tool. Analyze the clothing this person is currently wearing and their visible body frame to determine what size they would need for a new ${category ?? 'T-Shirt'}.

Analyze objectively:
1. How much fabric is stretching or pulling on their current clothing
2. Whether their current clothing appears tight, fitted, or loose
3. The visible width of shoulders compared to an average frame
4. Overall body width from left to right in the frame

Rules:
- If clothing appears very tight or stretched: go 2 sizes up
- If clothing appears tight: go 1 size up  
- If clothing fits well: use that apparent size
- If clothing appears loose: go 1 size down
- A very large frame with stretched clothing = XXL or above

Be accurate and objective. Do NOT default to M.

Respond ONLY with this JSON, no other text:
{"size": "XXL", "confidence": "high", "reason": "Clothing appears significantly stretched indicating XXL frame"}

Size options: XS, S, M, L, XL, XXL
Confidence: low, medium, high`,
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
