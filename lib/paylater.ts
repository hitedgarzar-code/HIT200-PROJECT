export interface InstallmentPlan {
  months: number
  monthlyAmount: number
  totalAmount: number
  interestRate: number
}

export function calculateInstallmentPlans(amount: number): InstallmentPlan[] {
  return [
    { months: 3,  monthlyAmount: amount / 3,              totalAmount: amount,        interestRate: 0  },
    { months: 6,  monthlyAmount: (amount * 1.05) / 6,     totalAmount: amount * 1.05, interestRate: 5  },
    { months: 12, monthlyAmount: (amount * 1.10) / 12,    totalAmount: amount * 1.10, interestRate: 10 },
  ]
}

export async function createPayLaterPlanInDB(plan: any) {
  return { id: Date.now().toString(), ...plan }
}
