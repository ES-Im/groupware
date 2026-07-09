import { Card, CardContent } from '@/shared/ui/card'
import { formatOvertimeMinutes } from '../lib/formatOvertimeMinutes'
import type { MyAttendanceSummary } from '../model/attendance'

interface AttendanceSummaryCardProps {
  summary: MyAttendanceSummary | undefined
  isLoading: boolean
}

/**
 * 이달 근태 요약 지표 4종의 표시 정의(label + summary에서 표시 문자열을 뽑는 selector).
 * 초과근무는 분→"n시간 m분" 변환 규칙이 formatOvertimeMinutes 유틸에 확정돼 있어 직접 계산하지
 * 않고 그대로 소비한다(나머지 3종은 카운트라 문자열화만 한다).
 */
const SUMMARY_METRICS: {
  key: string
  label: string
  getValue: (summary: MyAttendanceSummary) => string
}[] = [
  { key: 'approved', label: '승인완료', getValue: (s) => String(s.approvedAttendanceCount) },
  { key: 'pending', label: '승인대기', getValue: (s) => String(s.pendingAttendanceCount) },
  { key: 'total', label: '전체', getValue: (s) => String(s.totalAttendanceCount) },
  { key: 'overtime', label: '초과근무', getValue: (s) => formatOvertimeMinutes(s.overtimeMinutes) },
]

/**
 * 내 월별 근태 요약 지표 카드(F304). 데이터/로딩 상태는 상위(MyAttendancePage)에서 props로 주입받는
 * 순수 뷰다. 4개 지표를 모바일 2열 → 태블릿 이상 4열 반응형 그리드로 배치한다(BoardListPage의 Card
 * 사용 톤·text-muted-foreground/tracking-tight 스케일 복제).
 *
 * 로딩 중에는 스켈레톤 바(bg-muted 토큰 기반 animate-pulse), 로딩이 끝났는데 summary가 없으면(조회
 * 실패) "-" 플레이스홀더로 표시한다.
 */
export function AttendanceSummaryCard({ summary, isLoading }: AttendanceSummaryCardProps) {
  return (
    <section aria-label="이달 근태 요약" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {SUMMARY_METRICS.map((metric) => (
        <Card key={metric.key} size="sm" className="h-fit">
          <CardContent className="flex min-w-0 flex-col gap-1.5">
            <p className="truncate text-xs text-muted-foreground">{metric.label}</p>
            {isLoading ? (
              <span className="h-7 w-16 animate-pulse rounded-md bg-muted" aria-hidden />
            ) : (
              <p className="truncate text-lg font-semibold tracking-tight tabular-nums text-foreground">
                {summary ? metric.getValue(summary) : '-'}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
