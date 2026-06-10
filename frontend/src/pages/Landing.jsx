import WalletConnectButton from '../components/WalletConnect'

import { useState, useEffect, useRef } from 'react'

const LOG_ENTRIES = [
  { agent: 'scout',     color: '#12B8FF', msg: 'Aave USDC APY: 4.21% · +0.3% since last scan' },
  { agent: 'allocator', color: '#00D68F', msg: 'Deploying 420 USDC to Aave · reasoning committed' },
  { agent: 'sentinel',  color: '#F5A623', msg: 'ETH volatility: LOW · health score 91/100' },
  { agent: 'scout',     color: '#12B8FF', msg: 'Chainlink ETH/USD: $2,841.40 · stable' },
  { agent: 'allocator', color: '#00D68F', msg: 'Portfolio rebalanced · 52% Aave / 48% liquid' },
  { agent: 'sentinel',  color: '#F5A623', msg: 'Risk scan complete · 0 alerts · monitoring' },
  { agent: 'scout',     color: '#12B8FF', msg: 'Uniswap ETH/USDC pool APY: 6.8% · moderate' },
  { agent: 'allocator', color: '#00D68F', msg: 'Session key active · ZeroDev tx confirmed' },
  { agent: 'sentinel',  color: '#F5A623', msg: 'Emergency exit: STANDBY · no trigger conditions' },
  { agent: 'scout',     color: '#12B8FF', msg: 'Gas: 0.011 gwei on Arbitrum · optimal window' },
  { agent: 'allocator', color: '#00D68F', msg: 'Yield harvest: +$3.24 USDC · compounded' },
  { agent: 'sentinel',  color: '#F5A623', msg: 'ETH price delta 1h: +0.8% · trend: neutral' },
  { agent: 'scout',     color: '#12B8FF', msg: 'Block #284,441,892 · Arbitrum Sepolia synced' },
  { agent: 'allocator', color: '#00D68F', msg: 'Strategy: Balanced Growth · on target' },
  { agent: 'sentinel',  color: '#F5A623', msg: 'Watchdog cycle #4,821 · all clear' },
  { agent: 'scout',     color: '#12B8FF', msg: 'Market sentiment: NEUTRAL · confidence 78%' },
  { agent: 'allocator', color: '#00D68F', msg: 'Aave position: $2,184 · accruing interest' },
  { agent: 'sentinel',  color: '#F5A623', msg: 'Position health: 94% · no action required' },
]

