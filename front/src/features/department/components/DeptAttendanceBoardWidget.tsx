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

/** 위젯 미리보기에 표시할 최대 건수(요약 카드 성격이라 전체 목록은 전용 페이지로 유도). */
const RECENT_ITEMS_LIMIT = 5

/**
 * 부서 전원의 월별 요약(summary)을 정확히 합산하기 위한 조회 size. `DEPT_ATTENDANCE_MONTHLY`는
 * 요약 전용 엔드포인트가 없어(useEmpForManagementQuery와 동일 이유) 넉넉한 size로 한 페이지에
 * 부서 전원을 담아 그 content를 합산하는 방식으로 통계를 파생한다.
 */
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
  /** 위젯이 조회할 부서. 상위(DepartmentMembersPage)가 이미 도출한 deptId를 그대로 주입받는다 —
   * attendance 도메인의 usePrimaryDeptId(엄격 판정)와 department 도메인의 getPrimaryDeptId(폴백 허용)가
   * 서로 다른 정책을 쓰므로, 이 위젯은 어느 쪽도 재도출하지 않고 상위가 이미 확정한 값만 신뢰한다. */
  deptId: number
}

/**
 * "부서 근태 보드" 위젯(DepartmentDetailView 전용, adapt-ui 신규).
 *
 * `/me`의 PersonalRecordsWidget과 동형 구조: 월 선택(prev/next+input) + 탭(월별 근태/승인 대기,
 * DeptAttendancePage와 동일 2탭 구성) + 요약 통계 + 최근 목록. 별도 부서 근태 요약 API가 없어
 * (계약에 DEPT_ATTENDANCE_MONTHLY_SUMMARY 같은 엔드포인트 없음) 이미 존재하는 목록 조회 훅
 * (useDeptAttendanceMonthlyQuery/useDeptAttendancePendingQuery, DeptAttendancePage가 이미 소비 중)의
 * content를 그대로 재사용해 통계를 파생한다. 신규 CRUD/필터 UI는 만들지 않고, 상세 조회는
 * 전용 페이지(`/attendance/dept`)로 유도한다.
 */
export function DeptAttendanceBoardWidget({ deptId }: DeptAttendanceBoardWidgetProps) {
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))

  function shiftMonth(delta: number) {
    setYearMonth((prev) => dayjs(prev).add(delta, 'month').format('YYYY-MM'))
  }

  // 네이티브 month 입력의 클리어로 값이 ''가 되는 경우를 무시한다(PersonalRecordsWidget과 동일한
  // 이유 — dayjs('')가 Invalid Date를 만들어 위젯이 자가복구 불가 상태로 빠지는 것을 방지).
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
