export async function pollPayNowStatus(pollUrl: string) {
  return { paid: false, status: 'pending' }
}
