import NavBar from './NavBar'

function Block({ w = '100%', h = 18, radius = 8, style }: { w?: string | number; h?: number; radius?: number; style?: React.CSSProperties }) {
  return (
    <div className="forge-skeleton" style={{
      width: w, height: h, borderRadius: radius,
      ...style,
    }} />
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--surface-1)', borderRadius: 16,
      padding: 20, boxShadow: 'var(--shadow-card)',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function PageSkeleton({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="forge-main page-enter" style={{ minHeight: '100vh', paddingBottom: 120 }}>
        <section style={{ padding: '20px 24px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{title}</h1>
        </section>
        {children}
      </main>
    </>
  )
}

export { Block, Card }
