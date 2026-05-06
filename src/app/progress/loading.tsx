import { PageSkeleton, Block, Card } from '@/components/PageSkeleton'

export default function Loading() {
  return (
    <PageSkeleton title="Progress">
      {/* PRs */}
      <section style={{ padding: '0 20px 20px' }}>
        <Block h={12} w={140} radius={4} style={{ marginBottom: 12 }} />
        <div style={{ background: 'var(--surface-1)', borderRadius: 16, overflow: 'hidden' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < 3 ? '0.5px solid var(--hairline)' : undefined, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Block h={44} w={44} radius={10} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Block h={14} w={120} radius={4} />
                  <Block h={10} w={60} radius={3} />
                </div>
              </div>
              <Block h={14} w={60} radius={4} />
            </div>
          ))}
        </div>
      </section>

      {/* Muscle distribution */}
      <section style={{ padding: '0 20px 20px' }}>
        <Card>
          <Block h={12} w={140} radius={4} style={{ marginBottom: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0.7, 0.55, 0.45, 0.35, 0.35].map((w, i) => (
              <div key={i}>
                <Block h={10} w={`${w * 60}%`} radius={3} style={{ marginBottom: 6 }} />
                <Block h={4} radius={999} />
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Heatmap */}
      <section style={{ padding: '0 20px' }}>
        <Card>
          <Block h={12} w={140} radius={4} style={{ marginBottom: 16 }} />
          <Block h={84} radius={6} />
        </Card>
      </section>
    </PageSkeleton>
  )
}
