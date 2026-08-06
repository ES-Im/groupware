import { Card, CardContent } from '@/shared/ui/card'
import { formatOvertimeMinutes } from '../lib/formatOvertimeMinutes'
import type { MyAttendanceSummary } from '../model/attendance'

interface AttendanceSummaryCardProps {
  summary: MyAttendanceSummary | undefined
  isLoading: boolean
}

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
