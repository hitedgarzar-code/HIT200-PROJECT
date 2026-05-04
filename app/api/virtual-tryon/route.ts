import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/virtual-tryon
 * ──────────────────────────────────────────────────────────────────────────
 * Genlook Virtual Try-On API  (api.genlook.app)
 *
 * Flow (4 steps per Genlook docs):
 *  1. Register product  → POST /tryon/v1/products        (externalId keyed by product URL)
 *  2. Upload user photo → POST /tryon/v1/images/upload   (multipart)  → imageId
 *  3. Create try-on     → POST /tryon/v1/try-on           → generationId
 *  4. Poll result       → GET  /tryon/v1/generations/:id  → resultImageUrl
 *
 * Auth header: x-api-key (NOT Bearer)
 * Requires GENLOOK_API_KEY in .env.local
 */

export const maxDuration = 90

const BASE = 'https://api.genlook.app/tryon/v1'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productImage, userPhoto, garmentName, preferences } = body

    if (!productImage) {
      return err('productImage is required', 400)
    }
    if (!userPhoto) {
      return err('userPhoto is required for real try-on', 400)
    }

    const apiKey = process.env.GENLOOK_API_KEY
    if (!apiKey) {
      return err('GENLOOK_API_KEY is missing from .env.local. Add it and restart the dev server.', 500)
    }

    const headers = { 'x-api-key': apiKey }

    // ── Step 1: Register product ─────────────────────────────────────────────
    // externalId must be stable per product. We derive one from the image URL.
    // Genlook ignores duplicate externalIds so this is safe to call each time.
    const externalId = slugify(productImage)

    const productRes = await fetch(`${BASE}/products`, {
      method:  'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        externalId,
        title:       garmentName ?? 'Product',
        description: preferences?.category ?? '',
        imageUrls:   [productImage],
      }),
    })

    if (!productRes.ok) {
      const txt = await productRes.text()
      console.error('[VirtualTryOn] Genlook product registration error:', productRes.status, txt.slice(0, 300))
      return err(`Failed to register product with Genlook (${productRes.status}). Make sure the product image is a publicly accessible URL.`, 502)
    }

    // ── Step 2: Upload customer photo ────────────────────────────────────────
    // The frontend sends a base64 data-URL. We convert it to a Blob for multipart upload.
    let imageId: string
    try {
      imageId = await uploadCustomerPhoto(userPhoto, apiKey)
    } catch (uploadErr: any) {
      return err(uploadErr.message || 'Failed to upload your photo to Genlook.', 502)
    }

    // ── Step 3: Create try-on ────────────────────────────────────────────────
    const tryonRes = await fetch(`${BASE}/try-on`, {
      method:  'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId:       externalId,
        customerImageId: imageId,
      }),
    })

    if (!tryonRes.ok) {
      const txt = await tryonRes.text()
      console.error('[VirtualTryOn] Genlook try-on creation error:', tryonRes.status, txt.slice(0, 300))

      if (tryonRes.status === 402) {
        return err('Your Genlook account has no credits. Add credits at app.genlook.app.', 402)
      }
      return err(`Genlook rejected the try-on request (${tryonRes.status}). Check that your photo shows a person clearly.`, 502)
    }

    const tryonData = await tryonRes.json()
    const generationId = tryonData?.generationId ?? tryonData?.id ?? null

    if (!generationId) {
      return err('Genlook did not return a generation ID.', 502)
    }

    // ── Step 4: Poll every 2s up to 30 attempts (~60s) ──────────────────────
    for (let i = 0; i < 30; i++) {
      await sleep(2000)

      const pollRes = await fetch(`${BASE}/generations/${generationId}`, {
        headers,
      })

      if (!pollRes.ok) continue

      const pollData = await pollRes.json()
      const status   = pollData?.status

      if (status === 'COMPLETED') {
        const url = pollData?.resultImageUrl ?? pollData?.result?.url ?? null
        if (url) {
          return NextResponse.json({
            success:  true,
            fallback: false,
            image:    url,
            message:  'Try-on generated successfully.',
          })
        }
        console.warn('[VirtualTryOn] COMPLETED but no URL. Keys:', Object.keys(pollData).join(', '))
        return err('Genlook completed but did not return an image URL.', 502)
      }

      if (status === 'FAILED' || status === 'ERROR') {
        console.error('[VirtualTryOn] Genlook generation failed:', pollData)
        return err('Genlook could not generate the try-on. Try a clearer full-body photo with the clothing visible.', 502)
      }

      // status is still PENDING / PROCESSING — keep polling
    }

    return err('Try-on timed out after 60 seconds. Please try again.', 504)

  } catch (e: any) {
    console.error('[VirtualTryOn] Unexpected error:', e)
    return err(e?.message || 'Try-on failed unexpectedly.', 500)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function err(error: string, status: number) {
  return NextResponse.json({ success: false, fallback: false, error }, { status })
}

/**
 * Converts a URL or base64 data-URL into a stable short slug
 * usable as a Genlook externalId (max ~200 chars).
 */
function slugify(input: string): string {
  if (input.startsWith('data:')) {
    // base64 product image — use a hash of the first 200 chars
    return 'b64-' + simpleHash(input.slice(0, 200))
  }
  // URL — strip protocol and special chars, truncate
  return input.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120)
}

function simpleHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

/**
 * Uploads a base64 data-URL (or raw URL string) as a multipart form to Genlook.
 * Returns the imageId from the response.
 */
async function uploadCustomerPhoto(photo: string, apiKey: string): Promise<string> {
  const form = new FormData()

  if (photo.startsWith('data:')) {
    // Convert base64 data-URL → Blob
    const match = photo.match(/^data:([^;,]+)(;base64)?,(.*)$/)
    if (!match) throw new Error('Invalid photo data-URL format.')

    const mime       = match[1]
    const isBase64   = Boolean(match[2])
    const payload    = match[3]
    const bytes      = isBase64
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8')
    const ext        = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'

    form.append('file', new Blob([bytes], { type: mime }), `customer-photo.${ext}`)
  } else {
    // It's a URL — fetch it first, then upload the bytes
    const imgRes = await fetch(photo)
    if (!imgRes.ok) throw new Error('Could not fetch the photo URL to upload.')
    const blob = await imgRes.blob()
    form.append('file', blob, 'customer-photo.jpg')
  }

  const uploadRes = await fetch(`https://api.genlook.app/tryon/v1/images/upload`, {
    method:  'POST',
    headers: { 'x-api-key': apiKey },
    body:    form,
  })

  const uploadText = await uploadRes.text()

  if (!uploadRes.ok) {
    console.error('[VirtualTryOn] Genlook image upload error:', uploadRes.status, uploadText.slice(0, 300))
    if (uploadRes.status === 413) throw new Error('Your photo is too large. Please use a photo under 10 MB.')
    if (uploadRes.status === 422) throw new Error('Genlook could not process your photo. Please use a clear JPG, PNG, or WebP.')
    throw new Error(`Failed to upload your photo (status ${uploadRes.status}).`)
  }

  let uploadData: any
  try { uploadData = JSON.parse(uploadText) } catch {
    throw new Error('Genlook returned an invalid response while uploading your photo.')
  }

  const imageId = uploadData?.imageId ?? uploadData?.id ?? null
  if (!imageId) {
    throw new Error('Genlook uploaded the photo but did not return an image ID.')
  }

  return imageId
}
