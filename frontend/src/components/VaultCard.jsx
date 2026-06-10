import { useState } from 'react'
import { useVault } from '../hooks/useVault'

export default function VaultCard({ balance = '2.847', usdValue = '$4,827.14' }) {
  const [amount, setAmount] = useState('')
  const [tab, setTab] = useState('deposit')
  const { deposit, withdraw, isDepositing, isWithdrawing } = useVault()

  return (
    <div className="card">
      <div className="card-title">Smart Vault</div>
      <div style={{ marginBottom: '12px' }}>
        <div className="metric-value accent">{usdValue}</div>
        <div className="metric-sub">{balance} ETH deposited</div>
      </div>
      <div className="tabs">
        <button className={`tab ${tab === 'deposit' ? 'active' : ''}`} onClick={() => setTab('deposit')}>Deposit</button>
        <button className={`tab ${tab === 'withdraw' ? 'active' : ''}`} onClick={() => setTab('withdraw')}>Withdraw</button>
      </div>
      <div className="vault-input-wrap">
        <input
          type="number"
          className="vault-input"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="vault-currency">ETH</div>
      </div>
      <button
        className="btn btn-primary btn-full"
        onClick={() => tab === 'deposit' ? deposit(amount) : withdraw(amount)}
        disabled={isDepositing || isWithdrawing || !amount}
      >
        {isDepositing || isWithdrawing ? 'Processing...' : tab === 'deposit' ? 'Deposit →' : 'Withdraw →'}
      </button>
    </div>
  )
}