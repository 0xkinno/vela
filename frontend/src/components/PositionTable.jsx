const POSITIONS = [
    { protocol:'Aave V3', abbr:'Aa', type:'USDC Lending', value:'$2,509.10', alloc:52, apy:'8.4%', earned:'+$48.20', dir:'up' },
    { protocol:'ETH Holdings', abbr:'Ξ', type:'Native ETH', value:'$1,712.80', alloc:35.5, apy:'—', earned:'−$82.10', dir:'dn' },
    { protocol:'Uniswap V3', abbr:'Uni', type:'USDC/ETH 0.05%', value:'$605.24', alloc:12.5, apy:'18.2%', earned:'+$14.30', dir:'up' },
  ]
  
  export default function PositionTable() {
    return (
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">Current Positions</div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--t3)' }}>3 active</div>
        </div>
        <table className="pos-table">
          <thead>
            <tr>
              <th>Protocol</th>
              <th>Value</th>
              <th>Allocation</th>
              <th>APY</th>
              <th>P&L</th>
            </tr>
          </thead>
          <tbody>
            {POSITIONS.map((p) => (
              <tr key={p.protocol}>
                <td>
                  <div className="proto-cell">
                    <div className="proto-mark">{p.abbr}</div>
                    <div>
                      <div className="proto-name">{p.protocol}</div>
                      <div className="proto-type">{p.type}</div>
                    </div>
                  </div>
                </td>
                <td><span className="val-mono">{p.value}</span></td>
                <td>
                  <div className="bar-cell">
                    <div className="bar-track"><div className="bar-fill" style={{ width:`${p.alloc}%` }} /></div>
                    <span className="bar-pct">{p.alloc}%</span>
                  </div>
                </td>
                <td><span className="apy-val">{p.apy}</span></td>
                <td><span className={`pnl-tag ${p.dir}`}>{p.dir === 'up' ? '↑' : '↓'} {p.earned}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }