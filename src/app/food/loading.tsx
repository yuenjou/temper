import { PageSkeleton, Block, Card } from '@/components/PageSkeleton'

export default function Loading() {
  return (
    <PageSkeleton title="Food">
      {/* Nutrition strip */}
      <section style={{ padding: '0 20px 24px' }}>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Block h={22} w="50%" radius={4} />
                <Block h={10} w="80%" radius={3} />
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Meals */}
      <section style={{ padding: '0 20px 24px' }}>
        <Block h={12} w={50} radius={4} style={{ marginBottom: 16 }} />
        {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => (
          <div key={meal} style={{ marginBottom: 16 }}>
            <Block h={11} w={70} radius={3} style={{ marginBottom: 8 }} />
            <Card><Block h={14} w="60%" radius={4} /></Card>
          </div>
        ))}
      </section>
    </PageSkeleton>
  )
}
