import { useState } from 'react'

const DATA = {
  '7D':  [4210,4280,4190,4350,4420,4510,4827],
  '30D': [3800,3950,3820,4100,3990,4200,4350,4420,4510,4590,4630,4710,4720,4800,4750,4790,4810,4760,4820,4780,4840,4860,4790,4810,4820,4827],
}

function buildLine(pts, W, H) {
  const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1
  const step = W / (pts.length - 1)
  return pts.map((p, i) => {
    const x = (i * step).toFixed(1)
    const y = (H - ((p - mn) / rng) * (H * 0.82) - H * 0.05).toFixed(1)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
}

export default function PortfolioChart() {
  const [tf, setTf] = useState('7D')
  const pts = DATA[tf]
  const W = 600, H = 130
  const line = buildLine(pts, W, H)
  const area = `${line} L ${W} ${H} L 0 ${H} Z`
  const change = pts[pts.length - 1] - pts[0]
  const pct = ((change / pts[0]) * 100).toFixed(2)

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Portfolio Value</div>
        <div className="tabs" style={{ margin: 0, border: 'none', gap: '2px' }}>
          {['7D','30D'].map(t => (
            <button key={t} className={`tab-btn ${tf === t ? 'active' : ''}`} style={{ padding: '4px 10px' }} onClick={() => setTf(t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="panel-body">
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '36px', letterSpacing: '1px', color: 'var(--t1)', lineHeight: 1 }}>
            $4,827.14
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <span className={`metric-delta ${change >= 0 ? 'up' : 'dn'}`}>
              {change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(2)} ({pct}%)
            </span>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--t3)' }}>vs period start</span>
          </div>
        </div>

        <div className="chart-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12B8FF" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#12B8FF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#cg)" />
            <path d={line} fill="none" stroke="#12B8FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="chart-labels">
          {tf === '7D'
            ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)
            : ['Week 1','Week 2','Week 3','Week 4'].map(d => <span key={d}>{d}</span>)
          }
        </div>
      </div>
    </div>
  )
}