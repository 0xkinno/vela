import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import './index.css'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Vault from './pages/Vault'
import Strategy from './pages/Strategy'
import AgentLogs from './pages/AgentLogs'
import Navbar from './components/Navbar'

const TITLES = { dashboard: 'Dashboard', vault: 'Smart Vault', strategy: 'Strategy', logs: 'Agent Logs' }

export default function App() {
  const [page, setPage] = useState('landing')
  const { address, isConnected } = useAccount()

  // Auto-navigate to dashboard when wallet connects
  useEffect(() => {
    if (isConnected && page === 'landing') {
      setPage('dashboard')
    }
  }, [isConnected])

  // Auto-navigate back to landing when wallet disconnects
  useEffect(() => {
    if (!isConnected && page !== 'landing') {
      setPage('landing')
    }
  }, [isConnected])

  if (page === 'landing' || !isConnected) {
    return <Landing wallet={address} onEnterApp={() => setPage('dashboard')} onDisconnect={() => setPage('landing')} />
  }

  const PAGES = {
    dashboard: <Dashboard />,
    vault: <Vault />,
    strategy: <Strategy />,
    logs: <AgentLogs />,
  }

  return (
    <div className="app-shell">
      <Navbar
        active={page}
        onNav={setPage}
        onHome={() => setPage('landing')}
        wallet={address}
      />
      <main className="main">
        <header className="topbar">
          <button className="topbar-logo" onClick={() => setPage('landing')}>VELA</button>
          <div className="topbar-divider" />
          <div className="topbar-title">{TITLES[page]}</div>
          <div className="topbar-right">
            <div className="chain-badge"><div className="chain-badge-dot" />Arbitrum Sepolia</div>
            <div className="block-num">Block #284,441,209</div>
          </div>
        </header>
        {PAGES[page]}
      </main>
    </div>
  )
}