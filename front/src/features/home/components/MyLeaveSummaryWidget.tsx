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

/**
 * 내 휴가 요약 위젯(레퍼런스 dashboard-roles.html "내 휴가·근태 요약" 카드 이식 — 계획 문서 §계약상
 * 불가피한 축소에 따라 "내 휴가 요약"으로 축소했다).
 *
 * MY_EMP_LEAVE_SUMMARY 응답에는 연차 부여/사용 일수만 있고, 레퍼런스의 "이번 달 근무일수/시간"·
 * "지각·결근 횟수"에 대응하는 필드가 없어(MY_ATTENDANCE_MONTHLY_SUMMARY 실측) 표시하지 않는다
 * (계약에 없는 정보 발명 금지). 특별/보상 휴가는 계획 확정대로 이 위젯 범위에서 제외하고
 * 잔여/사용 연차 2종만 보여준다.
 */
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
