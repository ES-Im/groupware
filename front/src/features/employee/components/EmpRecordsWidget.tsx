import { useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { useEmpAttendanceMonthlyQuery } from '@/features/attendance/api/useEmpAttendanceMonthlyQuery'
import { getAttendanceStatusBadge } from '@/features/attendance/lib/attendanceStatusBadge'
import { getApprovalStatusBadge, resolveApprovalStatus } from '@/features/approval/lib/approvalStatusBadge'
import { useEmpBusinessTripHistoryQuery } from '@/features/approval/api/useEmpBusinessTripHistoryQuery'
import { useEmpLeaveHistoryQuery } from '@/features/leave/api/useEmpLeaveHistoryQuery'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

/** 조회 월 기준 최근 목록에 표시할 최대 건수(PersonalRecordsWidget과 동일). */
const RECENT_ITEMS_LIMIT = 5

/** "HH:mm:ss" 또는 "HH:mm:ss.SSS" 원문에서 표시용 "HH:mm"만 자른다(AttendanceTable.formatTime과 동일 규칙). */
function formatAttendanceTime(value: string): string {
  return value.slice(0, 5)
}

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

/** approvalStatus(표시명 문자열) 배열에서 건수/대기/완료를 파생한다(leave·trip 탭 공용, PersonalRecordsWidget과 동일). */
function deriveApprovalStats(rows: { approvalStatus: string }[]) {
  const total = rows.length
  const pending = rows.filter((row) => {
    const code = resolveApprovalStatus(row.approvalStatus)
    return code === 'WAITING' || code === 'IN_PROGRESS'
  }).length
  return { total, pending, completed: total - pending }
}

function DetailLink({ to }: { to: string }) {
  return (
    <Link to={to} className="block text-right text-xs text-primary hover:underline">
      자세히 보기 →
    </Link>
  )
}

function AttendanceTabContent({
  deptId,
  empId,
  yearMonth,
}: {
  deptId: number
  empId: number
  yearMonth: string
}) {
  const query = useEmpAttendanceMonthlyQuery(deptId, empId, yearMonth, true)
  const row = query.data
  const rows = (row?.attendanceInfo ?? []).slice(0, RECENT_ITEMS_LIMIT)

  return (
    <div className="space-y-4">
      {query.isLoading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : !row ? (
        <p className="py-4 text-center text-sm text-muted-foreground">이번 달 근태 기록이 없습니다.</p>
      ) : (
        <StatGrid
          stats={[
            { label: '근태 건수', value: row.summary.totalAttendanceCount, hint: `${yearMonth} 기준` },
            { label: '승인 대기', value: row.summary.pendingAttendanceCount, hint: '추가 확인 필요' },
            { label: '처리 완료', value: row.summary.approvedAttendanceCount, hint: '승인 및 등록 완료' },
          ]}
        />
      )}

      {query.isLoading || !row ? null : rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">이번 달 근태 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((item) => {
            const badge = getAttendanceStatusBadge(item.attendanceStatus)
            return (
              <li
                key={item.attendanceId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.attendanceDate}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.startAt && `${formatAttendanceTime(item.startAt)} 출근`}
                    {item.endAt && ` / ${formatAttendanceTime(item.endAt)} 퇴근`}
                  </p>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </li>
            )
          })}
        </ul>
      )}

      <DetailLink to="/attendance/dept" />
    </div>
  )
}

function LeaveTabContent({ deptId, empId, yearMonth }: { deptId: number; empId: number; yearMonth: string }) {
  const query = useEmpLeaveHistoryQuery(deptId, empId, yearMonth, true)
  const rows = (query.data ?? []).map((row) => row.historyResponse)
  const stats = deriveApprovalStats(rows)
  const recentRows = rows.slice(0, RECENT_ITEMS_LIMIT)

  return (
    <div className="space-y-4">
      {query.isLoading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <StatGrid
          stats={[
            { label: '연차 건수', value: stats.total, hint: `${yearMonth} 기준` },
            { label: '승인 대기', value: stats.pending, hint: '추가 확인 필요' },
            { label: '처리 완료', value: stats.completed, hint: '승인 및 등록 완료' },
          ]}
        />
      )}

      {query.isLoading ? null : recentRows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">이번 달 휴가 신청 이력이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {recentRows.map((row) => {
            const { label, variant } = getApprovalStatusBadge(row.approvalStatus)
            return (
              <li
                key={row.draftId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{row.leaveType}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.startAt} ~ {row.endAt} · {row.requestedLeaveDays}일
                  </p>
                </div>
                <Badge variant={variant}>{label}</Badge>
              </li>
            )
          })}
        </ul>
      )}

      <DetailLink to="/leaves/dept" />
    </div>
  )
}

