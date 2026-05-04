import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/virtual-tryon
 * ──────────────────────────────────────────────────────────────────────────
 * Accepts the user's uploaded photo + the product image URL, sends both to
 * Claid's ai-fashion-models endpoint, and returns the composited try-on image.
 *
 * Request body:
 *   productImage  string   URL or base64 of the clothing item
 *   userPhoto     string   base64 data-URL of the user's uploaded photo
 *   garmentName   string   Display name for fallback SVG composite
 *   preferences   object   { size, category } — passed through for metadata
 *
 * Response:
 *   { success, fallback, image, message }
 *
 * Requires CLAID_API_KEY for real AI try-on.
 */

export const maxDuration = 90

const CLAID_BASE = 'https://api.claid.ai/v1'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productImage, userPhoto, garmentName, preferences } = body

    if (!productImage) {
      return NextResponse.json({ error: 'productImage is required' }, { status: 400 })
    }

    if (!userPhoto) {
      return NextResponse.json({ error: 'userPhoto is required for real try-on' }, { status: 400 })
    }

    const apiKey = process.env.CLAID_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: 'Real virtual try-on requires CLAID_API_KEY in .env.local. Restart the dev server after adding it.',
      }, { status: 500 })
    }

    // ── Build Claid payload ────────────────────────────────────────────────
    // Claid's fashion endpoint needs URL/storage inputs. Browser uploads arrive
    // as data URLs, so upload them to Claid first and use the returned tmp_url
    // as the exact model image. This keeps the shopper photo and changes only
    // the clothing with the selected product image.
    const modelImage = await resolveClaidInputImage(userPhoto, apiKey, 'uploaded person photo')
    const clothingImage = await resolveClaidInputImage(productImage, apiKey, 'selected product image')

    const claidBody: Record<string, unknown> = {
      input: {
        model: modelImage,
        clothing: [clothingImage],
      },
      output: {
        format:           'jpeg',
        number_of_images: 1,
      },
      options: {
        aspect_ratio: '3:4',
        pose: 'preserve the uploaded person, body shape, face, pose and camera angle; replace only the visible clothing with the selected product',
        background: 'preserve the original uploaded photo background as much as possible',
      },
    }

    // ── Step 1: Submit job ─────────────────────────────────────────────────
    const submitRes = await fetch(`${CLAID_BASE}/image/ai-fashion-models`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(claidBody),
    })

    const submitText = await submitRes.text()
    if (!submitRes.ok) {
      console.error('[VirtualTryOn] Claid submit error:', submitRes.status, submitText.slice(0, 300))
      return errorResponse(`Claid rejected the real try-on request (${submitRes.status}). Check that the uploaded photo shows a person clearly and the product image is reachable.`, 502)
    }

    let submitData: any
    try { submitData = JSON.parse(submitText) } catch {
      return errorResponse('Claid returned an invalid response while starting the real try-on.', 502)
    }

    const taskId = submitData?.data?.id
    if (!taskId) {
      return errorResponse('Claid did not return a task ID for the real try-on.', 502)
    }

    // ── Step 2: Poll every 2s up to 25 attempts (50s total) ───────────────
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
        const result = d?.result

        // Walk all known URL paths in the Claid response schema
        const url =
          result?.output_objects?.[0]?.tmp_url        ||
          result?.output_objects?.[0]?.url             ||
          result?.output_objects?.[0]?.object?.tmp_url ||
          result?.output_objects?.[0]?.object?.url     ||
          result?.[0]?.tmp_url                         ||
          result?.[0]?.url                             ||
          result?.output?.tmp_url                       ||
          result?.output?.url                           ||
          result?.tmp_url                               ||
          result?.url                                   ||
          d?.tmp_url                                   ||
          d?.url                                       ||
          null

        if (url) {
          return NextResponse.json({
            success: true,
            fallback: false,
            image:   url,
            message: 'Try-on generated successfully.',
          })
        }

        console.warn('[VirtualTryOn] DONE but no URL. result keys:', Object.keys(result ?? {}).join(', '))
        return errorResponse('Claid finished the try-on but did not return an image URL.', 502)
      }

      if (status === 'ERROR') {
        console.error('[VirtualTryOn] Claid generation error:', d?.errors)
        return errorResponse('Claid could not generate the real try-on from this photo/product pair. Try a clearer full-body photo and a product image with the clothing visible.', 502)
      }
    }

    return errorResponse('Real try-on timed out. Please try again.', 504)

  } catch (err: any) {
    console.error('[VirtualTryOn] unexpected error:', err)
    const message = err?.message || 'Real try-on failed unexpectedly.'
    return errorResponse(message, 500)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function resolveClaidInputImage(image: string, apiKey: string, name: string): Promise<string> {
  if (typeof image !== 'string' || !image.trim()) {
    throw new Error(`${name} image is required`)
  }

  if (!image.startsWith('data:')) {
    return image
  }

  return uploadDataUrlToClaid(image, apiKey, name)
}

async function uploadDataUrlToClaid(dataUrl: string, apiKey: string, name: string): Promise<string> {
  const file = dataUrlToFile(dataUrl, `${name}-${Date.now()}`)
  const form = new FormData()

  form.append('file', file.blob, file.filename)
  form.append('data', JSON.stringify({
    operations: {
      resizing: {
        width: 1200,
        fit: 'bounds',
      },
      background: {
        remove: false,
      },
    },
    output: {
      format: 'jpeg',
    },
  }))

  const uploadRes = await fetch(`${CLAID_BASE}/image/edit/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  })

  const uploadText = await uploadRes.text()
  if (!uploadRes.ok) {
    console.error(`[VirtualTryOn] Claid ${name} upload error:`, uploadRes.status, uploadText.slice(0, 300))
    throw new Error(getClaidUploadError(name, uploadRes.status, uploadText))
  }

  let uploadData: any
  try {
    uploadData = JSON.parse(uploadText)
  } catch {
    throw new Error(`Invalid JSON from Claid ${name} upload`)
  }

  const url =
    uploadData?.data?.output?.tmp_url ||
    uploadData?.data?.output?.url ||
    uploadData?.data?.output?.object?.tmp_url ||
    uploadData?.data?.output?.object?.url ||
    uploadData?.data?.output?.claid_storage_uri ||
    uploadData?.data?.tmp_url ||
    uploadData?.data?.url ||
    uploadData?.data?.object?.tmp_url ||
    uploadData?.data?.object?.url ||
    null

  if (!url) {
    console.error(`[VirtualTryOn] Claid ${name} upload response without URL:`, uploadText.slice(0, 500))
    throw new Error(`Claid prepared the ${name}, but did not return an image URL.`)
  }

  return url
}

function getClaidUploadError(name: string, status: number, body: string): string {
  if (status === 401 || status === 403) {
    return `Could not prepare the ${name}. Your CLAID_API_KEY is present, but it is not allowed to use Claid image upload/editing. Enable Image Editing permission for the key, or create a new Claid API key with Image Editing and AI Fashion Models access.`
  }

  if (status === 402) {
    return 'Claid rejected the image upload because the account has no remaining credits.'
  }

  if (status === 413) {
    return `The ${name} is too large for Claid. Try a smaller photo.`
  }

  if (status === 422) {
    return `Claid could not process the ${name}. Use a clear JPG/PNG/WEBP image and make sure the photo is not corrupted.`
  }

  if (status === 429) {
    return 'Claid rate limit reached. Wait a moment and try again.'
  }

  return `Could not prepare the ${name} for real try-on. Claid upload failed with status ${status}.`
}

function dataUrlToFile(dataUrl: string, filenameBase: string): { blob: Blob; filename: string } {
  const match = dataUrl.match(/^data:([^;,]+)(;base64)?,(.*)$/)
  if (!match) {
    throw new Error('Invalid uploaded image data')
  }

  const mime = match[1]
  const isBase64 = Boolean(match[2])
  const payload = match[3]
  const bytes = isBase64
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8')
  const ext = mimeToExtension(mime)

  return {
    blob: new Blob([bytes], { type: mime }),
    filename: `${filenameBase}.${ext}`,
  }
}

function mimeToExtension(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/avif':
      return 'avif'
    case 'image/heic':
      return 'heic'
    case 'image/jpeg':
    case 'image/jpg':
    default:
      return 'jpg'
  }
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({
    success: false,
    fallback: false,
    error,
  }, { status })
}
