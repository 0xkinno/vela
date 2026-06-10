import { useState } from 'react'
import { ADDRESSES, STRATEGY_ABI } from '../lib/contracts'
import { writeContract } from 'wagmi/actions'
import { config } from '../lib/wagmi'
import { useAccount } from 'wagmi'

const PRESETS = [
  { key: 'aggressive', name: 'Aggressive Yield', desc: 'Max returns, higher risk tolerance', apy: '18–22% APY', templateId: 2, alloc: [['Aave lending',40],['Uniswap LP',35],['Stablecoins',15],['Reserve',10]] },
  { key: 'balanced', name: 'Balanced Growth', desc: 'Optimised risk-adjusted returns', apy: '12–16% APY', templateId: 1, alloc: [['Aave lending',30],['Uniswap LP',20],['Stablecoins',40],['Reserve',10]] },
  { key: 'stable', name: 'Stable Income', desc: 'Capital preservation first', apy: '6–9% APY', templateId: 0, alloc: [['Aave lending',20],['Uniswap LP',5],['Stablecoins',65],['Reserve',10]] },
]

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Strategy() {
  const [sel, setSel] = useState('balanced')
  const [custom, setCustom] = useState('')
  const [rebal, setRebal] = useState('weekly')
  const [stopLoss, setStopLoss] = useState(15)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [generating, setGenerating] = useState(false)

  const { address } = useAccount()
  const preset = PRESETS.find(p => p.key === sel)

  async function handleSave() {
    if (!address) { setSaveError('Connect wallet first'); return }
    setSaving(true); setSaveError('')
    try {
      await writeContract(config, {
        address: ADDRESSES.VelaStrategy,
        abi: STRATEGY_ABI,
        functionName: 'applyTemplate',
        args: [BigInt(preset.templateId)],
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (e) {
      setSaveError(e?.shortMessage || e?.message?.slice(0, 100) || 'Transaction failed')
    }
    setSaving(false)
  }

  async function generateWithAI() {
    setGenerating(true)
    setCustom('Generating...')
    try {
      const res = await fetch(`${API}/api/generate-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: preset.name, stopLoss, rebalance: rebal }),
      })
      const data = await res.json()
      setCustom(data.strategy)
    } catch {
      setCustom('Keep 60% in stablecoins during high volatility. Rebalance if drift exceeds 8%. Exit to USDC if ETH drops 15% in 24h.')
    }
    setGenerating(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">AI Configuration</div>
        <div className="page-title">Strategy</div>
        <div className="page-sub">Define how VELA agents manage your portfolio</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div className="panel">
            <div className="panel-head"><div className="panel-title">Preset Strategies</div></div>
            <div className="panel-body">
              <div className="strat-grid">
                {PRESETS.map((p) => (
                  <div key={p.key} className={`strat-card ${sel === p.key ? 'sel' : ''}`} onClick={() => setSel(p.key)}>
                    <div className="strat-name">{p.name}</div>
                    <div className="strat-desc">{p.desc}</div>
                    <div className="strat-apy">{p.apy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><div className="panel-title">Custom Instructions</div></div>
            <div className="panel-body">
              <p style={{ fontSize: '12px', color: 'var(--t2)', marginBottom: '12px', lineHeight: 1.6, fontWeight: 300 }}>
                Write plain English rules, or generate with AI. Agents follow these in addition to the preset.
              </p>
              <textarea
                className="plain-input"
                placeholder='"Keep 60% in stablecoins during high volatility. Exit to USDC if ETH drops 15% in 24h."'
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                rows={4}
                disabled={generating}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={generateWithAI} disabled={generating}>
                  {generating ? '⟳ Generating...' : '✦ Generate with AI'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setCustom('')}>Clear</button>
              </div>

              <div style={{ marginTop: '14px', padding: '12px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: '6px' }}>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '10px' }}>
                  How agents read your instructions
                </div>
                {[
                  ['var(--blue)',  'Scout',     'Reads market conditions to validate rules — "high volatility" triggers risk check'],
                  ['var(--green)', 'Allocator', 'Executes rebalancing and deployment based on your allocation rules'],
                  ['var(--amber)', 'Sentinel',  'Monitors stop-loss thresholds and emergency exit conditions you define'],
                ].map(([c, name, desc]) => (
                  <div key={name} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <span style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: c, textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '6px' }}>{name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 300 }}>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><div className="panel-title">Risk Parameters</div></div>
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--t2)', marginBottom: '12px', fontWeight: 500 }}>Rebalance Frequency</div>
                  {['hourly', 'daily', 'weekly'].map((r) => (
                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', borderRadius: 6, marginBottom: '6px', cursor: 'pointer', background: rebal === r ? 'var(--blue-faint)' : 'var(--bg-2)', border: `1px solid ${rebal === r ? 'var(--blue-border)' : 'var(--line)'}`, fontSize: '12px', color: rebal === r ? 'var(--blue)' : 'var(--t2)' }}>
                      <input type="radio" name="rebal" value={r} checked={rebal === r} onChange={() => setRebal(r)} style={{ accentColor: 'var(--blue)' }} />
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </label>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--t2)', marginBottom: '12px', fontWeight: 500 }}>ETH Stop-Loss</div>
                  <div className="range-num">−{stopLoss}%</div>
                  <input type="range" min={5} max={50} step={1} value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--t3)', marginTop: '6px' }}>
                    <span>5%</span><span>50%</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '10px', lineHeight: 1.5, fontWeight: 300 }}>
                    If ETH drops {stopLoss}% in 24h, Sentinel exits to USDC.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            className={`btn ${saved ? 'btn-ghost' : 'btn-blue'} btn-full`}
            style={{ padding: '13px', fontSize: '14px', opacity: saving ? 0.7 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '⟳ Signing transaction...' : saved ? '✓ Strategy saved onchain' : 'Save Strategy & Activate Agents →'}
          </button>

          {saveError && (
            <div style={{ padding: '8px 12px', background: 'var(--red-dim)', border: '1px solid rgba(255,77,106,0.3)', borderRadius: '6px', fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--red)' }}>
              {saveError}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="panel">
            <div className="panel-head"><div className="panel-title">Allocation Preview</div></div>
            <div className="panel-body">
              {preset?.alloc.map(([label, pct]) => (
                <div className="alloc-row" key={label}>
                  <div className="alloc-top"><span>{label}</span><span>{pct}%</span></div>
                  <div className="alloc-track"><div className="alloc-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              ))}
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-2)', borderRadius: 6, textAlign: 'center', border: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '6px' }}>Expected APY</div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: '28px', letterSpacing: '1px', color: 'var(--green)' }}>{preset?.apy}</div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><div className="panel-title">Active Protocols</div></div>
            <div className="panel-body" style={{ padding: '0 20px' }}>
              {[['Aave V3','Lending','Connected','var(--green)'],['Uniswap V3','AMM / LP','Connected','var(--green)'],['Chainlink','Price Feeds','Connected','var(--green)'],['ZeroDev','Session Keys','Active','var(--blue)']].map(([n,t,s,c]) => (
                <div className="data-row" key={n}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t1)', marginBottom: '2px' }}>{n}</div>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--t3)' }}>{t}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: c }}>● {s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}