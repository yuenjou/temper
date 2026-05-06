import { PageSkeleton, Block, Card } from '@/components/PageSkeleton'

export default function Loading() {
  return (
    <PageSkeleton title="Home">
      {/* Streak + Weekly ring row */}
      <section style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card><Block h={40} w="60%" radius={6} /><Block h={14} w="40%" radius={4} style={{ marginTop: 8 }} /></Card>
        <Card><Block h={56} w={56} radius={28} style={{ margin: '0 auto' }} /></Card>
      </section>

      {/* Coming soon placeholders */}
      <section style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Card><Block h={16} w="55%" radius={4} /></Card>
        <Card><Block h={16} w="65%" radius={4} /></Card>
        <Card><Block h={16} w="50%" radius={4} /></Card>
      </section>

      {/* Quick log */}
      <section style={{ padding: '0 20px 20px' }}>
        <Block h={12} w={80} radius={4} style={{ marginBottom: 12, marginLeft: 0 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[0, 1, 2].map(i => (
            <Card key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 12px' }}>
              <Block h={22} w={22} radius={11} />
              <Block h={12} w="60%" radius={4} />
            </Card>
          ))}
        </div>
      </section>

      {/* Recent workouts */}
      <section style={{ padding: '0 20px' }}>
        <Block h={12} w={120} radius={4} style={{ marginBottom: 12 }} />
        <div style={{ background: 'var(--surface-1)', borderRadius: 16, overflow: 'hidden' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < 2 ? '0.5px solid var(--hairline)' : undefined, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Block h={14} w={120} radius={4} />
                <Block h={10} w={80} radius={3} />
              </div>
              <Block h={14} w={14} radius={3} />
            </div>
          ))}
        </div>
      </section>
    </PageSkeleton>
  )
}
