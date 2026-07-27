import { useState } from 'react'
import SignInPage from './pages/auth/SignInPage'
import DashboardPage from './pages/dashboard/DashboardPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!isAuthenticated) {
    return <SignInPage onAuthenticated={() => setIsAuthenticated(true)} />
  }

  return <DashboardPage />
}

export default App