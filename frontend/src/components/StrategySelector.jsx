import { useState } from 'react'

const PRESETS = [
  { key: 'aggressive', name: 'Aggressive', apy: '18–22%' },
  { key: 'balanced', name: 'Balanced', apy: '12–16%' },
  { key: 'stable', name: 'Stable', apy: '6–9%' },
]

export default function StrategySelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          className={`strategy-option ${value === p.key ? 'selected' : ''}`}
          onClick={() => onChange(p.key)}
          style={{ flex: 1, cursor: 'pointer' }}
        >
          <div className="strategy-name">{p.name}</div>
          <div className="strategy-apy">{p.apy}</div>
        </button>
      ))}
    </div>
  )
}