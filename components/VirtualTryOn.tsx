'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sparkles, Camera, Upload, X, Loader2, Download,
  RefreshCw, CheckCircle, Info, ChevronDown, ChevronUp,
} from 'lucide-react'

export interface SizeRow {
  label: string
  eu:    string
  uk:    string
  us:    string
  chest?:  string
  waist?:  string
  hips?:   string
  inseam?: string
  foot?:   string
}

export type SizeRegion = 'EU' | 'UK' | 'US'

interface Props {
  productName:      string
  productImage:     string
  productCategory?: string
}

type Step = 'upload' | 'size' | 'result'

const TOPS: SizeRow[] = [
  { label:'XS',  eu:'EU 32–34', uk:'UK 6–8',   us:'US 2–4',   chest:'80–85 cm',  waist:'60–65 cm', hips:'85–90 cm'  },
  { label:'S',   eu:'EU 36–38', uk:'UK 8–10',  us:'US 4–6',   chest:'86–91 cm',  waist:'66–71 cm', hips:'91–96 cm'  },
  { label:'M',   eu:'EU 38–40', uk:'UK 12–14', us:'US 8–10',  chest:'92–97 cm',  waist:'72–77 cm', hips:'97–102 cm' },
  { label:'L',   eu:'EU 42–44', uk:'UK 16–18', us:'US 12–14', chest:'98–104 cm', waist:'78–84 cm', hips:'103–109 cm'},
  { label:'XL',  eu:'EU 46–48', uk:'UK 20–22', us:'US 16–18', chest:'105–110 cm',waist:'85–90 cm', hips:'110–115 cm'},
  { label:'XXL', eu:'EU 50–52', uk:'UK 24–26', us:'US 20–22', chest:'111–117 cm',waist:'91–97 cm', hips:'116–122 cm'},
]

const BOTTOMS: SizeRow[] = [
  { label:'XS',  eu:'EU 32', uk:'UK 6',  us:'US 2',   waist:'60–63 cm', hips:'85–88 cm',  inseam:'76 cm' },
  { label:'S',   eu:'EU 34', uk:'UK 8',  us:'US 4',   waist:'64–67 cm', hips:'89–92 cm',  inseam:'78 cm' },
  { label:'M',   eu:'EU 36', uk:'UK 10', us:'US 6–8', waist:'68–72 cm', hips:'93–96 cm',  inseam:'80 cm' },
  { label:'L',   eu:'EU 38', uk:'UK 12', us:'US 10',  waist:'73–77 cm', hips:'97–100 cm', inseam:'81 cm' },
  { label:'XL',  eu:'EU 40', uk:'UK 14', us:'US 12',  waist:'78–83 cm', hips:'101–106 cm',inseam:'82 cm' },
  { label:'XXL', eu:'EU 42', uk:'UK 16', us:'US 14',  waist:'84–90 cm', hips:'107–112 cm',inseam:'83 cm' },
]

const SHOES: SizeRow[] = [
  { label:'35', eu:'EU 35', uk:'UK 2.5', us:'US W 5 / M 4',   foot:'22 cm'   },
  { label:'36', eu:'EU 36', uk:'UK 3.5', us:'US W 6 / M 5',   foot:'22.5 cm' },
  { label:'37', eu:'EU 37', uk:'UK 4.5', us:'US W 7 / M 6',   foot:'23.5 cm' },
  { label:'38', eu:'EU 38', uk:'UK 5.5', us:'US W 8 / M 7',   foot:'24 cm'   },
  { label:'39', eu:'EU 39', uk:'UK 6.5', us:'US W 9 / M 8',   foot:'24.5 cm' },
  { label:'40', eu:'EU 40', uk:'UK 7.5', us:'US W 10 / M 9',  foot:'25 cm'   },
  { label:'41', eu:'EU 41', uk:'UK 8.5', us:'US W 11 / M 10', foot:'26 cm'   },
  { label:'42', eu:'EU 42', uk:'UK 9.5', us:'US W 12 / M 11', foot:'27 cm'   },
]

