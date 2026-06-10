import { useState, useEffect } from 'react'

const COLORS = { scout: 'var(--blue)', allocator: 'var(--green)', sentinel: 'var(--amber)' }

const ACTION_MAP = { 0: 'Deploy → Aave', 1: 'Withdraw ← Aave', 2: 'Rebalance', 3: 'Emergency Exit', 4: 'Harvest Yield' }

export default function AgentLogs() {
  const [filter, setFilter] = useState('all')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Pull from agent backend
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/feed?limit=50`)
      .then(r => r.json())
      .then(data => { setLogs(data); setLoading(false) })
      .catch(() => setLoading(false))

    // WebSocket for live updates
    try {
        const ws = new WebSocket((import.meta.env.VITE_API_URL || 'http://localhost:3001').replace('http', 'ws'))
      ws.onmessage = (e) => {
        try {
          const item = JSON.parse(e.data)
          setLogs(prev => [item, ...prev].slice(0, 100))
        } catch {}
      }
      return () => ws.close()
    } catch {}
  }, [])

  const rows = filter === 'all' ? logs : logs.filter(l => l.agent === filter)

  return (
    <div className="page">
      <div className="page-head flex justify-b items-c">
        <div>
          <div className="page-eyebrow">Transparency Log</div>
          <div className="page-title">Agent Decisions</div>
          <div className="page-sub">Every action, every reasoning, every transaction — on record</div>
        </div>
        <button className="btn btn-ghost btn-sm">Export CSV</button>
      </div>

      <div className="tabs">
        {[['all','All Agents'],['scout','Scout'],['allocator','Allocator'],['sentinel','Sentinel']].map(([k,l]) => (
          <button key={k} className={`tab-btn ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      <div className="panel">
        {loading && (
          <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--f-mono)', fontSize: '11px', color: 'var(--t3)' }}>
            Connecting to agent feed...
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--f-mono)', fontSize: '11px', color: 'var(--t3)' }}>
            Waiting for agent activity... Agents run every 5 minutes.
          </div>
        )}

        {rows.map((log, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr 8px',
            gap: '20px',
            padding: '16px 20px',
            borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none',
            alignItems: 'start',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: COLORS[log.agent] || 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
                {log.agent || 'system'}
              </div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--t3)' }}>
                {log.time || (log.ts ? new Date(log.ts).toTimeString().slice(0,8) : '—')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--t1)', marginBottom: '5px' }}>
                {log.action || log.text || 'Agent event'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6, fontWeight: 300 }}>
                {log.detail || log.reasoning || log.msg || ''}
              </div>
              {(log.tx || log.txHash) && (
                
                  <a href={"https://sepolia.arbiscan.io/tx/" + (log.tx || log.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="feed-tx"
                  style={{ marginTop: '8px', display: 'inline-block' }}
                >
                  tx {((log.tx || log.txHash) + '').slice(0, 18)}…
                </a>
              )}
            </div>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[log.agent] || 'var(--t3)', marginTop: 5 }} />
          </div>
        ))}
      </div>
    </div>
  )
}