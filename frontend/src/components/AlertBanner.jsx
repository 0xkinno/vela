export default function AlertBanner({ type = 'info', message, agent, time }) {
    const icons = { info: '◈', warning: '⚠', success: '✓' }
    return (
      <div className={`alert-banner ${type}`}>
        <span style={{ fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>{icons[type]}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '8px' }}>{agent}</span>
          <span style={{ fontSize: '12px', lineHeight: 1.5 }}>{message}</span>
        </div>
        {time && <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', opacity: 0.7, flexShrink: 0 }}>{time}</span>}
      </div>
    )
  }