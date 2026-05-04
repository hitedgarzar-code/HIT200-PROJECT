import { NextRequest, NextResponse } from 'next/server'

const CLAID_BASE = 'https://api.claid.ai/v1'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productImage, preferences } = body

    if (!productImage) {
      return NextResponse.json({ error: 'Product image is required' }, { status: 400 })
    }

    const apiKey = process.env.CLAID_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: true, fallback: true, image: productImage,
        message: 'Claid API key not configured.',
      })
    }

    // ── Step 1: Submit job ───────────────────────────────────────────────
    const submitRes = await fetch(`${CLAID_BASE}/image/ai-fashion-models`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        input: {
          clothing: [productImage],
        },
        output: {
          format:           'jpeg',
          number_of_images: 1,
        },
        options: {
          pose:         buildPose(preferences?.gender),
          background:   buildBackground(preferences?.style),
          aspect_ratio: '3:4',
        },
      }),
    })

    const submitText = await submitRes.text()
    if (!submitRes.ok) {
      return NextResponse.json({
        success: true, fallback: true, image: productImage,
        message: `Claid submit error ${submitRes.status}: ${submitText.slice(0, 300)}`,
      })
    }

    const submitData = JSON.parse(submitText)
    const taskId = submitData?.data?.id
    if (!taskId) {
      return NextResponse.json({
        success: true, fallback: true, image: productImage,
        message: `No task ID: ${JSON.stringify(submitData).slice(0, 200)}`,
      })
    }

    // ── Step 2: Poll every 2s, up to 25 attempts ────────────────────────
    for (let i = 0; i < 25; i++) {
      await sleep(2000)

      const pollRes = await fetch(`${CLAID_BASE}/image/ai-fashion-models/${taskId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })

      if (!pollRes.ok) continue

      const pollData = await pollRes.json()
      const d        = pollData?.data
      const status   = d?.status

      if (status === 'DONE') {
        // From the response we can see:
        // data.result.input_objects = [{...}]
        // data.result.output_objects = [{tmp_url, url, ...}]  <-- this is what we need
        const result = d?.result

        const url =
          // Primary: output_objects array
          result?.output_objects?.[0]?.tmp_url          ||
          result?.output_objects?.[0]?.url              ||
          // Some versions nest differently
          result?.output_objects?.[0]?.object?.tmp_url  ||
          result?.output_objects?.[0]?.object?.url      ||
          // Flat result array
          result?.[0]?.tmp_url                          ||
          result?.[0]?.url                              ||
          result?.[0]?.output_object?.tmp_url           ||
          result?.[0]?.output_object?.url               ||
          // Direct on data
          d?.tmp_url                                    ||
          d?.url                                        ||
          null

        if (url) {
          return NextResponse.json({
            success: true, fallback: false,
            image: url,
            message: 'Avatar generated successfully',
          })
        }

        // Log full result so we can pinpoint the URL field
        console.log('[Claid] Full result object:', JSON.stringify(result, null, 2))

        return NextResponse.json({
          success: true, fallback: true, image: productImage,
          message: `DONE. result keys: ${Object.keys(result || {}).join(', ')} | output_objects: ${JSON.stringify(result?.output_objects).slice(0, 300)}`,
        })
      }

      if (status === 'ERROR') {
        return NextResponse.json({
          success: true, fallback: true, image: productImage,
          message: `Generation error: ${JSON.stringify(d?.errors)}`,
        })
      }
    }

    return NextResponse.json({
      success: true, fallback: true, image: productImage,
      message: 'Timed out after 50s.',
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: `Unexpected error: ${error?.message}` },
      { status: 500 }
    )
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function buildPose(gender?: string): string {
  const base = 'full body, front view, neutral stance, arms relaxed'
  if (gender === 'female') return `female model, ${base}`
  if (gender === 'male')   return `male model, ${base}`
  return base
}

function buildBackground(style?: string): string {
  const map: Record<string, string> = {
    casual:  'bright minimalist studio with soft natural light',
    formal:  'elegant white studio backdrop with dramatic lighting',
    outdoor: 'sunny urban street with soft bokeh background',
    sporty:  'modern gym interior with clean white walls',
    luxury:  'high-end boutique interior with marble floors and warm lighting',
  }
  return map[style ?? ''] || 'clean white studio background, professional fashion photography'
}
