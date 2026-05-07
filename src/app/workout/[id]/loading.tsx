export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 120 }}>
      <div className="forge-main page-enter">

        {/* Sticky header skeleton */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(5,5,7,0.82)',
          backdropFilter: 'saturate(180%) blur(24px)',
          WebkitBackdropFilter: 'saturate(180%) blur(24px)',
          borderBottom: '0.5px solid var(--hairline)',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px',
        }}>
          <div className="forge-skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div className="forge-skeleton" style={{ width: 180, height: 32, borderRadius: 100 }} />
          </div>
          <div className="forge-skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
        </div>

        {/* Timer + sets skeleton */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div className="forge-skeleton" style={{ width: 56, height: 10, borderRadius: 4, marginBottom: 8 }} />
              <div className="forge-skeleton" style={{ width: 120, height: 48, borderRadius: 8 }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="forge-skeleton" style={{ width: 72, height: 10, borderRadius: 4, marginBottom: 8 }} />
              <div className="forge-skeleton" style={{ width: 52, height: 28, borderRadius: 6 }} />
            </div>
          </div>
        </div>

        {/* Exercise card skeleton */}
        <div style={{ padding: '16px 20px 0' }}>
          <div className="forge-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Hero */}
            <div style={{ padding: '20px', display: 'flex', gap: 16, alignItems: 'center', borderBottom: '0.5px solid var(--hairline)' }}>
              <div className="forge-skeleton" style={{ width: 76, height: 76, borderRadius: 16, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="forge-skeleton" style={{ width: 60, height: 10, borderRadius: 3, marginBottom: 8 }} />
                <div className="forge-skeleton" style={{ width: 180, height: 20, borderRadius: 5, marginBottom: 6 }} />
                <div className="forge-skeleton" style={{ width: 120, height: 12, borderRadius: 3 }} />
              </div>
            </div>
            {/* Input area */}
            <div style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="forge-skeleton" style={{ flex: 1, height: 46, borderRadius: 12 }} />
                <div className="forge-skeleton" style={{ flex: 1, height: 46, borderRadius: 12 }} />
              </div>
              <div className="forge-skeleton" style={{ height: 46, borderRadius: 12 }} />
            </div>
          </div>
        </div>

      </div>

      {/* Bottom bar skeleton */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(28,28,30,0.92)',
        backdropFilter: 'saturate(180%) blur(28px)',
        WebkitBackdropFilter: 'saturate(180%) blur(28px)',
        borderTop: '0.5px solid var(--hairline)',
      }}>
        <div className="forge-main" style={{ display: 'flex', gap: 10, padding: '12px 20px 28px' }}>
          <div className="forge-skeleton" style={{ flex: 1, height: 52, borderRadius: 26 }} />
          <div className="forge-skeleton" style={{ flex: 2, height: 52, borderRadius: 26 }} />
        </div>
      </div>
    </div>
  )
}
