import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useVaultMetrics, useUserInfo, useDeposit, useWithdraw } from '../hooks/useVault'
import { useWallet } from '../hooks/useWallet'
import WalletConnectButton from '../components/WalletConnect'

export default function Vault() {
  const [tab, setTab] = useState('deposit')
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState('idle') // idle | approving | depositing | success | error
  const [txHash, setTxHash] = useState(null)
  const [stepMsg, setStepMsg] = useState('')

  const { isConnected } = useAccount()
  const { usdcBalance } = useWallet()
  const { metrics } = useVaultMetrics()
  const { userInfo } = useUserInfo()
  const { approve, deposit, isPending: depositPending, isSuccess: depositSuccess } = useDeposit()
  const { withdraw, isPending: withdrawPending, isSuccess: withdrawSuccess } = useWithdraw()

  const usdVal = amount ? (parseFloat(amount) * 1).toFixed(2) : '0.00' // USDC = 1:1 USD

  async function handleDeposit() {
    if (!amount || parseFloat(amount) <= 0) return
    try {
      setStep('approving')
      setStepMsg('Step 1/2 — Approving USDC spend...')
      await approve(amount)
      setStep('depositing')
      setStepMsg('Step 2/2 — Depositing to vault...')
      await deposit(amount)
      setStep('success')
      setStepMsg('Deposited successfully! Agents are now working your capital.')
      setAmount('')
    } catch (e) {
      setStep('error')
      setStepMsg(e?.message?.slice(0, 100) || 'Transaction failed.')
    }
  }

  async function handleWithdraw() {
    if (!amount || parseFloat(amount) <= 0) return
    try {
      setStep('depositing')
      setStepMsg('Withdrawing from vault...')
      await withdraw(amount)
      setStep('success')
      setStepMsg('Withdrawn successfully. Funds returned to your wallet.')
      setAmount('')
    } catch (e) {
      setStep('error')
      setStepMsg(e?.message?.slice(0, 100) || 'Transaction failed.')
    }
  }

  function setPct(pct) {
    const bal = parseFloat(tab === 'deposit' ? usdcBalance : userInfo?.assets || '0')
    if (pct === 'MAX') setAmount(bal.toFixed(2))
    else setAmount((bal * parseInt(pct) / 100).toFixed(2))
  }

  const isLoading = step === 'approving' || step === 'depositing' || depositPending || withdrawPending

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">ERC-4626</div>
        <div className="page-title">Smart Vault</div>
        <div className="page-sub">Non-custodial · Funds never leave your control · Withdraw anytime</div>
      </div>

      {/* Live vault stats */}
      <div className="metric-row mb-20">
        {[
          ['Your Deposits',  userInfo ? `$${userInfo.assets}` : '—',       userInfo ? `+$${userInfo.yieldEarned} yield` : 'Connect wallet'],
          ['Yield Earned',   userInfo ? `$${userInfo.yieldEarned}` : '—',  'All time'],
          ['Vault TVL',      metrics  ? `$${parseFloat(metrics.tvl).toLocaleString()}` : '—', metrics ? `${metrics.agentExecs} agent txns` : 'Loading...'],
          ['Vault APY',      '14.2%', 'Rolling 30d'],
        ].map(([l, v, s]) => (
          <div className="metric-cell" key={l}>
            <div className="metric-label">{l}</div>
            <div className="metric-value">{v}</div>
            <div className="metric-sub">{s}</div>
          </div>
        ))}
      </div>

      {!isConnected ? (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '60px 24px',
          background: 'var(--bg-1)', border: '1px solid var(--line)',
          borderRadius: '8px', gap: '16px',
        }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '24px', color: 'var(--t2)', letterSpacing: '1px' }}>
            CONNECT TO DEPOSIT
          </div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: '11px', color: 'var(--t3)', marginBottom: '8px' }}>
            Connect your wallet to deposit into the VELA vault
          </div>
          <WalletConnectButton />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Deposit / Withdraw panel */}
          <div className="panel">
            <div className="panel-head">
              <div className="tabs" style={{ margin: 0, border: 'none' }}>
                <button className={`tab-btn ${tab === 'deposit' ? 'active' : ''}`} onClick={() => { setTab('deposit'); setStep('idle'); setAmount('') }}>Deposit</button>
                <button className={`tab-btn ${tab === 'withdraw' ? 'active' : ''}`} onClick={() => { setTab('withdraw'); setStep('idle'); setAmount('') }}>Withdraw</button>
              </div>
            </div>

            <div className="panel-body">
              {/* Balance line */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t3)' }}>
                  {tab === 'deposit' ? 'Wallet balance' : 'Vault balance'}
                </span>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t1)', fontWeight: 700 }}>
                  {tab === 'deposit' ? `${usdcBalance} USDC` : `$${userInfo?.assets || '0.00'}`}
                </span>
              </div>

              <div className="amount-wrap">
                <input
                  type="number"
                  className="amount-input"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                />
                <div className="amount-tag">USDC</div>
              </div>

              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t3)', marginBottom: '14px' }}>
                ≈ ${usdVal} USD
              </div>

              <div className="pct-row">
                {['25%', '50%', '75%', 'MAX'].map((p) => (
                  <button key={p} className="pct-btn" onClick={() => setPct(p)}>{p}</button>
                ))}
              </div>

              {/* Summary */}
              <div style={{ background: 'var(--bg-2)', borderRadius: 6, padding: '12px 14px', marginBottom: '16px', border: '1px solid var(--line)' }}>
                {[
                  ['You deposit',  `${amount || '0.0'} USDC`],
                  ['You receive',  `${amount ? (parseFloat(amount) * 0.9997).toFixed(4) : '0.0'} velaUSDC`],
                  ['Entry fee',    '0.00%'],
                  ['Current APY',  metrics ? '14.2%' : 'Loading...'],
                  ['Aave balance', metrics ? `$${metrics.aaveBalance} deployed` : '—'],
                ].map(([k, v]) => (
                  <div className="data-row" key={k}>
                    <span className="data-key">{k}</span>
                    <span className="data-val">{v}</span>
                  </div>
                ))}
              </div>

              {/* Status message */}
              {step !== 'idle' && (
                <div style={{
                  padding: '10px 14px', borderRadius: '6px',
                  marginBottom: '12px',
                  background: step === 'success' ? 'var(--green-dim)' : step === 'error' ? 'var(--red-dim)' : 'var(--blue-faint)',
                  border: `1px solid ${step === 'success' ? 'rgba(0,214,143,0.3)' : step === 'error' ? 'rgba(255,77,106,0.3)' : 'var(--blue-border)'}`,
                  fontFamily: 'var(--f-mono)', fontSize: '11px',
                  color: step === 'success' ? 'var(--green)' : step === 'error' ? 'var(--red)' : 'var(--blue)',
                  lineHeight: 1.5,
                }}>
                  {isLoading && <span style={{ marginRight: '8px' }}>⟳</span>}
                  {stepMsg}
                </div>
              )}

              <button
                className="btn btn-blue btn-full"
                onClick={tab === 'deposit' ? handleDeposit : handleWithdraw}
                disabled={isLoading || !amount || parseFloat(amount) <= 0}
                style={{ opacity: isLoading || !amount ? 0.6 : 1 }}
              >
                {isLoading ? 'Processing...' : tab === 'deposit' ? `Deposit ${amount || '0'} USDC →` : `Withdraw ${amount || '0'} USDC →`}
              </button>

              <p style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--t3)', textAlign: 'center', marginTop: '12px', lineHeight: 1.5 }}>
                Non-custodial · ZeroDev session keys · Full withdrawal anytime
              </p>
            </div>
          </div>

          {/* Info panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="panel">
              <div className="panel-head"><div className="panel-title-lg">How the Vault Works</div></div>
              <div className="panel-body">
                {[
                  ['01', 'Deposit', 'Your USDC enters an ERC-4626 non-custodial vault on Arbitrum.'],
                  ['02', 'Agents Activate', 'ZeroDev session keys authorize agents to act within your limits. No pop-ups.'],
                  ['03', 'Yield Compounds', 'Agents deploy to Aave V3 and rebalance based on your strategy.'],
                  ['04', 'Full Control', 'Override agents or exit in one transaction. Always.'],
                ].map(([n, t, d]) => (
                  <div key={n} style={{ display: 'flex', gap: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--line)', marginBottom: '14px' }}>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--blue)', minWidth: '18px', paddingTop: '2px' }}>{n}</div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t1)', marginBottom: '3px' }}>{t}</div>
                      <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, fontWeight: 300 }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ borderColor: 'rgba(0,214,143,0.2)' }}>
              <div className="panel-head"><div className="panel-title" style={{ color: 'var(--green)' }}>Security</div></div>
              <div className="panel-body">
                {[
                  'ERC-4626 standard — fully auditable',
                  'Agents cannot withdraw to external addresses',
                  'Session keys auto-expire after 24 hours',
                  'Emergency exit to stablecoins always available',
                  'Open source contracts on Arbiscan',
                ].map((s) => (
                  <div key={s} style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t2)', marginBottom: '8px', paddingLeft: '12px', borderLeft: '2px solid var(--green)', paddingTop: '1px', paddingBottom: '1px' }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}