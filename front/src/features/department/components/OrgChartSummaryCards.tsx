import { Card, CardContent } from '@/shared/ui/card'

interface OrgChartSummaryCardsProps {
  totalDeptCount: number
  activeDeptCount: number
  leaderAssignedCount: number
  totalMemberCount: number
}

export function OrgChartSummaryCards({
  totalDeptCount,
  activeDeptCount,
  leaderAssignedCount,
  totalMemberCount,
}: OrgChartSummaryCardsProps) {
  const stats = [
    { label: '전체 부서', value: `${totalDeptCount}개`, hint: '조직도에 등록된 전체' },
    { label: '활성 부서', value: `${activeDeptCount}개`, hint: '즉시 운영 가능한 조직' },
    { label: '부서장 지정 완료', value: `${leaderAssignedCount}개`, hint: '리더 배정 완료 조직' },
    { label: '조회 인원', value: `${totalMemberCount}명`, hint: '부서 멤버 합계 기준' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