function LiveLogFeed() {
  const [logs, setLogs] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      ...LOG_ENTRIES[i % LOG_ENTRIES.length],
      id: i,
      ts: Date.now() - (12 - i) * 3500,
      fresh: false,
    }))
  )
  const counter = useRef(12)
  const scrollRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const entry = LOG_ENTRIES[counter.current % LOG_ENTRIES.length]
      counter.current++
      setLogs(prev => [
        { ...entry, id: counter.current, ts: Date.now(), fresh: true },
        ...prev.slice(0, 30).map(l => ({ ...l, fresh: false })),
      ])
      if (scrollRef.current && scrollRef.current.scrollTop < 30) {
        scrollRef.current.scrollTop = 0
      }
    }, 2400)
    return () => clearInterval(interval)
  }, [])

  function fmt(ts) {
    return new Date(ts).toTimeString().slice(0, 8)
  }

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #00D68F; }
          50%       { opacity: 0.5; box-shadow: 0 0 2px #00D68F; }
        }
        .vela-log-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(18,184,255,0.3) rgba(255,255,255,0.03);
        }
        .vela-log-scroll::-webkit-scrollbar { width: 4px; }
        .vela-log-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 4px; }
        .vela-log-scroll::-webkit-scrollbar-thumb { background: rgba(18,184,255,0.3); border-radius: 4px; }
        .vela-log-scroll::-webkit-scrollbar-thumb:hover { background: rgba(18,184,255,0.55); }
      `}</style>

      {/* KEY: position absolute, not fixed — so it stays at top of page and scrolls away with the page */}
      <div
        style={{
          position: 'absolute',
          left: '12mm',
top: 'calc(110px + 20mm)',
          width: '273px',
          background: 'rgba(10, 16, 28, 0.97)',
          border: '1px solid rgba(18,184,255,0.2)',
          borderRadius: '10px',
          backdropFilter: 'blur(16px)',
          zIndex: 20,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(18,184,255,0.07)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(18,184,255,0.14)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(18,184,255,0.05)',
        }}>
          <span style={{
            width: '7px', height: '7px',
            borderRadius: '50%',
            background: '#00D68F',
            display: 'inline-block',
            flexShrink: 0,
            animation: 'glowPulse 1.8s infinite',
          }} />
          <span style={{
            fontFamily: 'var(--f-mono)',
            fontSize: '8.5px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(18,184,255,0.75)',
            fontWeight: 700,
          }}>
            LIVE AGENT FEED
          </span>
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--f-mono)',
            fontSize: '8px',
            color: 'rgba(255,255,255,0.3)',
          }}>
            {fmt(Date.now())}
          </span>
        </div>

        {/* Scroll area */}
        <div
          ref={scrollRef}
          className="vela-log-scroll"
          onWheel={e => { if (isHovered) e.stopPropagation() }}
          style={{
            height: '400px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          {logs.map((log, i) => (
            <div
              key={log.id}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                gap: '9px',
                alignItems: 'flex-start',
                opacity: 1,
                animation: log.fresh && i === 0 ? 'slideDown 0.35s ease' : 'none',
                background: log.fresh && i === 0
                  ? `rgba(${log.color === '#12B8FF' ? '18,184,255' : log.color === '#00D68F' ? '0,214,143' : '245,166,35'},0.05)`
                  : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                transition: 'background 0.6s',
              }}
            >
              {/* Colored dot */}
              <span style={{
                width: '6px', height: '6px',
                borderRadius: '50%',
                background: log.color,
                flexShrink: 0,
                marginTop: '5px',
                boxShadow: log.fresh && i === 0 ? `0 0 10px ${log.color}` : `0 0 4px ${log.color}55`,
                transition: 'box-shadow 0.8s',
              }} />

              <div style={{ minWidth: 0, flex: 1 }}>
                {/* Agent label + time */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}>
                  <span style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: '9.5px',
                    color: log.color,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 700,
                  }}>
                    {log.agent}
                  </span>
                  <span style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: '8px',
                    color: 'rgba(255,255,255,0.35)',
                  }}>
                    {fmt(log.ts)}
                  </span>
                </div>

                {/* Message — full opacity, clearly readable */}
                <div style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: '11.5px',
                  color: 'rgba(210,228,248,0.92)',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                  fontWeight: 400,
                }}>
                  {log.msg}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hover hint at bottom */}
        {!isHovered && (
          <div style={{
            padding: '6px 0',
            borderTop: '1px solid rgba(18,184,255,0.08)',
            textAlign: 'center',
            background: 'rgba(10,16,28,0.98)',
          }}>
            <span style={{
              fontFamily: 'var(--f-mono)',
              fontSize: '8px',
              color: 'rgba(18,184,255,0.4)',
              letterSpacing: '1.5px',
            }}>
              ↕ SCROLL INSIDE BOX
            </span>
          </div>
        )}
      </div>
    </>
  )
}

export default function Landing({ wallet, onEnterApp, onDisconnect }) {
  return (
    <div className="land" style={{ position: 'relative' }}>
      <div className="land-grid" />

      <LiveLogFeed />

      <nav className="land-nav">
        <div className="land-logo-box">
          <div className="land-logo-glow" style={{
            width: 'fit-content',
            padding: '4px 10px',
            letterSpacing: '4px',
          }}>VELA</div>
          <div className="land-logo-sub">AUTONOMOUS DEFI · ARBITRUM</div>
        </div>

        <div className="land-nav-right">
  <div className="chain-badge">
    <div className="chain-badge-dot" />
    Arbitrum One
  </div>
  <WalletConnectButton />
</div>
      </nav>

      <section className="land-hero" style={{ paddingLeft: 'calc(240px + 32mm)' }}>
        <div className="land-eyebrow">
          <div className="land-eyebrow-dot" />
          Live on Arbitrum Sepolia · 3 Agents Active
        </div>

        <h1 className="land-h1">
          Capital That Never<br />
          <em>Sleeps, Never Stops,</em><br />
          Never Needs You.
        </h1>

        <p className="land-p">
          VELA's AI agents farm yield, rebalance positions, and defend
          your capital 24/7 — executing autonomously on Arbitrum while
          you retain full, non-custodial ownership of every asset.
        </p>

        <div className="land-cta">
          <button className="btn btn-blue btn-lg" onClick={onEnterApp}>
            Launch App →
          </button>
          <a href="https://github.com/0xkinno/vela"
  target="_blank"
  rel="noopener noreferrer"
  className="btn btn-ghost btn-lg"
>
  Read the Docs
</a>
        </div>

        <div className="land-stats">
          {[
            ['$2.4M', 'TVL Managed'],
            ['14.2%', 'Avg APY'],
            ['18,400', 'Txns Executed'],
            ['0', 'Liquidations'],
          ].map(([v, l]) => (
            <div className="land-stat" key={l}>
              <div className="land-stat-val">{v}</div>
              <div className="land-stat-lbl">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="land-agents">
        <div className="land-section-label">The Intelligence Layer</div>
        <div className="land-section-title">Three agents. One mission.</div>

        <div className="land-agent-grid">
          {[
            { key: 'scout', icon: '⬡', label: 'VELA Scout', name: 'Market Intelligence', desc: 'Reads Aave rates, Uniswap APYs, and Chainlink price feeds every 15 minutes. Surfaces opportunities before the market prices them in.' },
            { key: 'allocator', icon: '◈', label: 'VELA Allocator', name: 'Autonomous Execution', desc: 'ZeroDev session keys let the agent execute within your approved limits — no wallet pop-ups, no missed windows, no intervention needed.' },
            { key: 'sentinel', icon: '◉', label: 'VELA Sentinel', name: 'Risk Guardian', desc: 'Monitors every position continuously. Auto-exits to stablecoins on catastrophic signals. Your capital is always the first consideration.' },
          ].map((a) => (
            <div key={a.key} className={`land-agent-card ${a.key}`}>
              <div className={`land-agent-glyph ${a.key}`}>{a.icon}</div>
              <div className="land-agent-label">{a.label}</div>
              <div className="land-agent-name">{a.name}</div>
              <div className="land-agent-desc">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="land-foot">
        <div className="land-foot-copy">© 2025 VELA Protocol · Built on Arbitrum</div>
        <div className="land-foot-copy">Non-custodial · Audited · Open Source</div>
      </footer>
    </div>
  )
}