const CLOTHING_TYPES = [
  { id:'T-Shirts',    label:'T-Shirt',   emoji:'👕', chart: TOPS    },
  { id:'Hoodies',     label:'Hoodie',    emoji:'🧥', chart: TOPS    },
  { id:'Jackets',     label:'Jacket',    emoji:'🥼', chart: TOPS    },
  { id:'Dresses',     label:'Dress',     emoji:'👗', chart: TOPS    },
  { id:'Pants',       label:'Pants',     emoji:'👖', chart: BOTTOMS },
  { id:'Shorts',      label:'Shorts',    emoji:'🩳', chart: BOTTOMS },
  { id:'Accessories', label:'Accessory', emoji:'👜', chart: TOPS    },
  { id:'Shoes',       label:'Shoes',     emoji:'👟', chart: SHOES   },
]

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

const REGION_CONFIG: Record<SizeRegion, { flag: string; label: string; key: keyof SizeRow }> = {
  EU: { flag: '🇪🇺', label: 'EU', key: 'eu' },
  UK: { flag: '🇬🇧', label: 'UK', key: 'uk' },
  US: { flag: '🇺🇸', label: 'US', key: 'us' },
}

const LS_KEY = 'tryon_size_region'

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

function getChartForCategory(cat?: string): SizeRow[] {
  const found = CLOTHING_TYPES.find(c => c.id === normalizeClothingType(cat))
  return found?.chart ?? TOPS
}

