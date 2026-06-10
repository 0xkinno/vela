import { useDisconnect } from 'wagmi'

const NAV = [
    {
      group: 'Portfolio',
      links: [
        { key: 'dashboard', label: 'Dashboard', icon: <><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></> },
        { key: 'vault', label: 'Vault', icon: <><rect x="1" y="3" width="14" height="10" rx="1.5"/><circle cx="8" cy="8" r="2"/><path d="M8 6V4M8 12v-2M6 8H4M12 8h-2"/></> },
        { key: 'strategy', label: 'Strategy', icon: <><path d="M2 12l4-4 3 3 5-6"/><circle cx="14" cy="5" r="1.5" fill="currentColor" stroke="none"/></> },
      ],
    },
    {
      group: 'Agents',
      links: [
        { key: 'logs', label: 'Agent Logs', pulse: true, icon: <><path d="M2 4h12M2 8h8M2 12h5"/></> },
      ],
    },
  ]
  
  function DisconnectIcon() {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
      </svg>
    )
  }
  
  export default function Navbar({ active, onNav, onHome, onDisconnect, wallet }) {
    const { disconnect } = useDisconnect()
    return (
      <aside className="sidebar">
        {/* Logo — clickable, goes home */}
        <div className="sidebar-logo" onClick={onHome} style={{ cursor: 'pointer' }}>
          <div className="sidebar-logo-box">
            <div className="logo-wordmark-big">VELA</div>
          </div>
          <div className="logo-sub-bold">Autonomous DeFi · Arbitrum</div>
        </div>
  
        <nav className="nav-body">
          {NAV.map(({ group, links }, gi) => (
            <div key={group}>
              {/* Separator line before Vault/Strategy/Agent Logs group */}
              {gi === 0 && (
                <>
                  <div className="nav-group-label">{group}</div>
                  {/* Dashboard first, then divider, then rest */}
                  {links.slice(0, 1).map(({ key, label, icon, pulse }) => (
                    <button
                      key={key}
                      className={`nav-link nav-link-lg ${active === key ? 'active' : ''}`}
                      onClick={() => onNav(key)}
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0 }}>
                        {icon}
                      </svg>
                      {label}
                      {pulse && <span className="nav-pulse" />}
                    </button>
                  ))}
                  <div className="nav-divider" />
                  {links.slice(1).map(({ key, label, icon, pulse }) => (
                    <button
                      key={key}
                      className={`nav-link nav-link-lg ${active === key ? 'active' : ''}`}
                      onClick={() => onNav(key)}
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0 }}>
                        {icon}
                      </svg>
                      {label}
                      {pulse && <span className="nav-pulse" />}
                    </button>
                  ))}
                </>
              )}
              {gi > 0 && (
                <>
                  <div className="nav-group-label" style={{ marginTop: 20 }}>{group}</div>
                  {links.map(({ key, label, icon, pulse }) => (
                    <button
                      key={key}
                      className={`nav-link nav-link-lg ${active === key ? 'active' : ''}`}
                      onClick={() => onNav(key)}
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0 }}>
                        {icon}
                      </svg>
                      {label}
                      {pulse && <span className="nav-pulse" />}
                    </button>
                  ))}
                </>
              )}
            </div>
          ))}
        </nav>
  
        <div className="sidebar-foot">
          <div className="wallet-row">
            <div className="wallet-dot" />
            <div className="wallet-addr">
              {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '0x742d…b4F1'}
            </div>
            {/* Disconnect button */}
            <button
              onClick={() => disconnect()}
              title="Disconnect wallet"
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--t3)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
            >
              <DisconnectIcon />
            </button>
          </div>
          <div className="chain-row">
            <span>Arbitrum One</span>
            <span style={{ color: 'var(--green)' }}>● Connected</span>
          </div>
        </div>
      </aside>
    )
  }