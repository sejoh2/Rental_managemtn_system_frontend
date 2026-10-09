import { createContext, useContext } from 'react'

export const PaymentStatsContext = createContext(null)

/*
  Payment statistics shared by the Payments page and the sidebar badge.

  const { data, reload } = usePaymentStats()
  data: { received_today, received_today_count, auto_match_rate, unmatched_count } | null
*/
export function usePaymentStats() {
  return useContext(PaymentStatsContext)
}
