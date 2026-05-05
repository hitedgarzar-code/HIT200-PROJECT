export interface InstallmentPlan {
  months: number
  monthlyAmount: number
  totalAmount: number
  interestRate: number
}

export function calculateInstallmentPlans(amount: number): InstallmentPlan[] {
  return [
    { months: 3,  monthlyAmount: amount / 3,             totalAmount: amount,        interestRate: 0  },
    { months: 6,  monthlyAmount: (amount * 1.05) / 6,    totalAmount: amount * 1.05, interestRate: 5  },
    { months: 12, monthlyAmount: (amount * 1.10) / 12,   totalAmount: amount * 1.10, interestRate: 10 },
  ]
}

export async function createPayLaterPlanInDB(
  supabase: any,
  userId: string,
  options: {
    orderId:     string
    totalAmount: number
    months:      3 | 6 | 12
    phone:       string
    email:       string
  }
) {
  try {
    const plans = calculateInstallmentPlans(options.totalAmount)
    const selectedPlan = plans.find(p => p.months === options.months)

    if (!selectedPlan) {
      return { success: false, message: 'Invalid instalment plan selected.' }
    }

    const nextPaymentDate = new Date()
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 30)

    const { data, error } = await supabase
      .from('pay_later_plans')
      .insert({
        order_id:           options.orderId,
        user_id:            userId,
        email:              options.email,
        total_amount:       options.totalAmount,
        installment_amount: selectedPlan.monthlyAmount,
        months:             options.months,
        interest_rate:      selectedPlan.interestRate,
        total_payable:      selectedPlan.totalAmount,
        status:             'active',
        next_payment_date:  nextPaymentDate.toISOString(),
        payments_made:      0,
        payments_remaining: options.months,
      })
      .select()
      .single()

    if (error) {
      console.error('[PayLater] Supabase insert error:', error)
      return { success: false, message: error.message }
    }

    return {
      success: true,
      planId:  data.id,
      plan:    {
        monthlyAmount: selectedPlan.monthlyAmount,
        totalAmount:   selectedPlan.totalAmount,
        months:        options.months,
        interestRate:  selectedPlan.interestRate,
      },
      message: 'Pay Later plan created successfully.',
    }
  } catch (err: any) {
    console.error('[PayLater] Unexpected error:', err)
    return { success: false, message: err?.message || 'Failed to create plan.' }
  }
}