function getClothingLabel(cat?: string): string {
  const found = CLOTHING_TYPES.find(c => c.id === normalizeClothingType(cat))
  return found?.label ?? 'Item'
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
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep]     = useState<Step>('upload')
  const [activeInfoTab, setActiveInfoTab] = useState<'sizes' | 'tips'>('sizes')
  const [showSizeChart, setShowSizeChart] = useState(false)

  const [userPhoto, setUserPhoto]           = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [dragOver, setDragOver]             = useState(false)

  const [region, setRegion]           = useState<SizeRegion>('EU')
  const [selectedSize, setSelectedSize] = useState<string>('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImage, setResultImage]   = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)

  const clothingType  = normalizeClothingType(productCategory)
  const clothingLabel = getClothingLabel(productCategory)
  const sizeChart     = getChartForCategory(productCategory)
  const selectedRow   = sizeChart.find(r => r.label === selectedSize)
  const regionCfg     = REGION_CONFIG[region]

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY) as SizeRegion | null
      if (saved === 'EU' || saved === 'UK' || saved === 'US') setRegion(saved)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const chart = getChartForCategory(productCategory)
    if (!chart.find(r => r.label === selectedSize)) {
      setSelectedSize(chart[2]?.label ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCategory])

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
  const handleDrop        = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) void handleFile(f) }

  const changeRegion = (r: SizeRegion) => {
    setRegion(r)
    try { localStorage.setItem(LS_KEY, r) } catch { /* ignore */ }
  }

  const generate = async () => {
    if (!userPhoto)    { setError('Please upload a photo first.'); return }
    if (!selectedSize) { setError('Please select a size before generating.'); return }
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
          preferences: { size: selectedSize, category: clothingType },
        }),
      })

      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('application/json')) throw new Error('Try-on service returned an invalid response')

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      if (!data.image) throw new Error(data.message || 'No image returned by try-on service')
      if (data.fallback) throw new Error('The service returned a preview instead of a real try-on. Check your API key and try again.')

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
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {(['upload', 'size', 'result'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                {i + 1}
              </div>
              <span className={step === s ? 'text-primary font-medium' : ''}>{s === 'upload' ? 'Photo' : s === 'size' ? 'Size' : 'Result'}</span>
              {i < 2 && <div className="w-4 h-px bg-neutral-200" />}
            </div>
          ))}
        </div>

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
                <Button className="w-full" onClick={() => setStep('size')}>Continue to Size Selection →</Button>
              </div>
            )}
          </div>
        )}

        {/* STEP: Size */}
        {step === 'size' && (
          <div className="space-y-4">
            {/* Region selector */}
            <div className="flex gap-2">
              {(Object.entries(REGION_CONFIG) as [SizeRegion, typeof REGION_CONFIG[SizeRegion]][]).map(([r, cfg]) => (
                <button
                  key={r}
                  onClick={() => changeRegion(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${region === r ? 'bg-primary text-white border-primary' : 'border-neutral-200 text-neutral-600 hover:border-primary/40'}`}
                >
                  {cfg.flag} {cfg.label}
                </button>
              ))}
            </div>

            {/* Size grid */}
            <div className="grid grid-cols-3 gap-2">
              {sizeChart.map(row => (
                <button
                  key={row.label}
                  onClick={() => setSelectedSize(row.label)}
                  className={`py-3 rounded-lg text-sm font-medium border transition-all ${selectedSize === row.label ? 'bg-primary text-white border-primary' : 'border-neutral-200 text-neutral-700 hover:border-primary/40'}`}
                >
                  <div className="font-bold">{row.label}</div>
                  <div className="text-xs opacity-70">{row[regionCfg.key]}</div>
                </button>
              ))}
            </div>

            {/* Measurements */}
            {selectedRow && (
              <div className="bg-neutral-50 rounded-xl p-4 text-xs space-y-1">
                {selectedRow.chest  && <div className="flex justify-between"><span className="text-neutral-500">Chest</span><span className="font-medium">{selectedRow.chest}</span></div>}
                {selectedRow.waist  && <div className="flex justify-between"><span className="text-neutral-500">Waist</span><span className="font-medium">{selectedRow.waist}</span></div>}
                {selectedRow.hips   && <div className="flex justify-between"><span className="text-neutral-500">Hips</span><span className="font-medium">{selectedRow.hips}</span></div>}
                {selectedRow.inseam && <div className="flex justify-between"><span className="text-neutral-500">Inseam</span><span className="font-medium">{selectedRow.inseam}</span></div>}
                {selectedRow.foot   && <div className="flex justify-between"><span className="text-neutral-500">Foot length</span><span className="font-medium">{selectedRow.foot}</span></div>}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>← Back</Button>
              <Button
                className="flex-1 gap-2"
                onClick={generate}
                disabled={isGenerating || !selectedSize}
              >
                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4" />Generate Try-On</>}
              </Button>
            </div>
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
              <div className="flex gap-4 mb-3 border-b border-neutral-200 pb-2">
                <button onClick={() => setActiveInfoTab('sizes')} className={`text-xs font-semibold pb-1 ${activeInfoTab === 'sizes' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500'}`}>Size Info</button>
                <button onClick={() => setActiveInfoTab('tips')}  className={`text-xs font-semibold pb-1 ${activeInfoTab === 'tips'  ? 'text-primary border-b-2 border-primary' : 'text-neutral-500'}`}>Style Tips</button>
              </div>
              {activeInfoTab === 'sizes' && selectedRow && (
                <div className="text-xs space-y-1">
                  <p className="font-medium text-neutral-700 mb-2">Your selected size: {selectedSize} ({selectedRow[regionCfg.key]})</p>
                  {selectedRow.chest  && <div className="flex justify-between"><span className="text-neutral-500">Chest</span><span>{selectedRow.chest}</span></div>}
                  {selectedRow.waist  && <div className="flex justify-between"><span className="text-neutral-500">Waist</span><span>{selectedRow.waist}</span></div>}
                  {selectedRow.hips   && <div className="flex justify-between"><span className="text-neutral-500">Hips</span><span>{selectedRow.hips}</span></div>}
                </div>
              )}
              {activeInfoTab === 'tips' && (
                <ul className="text-xs text-neutral-600 space-y-2">
                  {(STYLE_TIPS[clothingType] ?? STYLE_TIPS['T-Shirts']).map(tip => (
                    <li key={tip} className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{tip}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={reset}><RefreshCw className="w-4 h-4" />Try Again</Button>
              <a href={resultImage} download="try-on-result.jpg" className="flex-1">
                <Button className="w-full gap-2"><Download className="w-4 h-4" />Download</Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
