import dayjs from 'dayjs'
import { Link } from 'react-router'
import { ArrowRight, CalendarRange } from 'lucide-react'
import { useMyLeaveSummaryQuery } from '@/features/leave/api/useMyLeaveSummaryQuery'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

function LeaveKpiTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {value}
        <span className="ml-0.5 text-sm font-medium text-muted-foreground">일</span>
      </p>
    </div>
  )
}

export function MyLeaveSummaryWidget() {
  const { data } = useMyLeaveSummaryQuery()
  const remainingAnnual = data ? data.annualBaseGrantDays - data.annualUsedDays : 0

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-4">
            <CalendarRange />
          </span>
          <div>
            <CardTitle>내 휴가 요약</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{dayjs().format('YYYY')}년 기준 연차</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/leaves/me">
            상세 보기
            <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <LeaveKpiTile label="잔여 연차" value={remainingAnnual} />
          <LeaveKpiTile label="사용 연차" value={data?.annualUsedDays ?? 0} />
        </div>
      </CardContent>
    </Card>
  )
}
