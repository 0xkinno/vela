import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect } from 'wagmi'

export default function WalletConnectButton() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px',
          background: 'var(--bg-2)',
          border: '1px solid var(--line-strong)',
          borderRadius: '6px',
          fontFamily: 'var(--f-mono)',
          fontSize: '11px',
          color: 'var(--t2)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
          {address.slice(0,6)}…{address.slice(-4)}
        </div>
        <button
          onClick={() => disconnect()}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--red)', borderColor: 'rgba(255,77,106,0.3)', padding: '6px 10px' }}
        >
          ⏻
        </button>
      </div>
    )
  }

  return (
    <button className="btn btn-blue" onClick={() => open()}>
      Connect Wallet
    </button>
  )
}