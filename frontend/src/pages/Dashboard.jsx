import { useState, useEffect } from 'react'
import AgentFeed from '../components/AgentFeed'
import PortfolioChart from '../components/PortfolioChart'
import PositionTable from '../components/PositionTable'

const METRICS = [
  { label: 'Portfolio Value', value: '$4,827.14', sub: '2.847 ETH', delta: '+$62.40 today', dir: 'up' },
  { label: 'Total Yield Earned', value: '$341.82', sub: 'All time', delta: '+$12.30 today', dir: 'up' },
  { label: 'Current APY', value: '14.2%', sub: 'Rolling 30d', delta: '+1.4% vs last month', dir: 'up', cls: 'blue' },
  { label: 'Active Agents', value: '3 / 3', sub: 'All systems nominal', delta: 'Healthy', dir: 'ok' },
]

const AGENTS = [
  { key: 'scout', icon: '⬡', name: 'VELA Scout', role: 'Market Intelligence', status: 'active', statusLabel: 'Scanning', stat: 'Last scan', val: '4m ago' },
  { key: 'allocator', icon: '◈', name: 'VELA Allocator', role: 'Portfolio Execution', status: 'active', statusLabel: 'Active', stat: 'Last tx', val: '12m ago' },
  { key: 'sentinel', icon: '◉', name: 'VELA Sentinel', role: 'Risk Guardian', status: 'alert', statusLabel: 'Monitoring', stat: 'Risk score', val: 'Low · 2/10' },
]

export default function Dashboard() {
  const [time, setTime] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  return (
    <div className="page">
      <div className="page-head flex justify-b items-c">
        <div>
          <div className="page-eyebrow">Overview</div>
          <div className="page-title">Portfolio</div>
          <div className="page-sub">3 agents active · Last update 4 minutes ago</div>
        </div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--t3)', textAlign: 'right' }}>
          <div>{time.toUTCString().slice(5, 25)} UTC</div>
          <div style={{ marginTop: 4, color: 'var(--blue)' }}>Block #284,441,209</div>
        </div>
      </div>

      <div className="alert info">
        <span className="alert-icon" style={{ color: 'var(--blue)' }}>◈</span>
        <div>
          <span className="alert-agent">Allocator</span>
          Moved 18% from ETH to Aave USDC yield — volatility spike detected (+4.2% in 1h). Position: 52% stables, 48% ETH.
        </div>
        <span className="alert-time">12m ago</span>
      </div>

      {/* Metric row */}
      <div className="metric-row">
        {METRICS.map((m) => (
          <div className="metric-cell" key={m.label}>
            <div className="metric-label">{m.label}</div>
            <div className={`metric-value ${m.cls || ''}`}>{m.value}</div>
            <div className="metric-sub">{m.sub}</div>
            <div className={`metric-delta ${m.dir}`}>{m.dir === 'up' ? '↑' : m.dir === 'ok' ? '●' : '↓'} {m.delta}</div>
          </div>
        ))}
      </div>

      {/* Agent strip */}
      <div className="agent-strip">
        {AGENTS.map((a) => (
          <div key={a.key} className={`agent-tile ${a.key}`}>
            <div className="agent-header">
              <div className={`agent-glyph ${a.key}`}>{a.icon}</div>
              <div className={`agent-status-pill ${a.status}`}>
                <div className="agent-status-pill-dot" />
                {a.statusLabel}
              </div>
            </div>
            <div className="agent-name">{a.name}</div>
            <div className="agent-role">{a.role}</div>
            <div className="agent-stat-line">
              <span>{a.stat}</span>
              <strong>{a.val}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="dash-grid">
        <div className="dash-col">
          <PortfolioChart />
          <PositionTable />
        </div>
        <div className="dash-col">
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Agent Decision Feed</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--green)' }}>● Live</div>
            </div>
            <AgentFeed />
          </div>
        </div>
      </div>
    </div>
  )
}