'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sparkles, User, Loader2, Download, X, CheckCircle2,
  Palette, Ruler, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────────────────

export interface AvatarPreferences {
  name:      string
  gender:    'female' | 'male'
  skinTone:  string
  hairColor: string
  bodyType:  string
  style:     string
  size:      string
  colors:    string[]
}

interface AvatarGeneratorProps {
  productName:  string
  productImage: string
  productId:    string
  selectedSize: string
  onAvatarSaved?: (avatarData: { image: string; preferences: AvatarPreferences }) => void
}

// ── Option lists ───────────────────────────────────────────────────────────

const GENDERS    = ['female', 'male'] as const
const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Brown', 'Deep']
const HAIR_COLORS = ['Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Grey', 'White']
const BODY_TYPES = ['Petite', 'Slim', 'Athletic', 'Average', 'Curvy', 'Plus']
const STYLES     = ['casual', 'formal', 'outdoor', 'sporty', 'luxury'] as const
const SIZES      = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const COLOR_OPTIONS = [
  'Black', 'White', 'Navy', 'Grey', 'Beige', 'Red',
  'Blue', 'Green', 'Pink', 'Purple', 'Brown', 'Cream',
]

const STYLE_LABELS: Record<string, string> = {
  casual:  '☀️ Casual',
  formal:  '👔 Formal',
  outdoor: '🌿 Outdoor',
  sporty:  '⚡ Sporty',
  luxury:  '✨ Luxury',
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AvatarGenerator({
  productName, productImage, productId, selectedSize, onAvatarSaved,
}: AvatarGeneratorProps) {
  const [isOpen, setIsOpen]               = useState(false)
  const [isGenerating, setIsGenerating]   = useState(false)
  const [isSaving, setIsSaving]           = useState(false)
  const [avatarImage, setAvatarImage]     = useState<string | null>(null)
  const [isFallback, setIsFallback]       = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [step, setStep]                   = useState<'form' | 'result'>('form')

  const [prefs, setPrefs] = useState<AvatarPreferences>({
    name:      '',
    gender:    'female',
    skinTone:  'Medium',
    hairColor: 'Brown',
    bodyType:  'Average',
    style:     'casual',
    size:      selectedSize || 'M',
    colors:    [],
  })

  const update = (key: keyof AvatarPreferences, val: any) =>
    setPrefs(p => ({ ...p, [key]: val }))

  const toggleColor = (color: string) =>
    setPrefs(p => ({
      ...p,
      colors: p.colors.includes(color)
        ? p.colors.filter(c => c !== color)
        : [...p.colors, color].slice(0, 3),
    }))

  // ── Generate ──────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setAvatarImage(null)
    setSaved(false)

    try {
      const res = await fetch('/api/claid-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImage,
          preferences: {
            gender:    prefs.gender,
            skinTone:  prefs.skinTone,
            hairColor: prefs.hairColor,
            bodyType:  prefs.bodyType,
            style:     prefs.style,
            size:      prefs.size,
            colors:    prefs.colors.join(', '),
          },
        }),
      })

      // Guard against HTML error pages (404/500) being returned instead of JSON
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        // API route is missing or server errored — fall back to product image
        setAvatarImage(productImage)
        setIsFallback(true)
        setStep('result')
        toast.info('Avatar API not configured yet — showing product image preview.')
        return
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setAvatarImage(data.image)
      setIsFallback(!!data.fallback)
      setStep('result')

      if (data.fallback) {
        toast.info(data.message || 'Showing product image preview.')
      } else {
        toast.success('Avatar generated! 🎉')
      }
    } catch (err: any) {
      // Network error or completely unreachable — fall back gracefully
      setAvatarImage(productImage)
      setIsFallback(true)
      setStep('result')
      toast.info('Could not reach avatar API — showing product image preview.')
    } finally {
      setIsGenerating(false)
    }
  }, [productImage, prefs])

  // ── Save ──────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!avatarImage) return
    setIsSaving(true)

    try {
      const res = await fetch('/api/claid-avatar/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarImage,
          preferences: prefs,
          productId,
        }),
      })

      // Guard against HTML error pages
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        // Save API missing — still persist locally
        const stored = JSON.parse(localStorage.getItem('saved_avatars') || '{}')
        stored[productId] = { image: avatarImage, preferences: prefs, savedAt: Date.now() }
        localStorage.setItem('saved_avatars', JSON.stringify(stored))
        setSaved(true)
        toast.success('Avatar saved locally!')
        onAvatarSaved?.({ image: avatarImage, preferences: prefs })
        return
      }

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      // Also persist to localStorage for cart integration
      const stored = JSON.parse(localStorage.getItem('saved_avatars') || '{}')
      stored[productId] = { image: avatarImage, preferences: prefs, savedAt: Date.now() }
      localStorage.setItem('saved_avatars', JSON.stringify(stored))

      setSaved(true)
      toast.success(data.message || 'Avatar saved!')
      onAvatarSaved?.({ image: avatarImage, preferences: prefs })
    } catch (err: any) {
      toast.error(err.message || 'Failed to save avatar')
    } finally {
      setIsSaving(false)
    }
  }, [avatarImage, prefs, productId, onAvatarSaved])

  // ── Download ──────────────────────────────────────────────────────────

  const handleDownload = () => {
    if (!avatarImage) return
    const a = document.createElement('a')
    a.href = avatarImage
    a.download = `avatar-${productName.replace(/\s+/g, '-').toLowerCase()}.jpg`
    a.click()
  }

  const reset = () => {
    setStep('form')
    setAvatarImage(null)
    setSaved(false)
    setIsFallback(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="border-2 border-dashed border-accent/40 rounded-2xl overflow-hidden bg-gradient-to-br from-accent/5 to-primary/5">

      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-primary text-sm">AI Avatar Generator</p>
            <p className="text-xs text-muted-foreground">
              {saved ? '✓ Avatar saved to your order' : 'See how this looks on you'}
            </p>
          </div>
        </div>
        {isOpen
          ? <ChevronUp className="w-5 h-5 text-primary" />
          : <ChevronDown className="w-5 h-5 text-primary" />}
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="border-t border-accent/20 p-5">
          {step === 'form' ? (
            <FormStep
              prefs={prefs}
              update={update}
              toggleColor={toggleColor}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
            />
          ) : (
            <ResultStep
              avatarImage={avatarImage!}
              isFallback={isFallback}
              prefs={prefs}
              productName={productName}
              saved={saved}
              isSaving={isSaving}
              onSave={handleSave}
              onDownload={handleDownload}
              onReset={reset}
              onRegenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Form Step ──────────────────────────────────────────────────────────────

function FormStep({
  prefs, update, toggleColor, isGenerating, onGenerate,
}: {
  prefs: AvatarPreferences
  update: (k: keyof AvatarPreferences, v: any) => void
  toggleColor: (c: string) => void
  isGenerating: boolean
  onGenerate: () => void
}) {
  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          <User className="w-3.5 h-3.5 inline mr-1" />Your Name (optional)
        </label>
        <input
          type="text"
          value={prefs.name}
          onChange={e => update('name', e.target.value)}
          placeholder="e.g. Alex"
          className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none text-sm bg-white transition-colors"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          Gender
        </label>
        <div className="flex gap-2">
          {GENDERS.map(g => (
            <button key={g}
              onClick={() => update('gender', g)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize border-2 transition-all ${
                prefs.gender === g
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'border-neutral-200 text-neutral-600 hover:border-primary/50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Skin Tone & Hair */}
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Skin Tone"
          icon={<Palette className="w-3.5 h-3.5 inline mr-1" />}
          value={prefs.skinTone}
          options={SKIN_TONES}
          onChange={v => update('skinTone', v)}
        />
        <SelectField
          label="Hair Color"
          value={prefs.hairColor}
          options={HAIR_COLORS}
          onChange={v => update('hairColor', v)}
        />
      </div>

      {/* Body Type & Size */}
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Body Type"
          icon={<Ruler className="w-3.5 h-3.5 inline mr-1" />}
          value={prefs.bodyType}
          options={BODY_TYPES}
          onChange={v => update('bodyType', v)}
        />
        <SelectField
          label="Size"
          value={prefs.size}
          options={SIZES}
          onChange={v => update('size', v)}
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          Style Setting
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STYLE_LABELS) as (typeof STYLES)[number][]).map(s => (
            <button key={s}
              onClick={() => update('style', s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                prefs.style === s
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'border-neutral-200 text-neutral-600 hover:border-primary/50'
              }`}
            >
              {STYLE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Colors */}
      <div>
        <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          Preferred Colors <span className="text-muted-foreground font-normal">(pick up to 3)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(c => (
            <button key={c}
              onClick={() => toggleColor(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                prefs.colors.includes(c)
                  ? 'bg-accent text-primary border-accent shadow-md scale-105'
                  : 'border-neutral-200 text-neutral-600 hover:border-accent/50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Generate CTA */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full py-6 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all"
      >
        {isGenerating ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating Avatar…</>
        ) : (
          <><Sparkles className="w-5 h-5 mr-2" />Generate My Avatar</>
        )}
      </Button>
    </div>
  )
}

// ── Result Step ────────────────────────────────────────────────────────────

function ResultStep({
  avatarImage, isFallback, prefs, productName,
  saved, isSaving, onSave, onDownload, onReset, onRegenerate, isGenerating,
}: {
  avatarImage: string
  isFallback: boolean
  prefs: AvatarPreferences
  productName: string
  saved: boolean
  isSaving: boolean
  onSave: () => void
  onDownload: () => void
  onReset: () => void
  onRegenerate: () => void
  isGenerating: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Avatar preview */}
      <div className="relative rounded-2xl overflow-hidden bg-neutral-100 aspect-[3/4] max-h-80 shadow-lg">
        <img
          src={avatarImage}
          alt={`Avatar wearing ${productName}`}
          className="w-full h-full object-cover"
        />
        {isFallback && (
          <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-xs text-center py-1.5 px-3 backdrop-blur-sm">
            Preview mode · Add CLAID_API_KEY to enable full avatar generation
          </div>
        )}
        {!isFallback && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-primary shadow">
            ✨ AI Generated
          </div>
        )}
      </div>

      {/* Preference summary */}
      <div className="bg-white rounded-xl p-4 border border-neutral-100 shadow-sm">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Your Avatar</p>
        <div className="flex flex-wrap gap-2">
          {[prefs.gender, prefs.bodyType, prefs.skinTone, prefs.size, prefs.style].map(tag => (
            <span key={tag} className="px-2 py-1 bg-accent/10 text-primary text-xs rounded-full font-medium capitalize">
              {tag}
            </span>
          ))}
          {prefs.colors.map(c => (
            <span key={c} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onSave}
          disabled={isSaving || saved}
          className={`py-3 rounded-xl font-semibold transition-all ${
            saved
              ? 'bg-green-500 text-white cursor-default'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving…</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4 mr-1" />Saved!</>
          ) : (
            'Save to Order'
          )}
        </Button>
        <Button
          onClick={onDownload}
          variant="outline"
          className="py-3 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold transition-all"
        >
          <Download className="w-4 h-4 mr-1" />Download
        </Button>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onRegenerate}
          disabled={isGenerating}
          variant="outline"
          className="flex-1 py-2.5 rounded-xl border-2 border-accent text-accent hover:bg-accent/10 font-semibold text-sm transition-all"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Regenerating…</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-1" />Regenerate</>
          )}
        </Button>
        <Button
          onClick={onReset}
          variant="ghost"
          className="flex-1 py-2.5 rounded-xl text-muted-foreground hover:text-primary text-sm font-semibold"
        >
          <X className="w-4 h-4 mr-1" />Change Preferences
        </Button>
      </div>
    </div>
  )
}

// ── Reusable select ────────────────────────────────────────────────────────

function SelectField({
  label, icon, value, options, onChange,
}: {
  label: string
  icon?: React.ReactNode
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">
        {icon}{label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none text-sm bg-white transition-colors"
      >
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