function BusinessTripTabContent({
  deptId,
  empId,
  yearMonth,
}: {
  deptId: number
  empId: number
  yearMonth: string
}) {
  const query = useEmpBusinessTripHistoryQuery(deptId, empId, yearMonth, true)
  const rows = (query.data ?? []).map((row) => row.historyResponse)
  const stats = deriveApprovalStats(rows)
  const recentRows = rows.slice(0, RECENT_ITEMS_LIMIT)

  return (
    <div className="space-y-4">
      {query.isLoading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <StatGrid
          stats={[
            { label: '출장 건수', value: stats.total, hint: `${yearMonth} 기준` },
            { label: '승인 대기', value: stats.pending, hint: '추가 확인 필요' },
            { label: '처리 완료', value: stats.completed, hint: '승인 및 등록 완료' },
          ]}
        />
      )}

      {query.isLoading ? null : recentRows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">이번 달 출장 신청 이력이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {recentRows.map((row) => {
            const { label, variant } = getApprovalStatusBadge(row.approvalStatus)
            return (
              <li
                key={row.draftId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{row.destination}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.startAt} ~ {row.endAt} · {row.purpose}
                  </p>
                </div>
                <Badge variant={variant}>{label}</Badge>
              </li>
            )
          })}
        </ul>
      )}

      <DetailLink to="/approval/business-trips/dept/history" />
    </div>
  )
}

interface EmpRecordsWidgetProps {
  /** 조회 대상 사원. */
  empId: number
  /** 조회 대상 사원의 소속 부서(부서 단위 API의 path param + "같은 부서" 서버 판정용). */
  deptId: number
}

/**
 * 사원 상세(EmployeeDetailPage) 관리용 화면의 "빨간 박스" 위젯(adapt-ui 신규).
 *
 * PersonalRecordsWidget(`/me`)과 동형 구조(월 선택 + 근태/연차/출장 3탭 + 통계 + 최근 목록)이지만,
 * 데이터 소스가 "내 이력" 대신 부서 단위 목록 API(DEPT_ATTENDANCE_MONTHLY/DEPT_LEAVE_REQUEST_HISTORY/
 * DEPT_BUSINESS_TRIP_REQUEST_HISTORY)다 — 사원 단건 이력 조회 엔드포인트가 계약에 없어 부서 목록을
 * size=100으로 가져와 대상 empId 행만 select로 골라내는 방식이다(useEmp*Query 3종 참고).
 *
 * 이 3개 API는 전부 "DEPT_MANAGER(같은 부서) 또는 ADMIN" 권한만 허용해(HR 불가), 이 위젯을 렌더할지
 * 여부(canViewRecordsBoard)는 EmployeeDetailPage(react-router-developer 담당)가 hasRequiredRole
 * (roles,'DEPT_MANAGER')로 계산해 게이팅한다 — 이 컴포넌트 자체는 방어적 권한 분기를 하지 않는다.
 */
export function EmpRecordsWidget({ empId, deptId }: EmpRecordsWidgetProps) {
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
            <CardTitle>근태·휴가·출장 조회</CardTitle>
            <CardDescription>이 사원의 근태, 연차, 출장 등 월별 정보를 탭으로 확인합니다.</CardDescription>
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
            <label htmlFor="emp-records-month" className="sr-only">
              조회 월
            </label>
            <Input
              id="emp-records-month"
              type="month"
              value={yearMonth}
              onChange={(event) => handleYearMonthChange(event.target.value)}
              className="w-36"
            />
            <Button type="button" variant="outline" size="icon-sm" onClick={() => shiftMonth(1)} aria-label="다음 달">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="attendance">
          <TabsList>
            <TabsTrigger value="attendance">근태</TabsTrigger>
            <TabsTrigger value="leave">연차</TabsTrigger>
            <TabsTrigger value="trip">출장</TabsTrigger>
          </TabsList>
          <TabsContent value="attendance" className="pt-4">
            <AttendanceTabContent deptId={deptId} empId={empId} yearMonth={yearMonth} />
          </TabsContent>
          <TabsContent value="leave" className="pt-4">
            <LeaveTabContent deptId={deptId} empId={empId} yearMonth={yearMonth} />
          </TabsContent>
          <TabsContent value="trip" className="pt-4">
            <BusinessTripTabContent deptId={deptId} empId={empId} yearMonth={yearMonth} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
