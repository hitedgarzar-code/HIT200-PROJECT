'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2, CheckCircle2, Smartphone, Shield,
  Clock, PlayCircle
} from 'lucide-react'

const MOBILE_METHODS = {
  ecocash:  { name: 'EcoCash',  prefix: '077 / 078', color: '#00A651', placeholder: '077XXXXXXX' },
  onemoney: { name: 'OneMoney', prefix: '071',        color: '#E31937', placeholder: '071XXXXXXX' },
  innbucks: { name: 'InnBucks', prefix: 'App',        color: '#FF6600', placeholder: '077XXXXXXX' },
  telecash: { name: 'Telecash', prefix: '073',        color: '#0066B3', placeholder: '073XXXXXXX' },
} as const

type Method = keyof typeof MOBILE_METHODS

interface PayNowPaymentProps {
  orderId:    string
  amount:     number
  userEmail?: string
  userPhone?: string
  onSuccess:  (reference: string) => void
  onError:    (error: string) => void
}

export function PayNowPayment({
  orderId,
  amount,
  userEmail = '',
  userPhone = '',
  onSuccess,
  onError,
}: PayNowPaymentProps) {
  const [phone, setPhone]         = useState(userPhone)
  const [email, setEmail]         = useState(userEmail)
  const [method, setMethod]       = useState<Method>('ecocash')
  const [loading, setLoading]     = useState(false)
  const [polling, setPolling]     = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [reference, setReference] = useState('')
  const [pollUrl, setPollUrl]     = useState('')
  const [instructions, setInst]   = useState('')
  const [isDemo, setIsDemo]       = useState(false)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res  = await fetch('/api/payments/paynow/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId, amount, phone, email, method }),
      })
      const data = await res.json()

      if (!data.success) {
        onError(data.message || 'Payment initiation failed')
        return
      }

      setReference(data.reference)
      setPollUrl(data.pollUrl)
      setInst(data.instructions || '')
      setIsDemo(data.demo === true)
      setPolling(true)

      // Only auto-poll in live mode
      if (!data.demo) {
        startPolling(data.reference, data.pollUrl)
      }
    } catch (err: any) {
      onError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startPolling = (ref: string, url: string) => {
    let attempts = 0
    const tick = async () => {
      try {
        const res  = await fetch(url)
        const data = await res.json()
        if (data.paid || data.status === 'completed') {
          setPolling(false)
          onSuccess(ref)
        } else if (data.status === 'cancelled' || data.status === 'failed') {
          setPolling(false)
          onError('Payment was cancelled or failed.')
        } else if (attempts < 72) {
          attempts++
          setTimeout(tick, 5000)
        } else {
          setPolling(false)
          onError('Payment timed out. Please try again.')
        }
      } catch {
        if (attempts < 72) { attempts++; setTimeout(tick, 5000) }
        else { setPolling(false); onError('Could not verify payment.') }
      }
    }
    tick()
  }

  // ── Demo: simulate success ─────────────────────────────────
  const handleSimulate = async () => {
    setSimulating(true)
    try {
      const res  = await fetch('/api/payments/paynow/poll', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reference, orderId }),
      })
      const data = await res.json()
      if (data.success) {
        setPolling(false)
        onSuccess(reference)
      } else {
        onError('Simulation failed. Please try again.')
      }
    } catch {
      onError('Network error during simulation.')
    } finally {
      setSimulating(false)
    }
  }

  // ── Awaiting payment screen ───────────────────────────────
  if (polling) return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl p-6 text-center">
        <p className="text-white/70 text-sm mb-1">Amount</p>
        <p className="text-4xl font-bold">${amount.toFixed(2)}</p>
        <p className="text-white/60 text-sm mt-1">via {MOBILE_METHODS[method].name}</p>
      </div>

      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <Clock className="absolute inset-0 m-auto w-7 h-7 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-primary">Awaiting Payment</p>
          <p className="text-xs text-muted-foreground font-mono mt-1">Ref: {reference}</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        <p className="font-semibold mb-1 flex items-center gap-2">
          <Smartphone className="w-4 h-4" /> Check your phone
        </p>
        <p>{instructions}</p>
      </div>

      {isDemo && (
        <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 bg-primary/5">
          <p className="text-xs text-primary font-semibold mb-3 text-center">
            DEMO MODE — No real payment is charged
          </p>
          <Button
            onClick={handleSimulate}
            disabled={simulating}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl gap-2"
          >
            {simulating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              : <><PlayCircle className="w-5 h-5" /> Simulate Payment Success</>
            }
          </Button>
        </div>
      )}
    </div>
  )

  // ── Payment form ─────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Amount */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl p-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/70 text-sm">Amount to Pay</p>
            <p className="text-3xl font-bold">${amount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm">Order</p>
            <p className="font-mono text-sm">#{orderId.slice(0, 8)}</p>
          </div>
        </div>
      </div>

      {/* Method selector */}
      <div>
        <p className="text-sm font-semibold mb-3">Select Mobile Wallet</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(MOBILE_METHODS) as [Method, typeof MOBILE_METHODS[Method]][]).map(([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMethod(key)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                method === key
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-neutral-200 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${info.color}18` }}>
                  <Smartphone className="w-4 h-4" style={{ color: info.color }} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs">{info.name}</p>
                  <p className="text-xs text-neutral-500">{info.prefix}</p>
                </div>
                {method === key && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handlePay} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">
            {MOBILE_METHODS[method].name} Number
          </label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              type="tel"
              placeholder={MOBILE_METHODS[method].placeholder}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              disabled={loading}
              className="pl-10 rounded-xl border-2 focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Email (receipt)</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
            className="rounded-xl border-2 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
          <Shield className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-xs text-green-700">
            <span className="font-semibold">Secured by PayNow Zimbabwe.</span> Your payment is encrypted.
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading || !phone || !email}
          className="w-full bg-accent hover:bg-accent/90 text-primary py-5 text-base font-bold rounded-xl shadow transition-all disabled:opacity-50 gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending request...</>
            : <>Pay ${amount.toFixed(2)} with {MOBILE_METHODS[method].name}</>
          }
        </Button>
      </form>
    </div>
  )
}
