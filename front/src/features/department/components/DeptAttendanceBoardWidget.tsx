import { useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { useDeptAttendanceMonthlyQuery } from '@/features/attendance/api/useDeptAttendanceMonthlyQuery'
import { useDeptAttendancePendingQuery } from '@/features/attendance/api/useDeptAttendancePendingQuery'
import { getAttendanceStatusBadge } from '@/features/attendance/lib/attendanceStatusBadge'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

const RECENT_ITEMS_LIMIT = 5

const STATS_PAGE_SIZE = 100

interface RecordStat {
  label: string
  value: number
  hint: string
}

function StatGrid({ stats }: { stats: RecordStat[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{stat.value}건</p>
          <p className="text-xs text-muted-foreground">{stat.hint}</p>
        </div>
      ))}
    </div>
  )
}

function DetailLink() {
  return (
    <Link to="/attendance/dept" className="block text-right text-xs text-primary hover:underline">
      자세히 보기 →
    </Link>
  )
}

function MonthlyTabContent({ deptId, yearMonth }: { deptId: number; yearMonth: string }) {
  const monthlyQuery = useDeptAttendanceMonthlyQuery(deptId, { yearMonth, size: STATS_PAGE_SIZE })
  const rows = monthlyQuery.data?.content ?? []
  const stats = rows.reduce(
    (acc, row) => ({
      total: acc.total + row.summary.totalAttendanceCount,
      pending: acc.pending + row.summary.pendingAttendanceCount,
      approved: acc.approved + row.summary.approvedAttendanceCount,
    }),
    { total: 0, pending: 0, approved: 0 },
  )
  const recentRows = rows.slice(0, RECENT_ITEMS_LIMIT)

  return (
    <div className="space-y-4">
      {monthlyQuery.isLoading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <StatGrid
          stats={[
            { label: '부서 근태 건수', value: stats.total, hint: `${yearMonth} 기준` },
            { label: '승인 대기', value: stats.pending, hint: '추가 확인 필요' },
            { label: '처리 완료', value: stats.approved, hint: '승인 및 등록 완료' },
          ]}
        />
      )}

      {monthlyQuery.isLoading ? null : recentRows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">이번 달 근태 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {recentRows.map((row) => (
            <li
              key={row.empInfo.empId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{row.empInfo.empName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.empInfo.positionName} · 총 {row.summary.totalAttendanceCount}건
                </p>
              </div>
              <Badge variant={row.summary.pendingAttendanceCount > 0 ? 'destructive' : 'default'}>
                {row.summary.pendingAttendanceCount > 0
                  ? `대기 ${row.summary.pendingAttendanceCount}건`
                  : '승인 완료'}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <DetailLink />
    </div>
  )
}

function PendingTabContent({ deptId }: { deptId: number }) {
  const pendingQuery = useDeptAttendancePendingQuery(deptId, { size: RECENT_ITEMS_LIMIT })
  const rows = pendingQuery.data?.content ?? []
  const totalPending = pendingQuery.data?.totalElements ?? 0

  return (
    <div className="space-y-4">
      {pendingQuery.isLoading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <StatGrid stats={[{ label: '승인 대기', value: totalPending, hint: '부서 전체 기준' }]} />
      )}

      {pendingQuery.isLoading ? null : rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">승인 대기 중인 근태가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const badge = getAttendanceStatusBadge(row.attendanceInfo.attendanceStatus)
            return (
              <li
                key={row.attendanceInfo.attendanceId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{row.empInfo.empName}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.attendanceInfo.attendanceDate}</p>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </li>
            )
          })}
        </ul>
      )}

      <DetailLink />
    </div>
  )
}

interface DeptAttendanceBoardWidgetProps {
  deptId: number
}

export function DeptAttendanceBoardWidget({ deptId }: DeptAttendanceBoardWidgetProps) {
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))

  function shiftMonth(delta: number) {
    setYearMonth((prev) => dayjs(prev).add(delta, 'month').format('YYYY-MM'))
  }

  function handleYearMonthChange(value: string) {
    if (value === '') {
      return
    }
    setYearMonth(value)
  }

  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>부서 근태 보드</CardTitle>
            <CardDescription>부서원의 월별 근태 현황을 탭으로 확인합니다.</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => shiftMonth(-1)}
              aria-label="이전 달"
            >
              <ChevronLeft />
            </Button>
            <label htmlFor="dept-attendance-board-month" className="sr-only">
              조회 월
            </label>
            <Input
              id="dept-attendance-board-month"
              type="month"
              value={yearMonth}
              onChange={(event) => handleYearMonthChange(event.target.value)}
              className="w-36"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => shiftMonth(1)}
              aria-label="다음 달"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly">
          <TabsList>
            <TabsTrigger value="monthly">월별 근태</TabsTrigger>
            <TabsTrigger value="pending">승인 대기</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly" className="pt-4">
            <MonthlyTabContent deptId={deptId} yearMonth={yearMonth} />
          </TabsContent>
          <TabsContent value="pending" className="pt-4">
            <PendingTabContent deptId={deptId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
