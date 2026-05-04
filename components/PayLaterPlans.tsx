'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { calculateInstallmentPlans } from '@/lib/paylater'
import { AlertCircle, Loader2, CheckCircle2, Calendar, DollarSign, Percent } from 'lucide-react'

interface PayLaterPlansProps {
  orderId:   string
  amount:    number
  phone:     string
  email:     string
  onSuccess: (planId: string) => void
  onError:   (error: string) => void
}

export function PayLaterPlans({
  orderId,
  amount,
  phone,
  email,
  onSuccess,
  onError,
}: PayLaterPlansProps) {
  const [selectedMonths, setSelectedMonths] = useState<3 | 6 | 12 | null>(null)
  const [loading, setLoading]               = useState(false)
  const [confirmed, setConfirmed]           = useState(false)

  const plans = useMemo(() => calculateInstallmentPlans(amount), [amount])

  const handleSelectPlan = async (months: 3 | 6 | 12) => {
    if (loading || confirmed) return
    setSelectedMonths(months)
    setLoading(true)

    try {
      const res  = await fetch('/api/payments/paylater/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId, totalAmount: amount, months, phone, email }),
      })

      const data = await res.json()

      if (!data.success) {
        onError(data.message || 'Failed to create Pay Later plan')
        setSelectedMonths(null)
        setLoading(false)
        return
      }

      // Show confirmation briefly before calling onSuccess
      setConfirmed(true)
      setLoading(false)
      setTimeout(() => onSuccess(data.planId), 1500)
    } catch (err: any) {
      onError(err.message || 'Network error. Please try again.')
      setSelectedMonths(null)
      setLoading(false)
    }
  }

  // ── Confirmed state ────────────────────────────────────────
  if (confirmed && selectedMonths) {
    const plan = plans.find(p => p.months === selectedMonths)!
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <CheckCircle2 className="w-14 h-14 text-green-500" />
        <div>
          <p className="text-xl font-bold text-green-700">Plan Confirmed!</p>
          <p className="text-muted-foreground mt-1">
            ${plan.monthlyAmount.toFixed(2)} / month for {plan.months} months
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800">Pay Later — Flexible Instalments</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Spread your ${amount.toFixed(2)} payment across 3, 6, or 12 months.
            First payment due 30 days after purchase.
          </p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map(plan => {
          const isSelected = selectedMonths === plan.months
          const isLoading  = loading && isSelected

          return (
            <Card
              key={plan.months}
              onClick={() => !loading && !confirmed && handleSelectPlan(plan.months)}
              className={`p-5 cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? 'ring-2 ring-primary border-primary bg-primary/5'
                  : 'hover:border-primary border-neutral-200'
              } ${loading && !isSelected ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="space-y-4">
                {/* Plan name */}
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-primary text-base">{plan.name}</h3>
                  {isSelected && !isLoading && (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  )}
                  {isLoading && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                  )}
                </div>

                {/* Monthly amount — the headline figure */}
                <div className="bg-primary/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-neutral-500 mb-1 flex items-center justify-center gap-1">
                    <DollarSign className="w-3 h-3" /> Monthly Payment
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    ${plan.monthlyAmount.toFixed(2)}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Duration
                    </span>
                    <span className="font-medium">{plan.months} months</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3 h-3" /> Interest
                    </span>
                    <span className="font-medium">{plan.interestRate}%</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-neutral-700 font-semibold">
                    <span>Total payable</span>
                    <span>${plan.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={e => { e.stopPropagation(); handleSelectPlan(plan.months) }}
                  disabled={loading}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`w-full ${isSelected ? 'bg-primary text-white' : ''}`}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</>
                  ) : (
                    'Select this plan'
                  )}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Terms */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
        <p className="font-semibold mb-2">Pay Later Terms</p>
        <ul className="space-y-1 text-xs list-disc list-inside">
          <li>First instalment due 30 days from purchase</li>
          <li>Subsequent instalments due monthly on the same date</li>
          <li>Late payment fee: 2% per month on outstanding balance</li>
          <li>Early settlement allowed with no penalty</li>
          <li>Prices shown in USD</li>
        </ul>
      </div>
    </div>
  )
}
