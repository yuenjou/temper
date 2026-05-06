import { PageSkeleton, Block, Card } from '@/components/PageSkeleton'

export default function Loading() {
  return (
    <PageSkeleton title="Profile">
      {/* Profile card */}
      <section style={{ padding: '0 20px 20px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Block h={64} w={64} radius={32} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Block h={16} w={100} radius={4} />
              <Block h={11} w={160} radius={3} />
            </div>
          </div>
        </Card>
      </section>

      {/* Stats grid */}
      <section style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[0, 1, 2].map(i => (
          <Card key={i} style={{ padding: 14 }}>
            <Block h={26} w="60%" radius={4} style={{ margin: '0 auto' }} />
            <Block h={10} w="70%" radius={3} style={{ margin: '8px auto 0' }} />
          </Card>
        ))}
      </section>

      {/* Bodyweight chart */}
      <section style={{ padding: '0 20px 20px' }}>
        <Block h={12} w={100} radius={4} style={{ marginBottom: 12 }} />
        <Card><Block h={100} radius={6} /></Card>
      </section>

      {/* PRs */}
      <section style={{ padding: '0 20px 20px' }}>
        <Block h={12} w={140} radius={4} style={{ marginBottom: 12 }} />
        <div style={{ background: 'var(--surface-1)', borderRadius: 16, overflow: 'hidden' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < 2 ? '0.5px solid var(--hairline)' : undefined, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Block h={40} w={40} radius={10} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Block h={14} w={120} radius={4} />
                  <Block h={10} w={60} radius={3} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <Block h={14} w={60} radius={4} />
                <Block h={10} w={40} radius={3} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Heatmap */}
      <section style={{ padding: '0 20px 20px' }}>
        <Block h={12} w={140} radius={4} style={{ marginBottom: 12 }} />
        <Card><Block h={80} radius={6} /></Card>
      </section>
    </PageSkeleton>
  )
}
