'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sparkles, Camera, Upload, X, Loader2, Download,
  RefreshCw, CheckCircle, Info,
} from 'lucide-react'

interface Props {
  productName:      string
  productImage:     string
  productCategory?: string
}

type Step = 'upload' | 'result'

const STYLE_TIPS: Record<string, string[]> = {
  'T-Shirts':    ['Layer with an open button-up for smart-casual flair.', 'Tuck into high-waisted bottoms to define the waist.'],
  'Hoodies':     ['Style over a collared shirt for a preppy layered look.', 'Pair with slim trousers for a smart-casual finish.'],
  'Jackets':     ['Let the jacket be the star — keep the rest minimal.', 'Belt at the waist to create a defined silhouette.'],
  'Pants':       ['Tuck in a fitted top to elongate your legs.', 'Cuffed hems look best paired with ankle boots.'],
  'Dresses':     ['Add a belt to define the waist.', 'Layer with a denim jacket for a casual edge.'],
  'Accessories': ['Stack pieces for a maximalist look.', 'A statement bag elevates the simplest outfit.'],
  'Shoes':       ['White sneakers are a versatile everyday staple.', 'Match shoe colour to your bag for a polished finish.'],
  'Shorts':      ['Balance loose shorts with a fitted top.', 'Bermuda styles work well with loafers.'],
}

function normalizeClothingType(cat?: string): string {
  const value = (cat || '').toLowerCase()
  if (value.includes('shoe') || value.includes('sneaker') || value.includes('boot')) return 'Shoes'
  if (value.includes('pant') || value.includes('trouser') || value.includes('jean') || value.includes('skirt')) return 'Pants'
  if (value.includes('short')) return 'Shorts'
  if (value.includes('dress') || value.includes('gown')) return 'Dresses'
  if (value.includes('jacket') || value.includes('coat') || value.includes('blazer')) return 'Jackets'
  if (value.includes('hoodie') || value.includes('sweater')) return 'Hoodies'
  if (value.includes('accessor') || value.includes('bag') || value.includes('belt') || value.includes('scarf')) return 'Accessories'
  return 'T-Shirts'
}

function resizeImageToDataUrl(file: File, maxSide = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read image file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not load image file'))
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Could not process image file')); return }
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function VirtualTryOn({ productName, productImage, productCategory }: Props) {
  const [isOpen, setIsOpen]             = useState(false)
  const [step, setStep]                 = useState<Step>('upload')
  const [userPhoto, setUserPhoto]       = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [dragOver, setDragOver]         = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImage, setResultImage]   = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [activeInfoTab, setActiveInfoTab] = useState<'tips'>('tips')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)

  const clothingType = normalizeClothingType(productCategory)

  const startCamera = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      if (videoRef.current) { videoRef.current.srcObject = stream; setIsCameraActive(true) }
    } catch {
      setError('Cannot access camera. Please allow camera permissions or use file upload.')
    }
  }

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      ;(videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
      setIsCameraActive(false)
    }
  }, [])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')!
    canvasRef.current.width  = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)
    setUserPhoto(canvasRef.current.toDataURL('image/jpeg', 0.9))
    setResultImage(null)
    stopCamera()
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (JPG, PNG, or WEBP).'); return }
    if (file.size > 10 * 1024 * 1024)   { setError('File too large — maximum size is 10 MB.'); return }
    setError(null); setResultImage(null)
    try { setUserPhoto(await resizeImageToDataUrl(file)) }
    catch { setError('Could not read this image. Please try another JPG, PNG, or WEBP photo.') }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) void handleFile(f) }

  const generate = async () => {
    if (!userPhoto)    { setError('Please upload a photo first.'); return }
    if (!productImage) { setError('This product does not have an image for virtual try-on.'); return }
    setIsGenerating(true); setError(null); setResultImage(null)
    try {
      const res = await fetch('/api/virtual-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImage,
          userPhoto,
          garmentName: productName,
          preferences: { category: clothingType },
        }),
      })
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('application/json')) throw new Error('Try-on service returned an invalid response')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      if (!data.image) throw new Error(data.message || 'No image returned by try-on service')
      if (data.fallback) throw new Error('The service returned a preview. Check your API key and try again.')
      setResultImage(data.image)
      setStep('result')
    } catch (e: any) {
      setError(e?.message || 'Try-on failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const reset = () => {
    setStep('upload'); setUserPhoto(null); setResultImage(null); setError(null); stopCamera()
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all text-primary font-medium text-sm"
      >
        <Sparkles className="w-4 h-4" />
        Virtual Try-On: {productName}
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold text-primary text-sm">Virtual Try-On</span>
        </div>
        <button onClick={() => { setIsOpen(false); reset() }} className="text-neutral-400 hover:text-neutral-700">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* STEP: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            {!userPhoto && !isCameraActive && (
              <>
                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-primary/40'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-700 mb-1">Upload your photo</p>
                  <p className="text-xs text-neutral-500">Drag & drop or click • JPG, PNG, WebP • Max 10 MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-neutral-200" />
                  <span className="text-xs text-neutral-400">or</span>
                  <div className="flex-1 h-px bg-neutral-200" />
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={startCamera}>
                  <Camera className="w-4 h-4" />
                  Take a photo
                </Button>
              </>
            )}

            {isCameraActive && (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black aspect-video object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={capturePhoto}><Camera className="w-4 h-4 mr-2" />Capture</Button>
                  <Button variant="outline" onClick={stopCamera}><X className="w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {userPhoto && (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-neutral-100">
                  <img src={userPhoto} alt="Your photo" className="w-full h-full object-cover" />
                  <button onClick={() => { setUserPhoto(null); setResultImage(null) }} className="absolute top-2 right-2 bg-white/80 rounded-full p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={generate}
                  disabled={isGenerating}
                >
                  {isGenerating
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
                    : <><Sparkles className="w-4 h-4" />Generate Try-On</>}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* STEP: Result */}
        {step === 'result' && resultImage && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-neutral-100">
              <img src={resultImage} alt="Try-on result" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Try-on complete
              </div>
            </div>

            {/* Style tips */}
            <div className="bg-neutral-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-neutral-700 mb-3">Style Tips</p>
              <ul className="text-xs text-neutral-600 space-y-2">
                {(STYLE_TIPS[clothingType] ?? STYLE_TIPS['T-Shirts']).map(tip => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={reset}>
                <RefreshCw className="w-4 h-4" />Try Again
              </Button>
              <a href={resultImage} download="try-on-result.jpg" className="flex-1">
                <Button className="w-full gap-2">
                  <Download className="w-4 h-4" />Download
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
