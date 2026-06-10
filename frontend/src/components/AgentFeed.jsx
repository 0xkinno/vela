import { useState, useEffect } from 'react'

const SEED = [
  { agent:'scout', text:'Aave USDC supply rate: 8.4% (+0.6% since last scan). Flagging as yield opportunity.', action:null, time:'4m ago' },
  { agent:'allocator', text:'Executed reallocation: 18% from ETH to Aave USDC. ETH volatility elevated.', action:'0x7a3b…f92c', time:'12m ago' },
  { agent:'sentinel', text:'All positions in safe range. ETH collateral at 189%. No action needed.', action:null, time:'15m ago' },
  { agent:'scout', text:'Uniswap USDC/ETH pool APY: 18.2%. LP concentration opportunity detected.', action:null, time:'19m ago' },
  { agent:'allocator', text:'Compounded $4.21 Aave rewards into USDC lending. Net gain: $4.207.', action:'0x2c9a…d441', time:'30m ago' },
]

const EVENTS = [
  { agent:'scout', text:'ETH price: $1,712 (−1.3% in 30m). Monitoring stop-loss threshold.' },
  { agent:'sentinel', text:'Risk score updated: 3/10. ETH volatility uptick. Still low risk overall.' },
  { agent:'allocator', text:'Evaluating WBTC Aave opportunity (12.1% APY). Awaiting Scout confirmation.' },
]

export default function AgentFeed() {
  const [items, setItems] = useState(SEED)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      if (idx < EVENTS.length) {
        setItems(prev => [{ ...EVENTS[idx], time: 'just now' }, ...prev.slice(0, 9)])
        setIdx(i => i + 1)
      }
    }, 8000)
    return () => clearInterval(t)
  }, [idx])

  return (
    <div className="feed" style={{ maxHeight: 380, overflowY: 'auto' }}>
      {items.map((item, i) => (
        <div className="feed-item" key={i}>
          <div className={`feed-pip ${item.agent}`} />
          <div className="feed-body">
            <div className="feed-meta">
              <span className={`feed-agent-tag ${item.agent}`}>{item.agent}</span>
              <span className="feed-time">{item.time}</span>
            </div>
            <div className="feed-text">{item.text}</div>
            {item.action && <span className="feed-tx">{item.action}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}