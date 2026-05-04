'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface PayLaterPlan {
  id: string
  order_id: string
  plan_name: string
  total_amount: number
  monthly_amount: number
  months: number
  interest_rate: number
  status: string
  created_at: string
}

interface Installment {
  id: string
  installment_number: number
  due_date: string
  amount: number
  status: 'pending' | 'paid'
  paid_at?: string
}

export default function PayLaterSchedulePage() {
  const [plan, setPlan] = useState<PayLaterPlan | null>(null)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const planId = params.planId as string

  const supabase = createClient()

  useEffect(() => {
    const loadPlanDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        // Get plan details
        const { data: planData, error: planError } = await supabase
          .from('pay_later_plans')
          .select('*')
          .eq('id', planId)
          .eq('user_id', user.id)
          .single()

        if (planError || !planData) {
          router.push('/orders')
          return
        }

        setPlan(planData)

        // Get installments (mock data for now - would come from database)
        const mockInstallments: Installment[] = []
        for (let i = 1; i <= planData.months; i++) {
          const dueDate = new Date()
          dueDate.setMonth(dueDate.getMonth() + i)

          mockInstallments.push({
            id: `inst_${planId}_${i}`,
            installment_number: i,
            due_date: dueDate.toISOString(),
            amount: planData.monthly_amount,
            status: i === 1 ? 'pending' : i < 3 ? 'pending' : 'pending',
          })
        }
        setInstallments(mockInstallments)
      } catch (error) {
        console.error('[v0] Load plan error:', error)
        router.push('/orders')
      } finally {
        setLoading(false)
      }
    }

    loadPlanDetails()
  }, [planId, supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading instalment schedule...</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Plan not found</p>
            <Link href="/orders">
              <Button>Back to Orders</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  const paidInstallments = installments.filter(i => i.status === 'paid').length
  const totalPaid = paidInstallments * plan.monthly_amount
  const remainingAmount = plan.total_amount - totalPaid

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <Link href="/orders" className="flex items-center gap-2 text-primary hover:text-primary-light mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <h1 className="text-4xl font-bold text-primary mb-2">Pay Later Instalment Plan</h1>
        <p className="text-neutral-600 mb-8">{plan.plan_name}</p>

        {/* Plan Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-neutral-600 mb-1">Plan Status</p>
            <Badge className={plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
              {plan.status}
            </Badge>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-neutral-600 mb-1">Monthly Payment</p>
            <p className="text-2xl font-bold text-primary">ZWL {plan.monthly_amount.toFixed(2)}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-neutral-600 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600">ZWL {totalPaid.toFixed(2)}</p>
            <p className="text-xs text-neutral-600 mt-1">{paidInstallments}/{plan.months} payments</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-neutral-600 mb-1">Remaining</p>
            <p className="text-2xl font-bold text-primary">ZWL {remainingAmount.toFixed(2)}</p>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-foreground">Overall Progress</p>
            <p className="text-sm text-neutral-600">{Math.round((paidInstallments / plan.months) * 100)}%</p>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${(paidInstallments / plan.months) * 100}%` }}
            />
          </div>
        </Card>

        {/* Instalment Schedule */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">Instalment Schedule</h2>

          <div className="space-y-3">
            {installments.map((inst, idx) => {
              const isUpcoming = new Date(inst.due_date) > new Date()
              const isOverdue = isUpcoming && idx > 0
              
              return (
                <div
                  key={inst.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    inst.status === 'paid'
                      ? 'bg-green-50 border-green-200'
                      : isOverdue
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {inst.status === 'paid' ? (
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      ) : isOverdue ? (
                        <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                      ) : (
                        <Clock className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      )}

                      <div>
                        <p className="font-semibold text-foreground">
                          Payment #{inst.installment_number}
                        </p>
                        <p className="text-sm text-neutral-600">
                          Due: {new Date(inst.due_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">ZWL {inst.amount.toFixed(2)}</p>
                      <Badge
                        className={
                          inst.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : isOverdue
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }
                      >
                        {inst.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Upcoming'}
                      </Badge>
                    </div>
                  </div>

                  {inst.status === 'paid' && inst.paid_at && (
                    <div className="mt-3 pt-3 border-t border-green-200 text-xs text-green-700">
                      Paid on {new Date(inst.paid_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Terms */}
          <div className="mt-8 pt-8 border-t border-neutral-200">
            <h3 className="font-semibold text-foreground mb-4">Plan Terms & Conditions</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Interest Rate: {plan.interest_rate.toFixed(1)}%</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Late Payment Fee: 2% per month on overdue amounts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Early Settlement: Allowed with no penalty</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Automatic Payment Reminders: Sent 5 days before due date</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            <Link href="/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Orders
              </Button>
            </Link>
            {plan.status === 'active' && (
              <Button className="flex-1 bg-primary hover:bg-primary-light text-white">
                Early Settlement
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
