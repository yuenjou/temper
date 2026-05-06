import { PageSkeleton, Block, Card } from '@/components/PageSkeleton'

export default function Loading() {
  return (
    <PageSkeleton title="Measurements">
      {/* Form card */}
      <section style={{ padding: '0 20px 20px' }}>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Block h={48} radius={10} />
            <Block h={48} radius={10} />
            <Block h={52} radius={26} style={{ background: 'var(--surface-2)' }} />
          </div>
        </Card>
      </section>

      {/* History sections */}
      <section style={{ padding: '0 20px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ marginBottom: 20 }}>
            <Block h={12} w={100} radius={4} style={{ marginBottom: 12 }} />
            <div style={{ background: 'var(--surface-1)', borderRadius: 16, overflow: 'hidden' }}>
              {[0, 1].map(j => (
                <div key={j} style={{ padding: '14px 20px', borderBottom: j === 0 ? '0.5px solid var(--hairline)' : undefined, display: 'flex', justifyContent: 'space-between' }}>
                  <Block h={14} w={80} radius={4} />
                  <Block h={14} w={60} radius={4} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </PageSkeleton>
  )
}
