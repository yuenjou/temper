import { PageSkeleton, Block, Card } from '@/components/PageSkeleton'

export default function Loading() {
  return (
    <PageSkeleton title="Workout">
      {/* Start CTA */}
      <section style={{ padding: '0 20px 28px' }}>
        <Block h={52} radius={26} />
      </section>

      {/* My Routines */}
      <section style={{ padding: '0 20px 28px' }}>
        <Block h={12} w={100} radius={4} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(i => (
            <Card key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Block h={16} w={140} radius={4} />
                  <Block h={11} w={180} radius={3} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Block h={36} w={60} radius={18} />
                  <Block h={36} w={70} radius={18} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* History */}
      <section style={{ padding: '0 20px' }}>
        <Block h={12} w={70} radius={4} style={{ marginBottom: 12 }} />
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
