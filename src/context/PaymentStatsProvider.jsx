import { getPaymentStats } from '../api/payments'
import { useApi } from '../hooks/useApi'
import { PaymentStatsContext } from './PaymentStatsContext'

function PaymentStatsProvider({ children }) {
  const stats = useApi('payment-stats', getPaymentStats)

  return <PaymentStatsContext.Provider value={stats}>{children}</PaymentStatsContext.Provider>
}

export default PaymentStatsProvider
