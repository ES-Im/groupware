import { useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { useMyAttendanceMonthlyQuery } from '@/features/attendance/api/useMyAttendanceMonthlyQuery'
import { useMyAttendanceMonthlySummaryQuery } from '@/features/attendance/api/useMyAttendanceMonthlySummaryQuery'
import { getAttendanceStatusBadge } from '@/features/attendance/lib/attendanceStatusBadge'
import { getApprovalStatusBadge, resolveApprovalStatus } from '@/features/approval/lib/approvalStatusBadge'
import { useMyBusinessTripHistoryQuery } from '@/features/approval/api/useMyBusinessTripHistoryQuery'
import { useMyLeaveHistoryQuery } from '@/features/leave/api/useMyLeaveHistoryQuery'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

/** 조회 월 기준 최근 목록에 표시할 최대 건수(요약 카드 성격이라 전체 목록은 전용 페이지로 유도). */
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

/** approvalStatus(표시명 문자열) 배열에서 건수/대기/완료를 파생한다(leave·trip 탭 공용). */
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

function AttendanceTabContent({ yearMonth }: { yearMonth: string }) {
  const summaryQuery = useMyAttendanceMonthlySummaryQuery({ yearMonth })
  const listQuery = useMyAttendanceMonthlyQuery({ yearMonth, status: undefined, page: 0, size: RECENT_ITEMS_LIMIT })
  const summary = summaryQuery.data
  const rows = listQuery.data?.content ?? []

  return (
    <div className="space-y-4">
      {summaryQuery.isLoading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : !summary ? (
        <p className="py-4 text-center text-sm text-muted-foreground">근태 요약을 불러오지 못했습니다.</p>
      ) : (
        <StatGrid
          stats={[
            { label: '근태 건수', value: summary.totalAttendanceCount, hint: `${yearMonth} 기준` },
            { label: '승인 대기', value: summary.pendingAttendanceCount, hint: '추가 확인 필요' },
            { label: '처리 완료', value: summary.approvedAttendanceCount, hint: '승인 및 등록 완료' },
          ]}
        />
      )}

      {listQuery.isLoading ? null : rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">이번 달 근태 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const badge = getAttendanceStatusBadge(row.attendanceStatus)
            return (
              <li
                key={row.attendanceId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{row.attendanceDate}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.startAt && `${formatAttendanceTime(row.startAt)} 출근`}
                    {row.endAt && ` / ${formatAttendanceTime(row.endAt)} 퇴근`}
                  </p>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </li>
            )
          })}
        </ul>
      )}

      <DetailLink to="/attendance/me" />
    </div>
  )
}

function LeaveTabContent({ yearMonth }: { yearMonth: string }) {
  const historyQuery = useMyLeaveHistoryQuery({ yearMonth })
  const rows = historyQuery.data ?? []
  const stats = deriveApprovalStats(rows)
  const recentRows = rows.slice(0, RECENT_ITEMS_LIMIT)

  return (
    <div className="space-y-4">
      {historyQuery.isLoading ? (
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

      {historyQuery.isLoading ? null : recentRows.length === 0 ? (
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

      <DetailLink to="/leaves/me" />
    </div>
  )
}

function BusinessTripTabContent({ yearMonth }: { yearMonth: string }) {
  const historyQuery = useMyBusinessTripHistoryQuery({ yearMonth })
  const rows = historyQuery.data ?? []
  const stats = deriveApprovalStats(rows)
  const recentRows = rows.slice(0, RECENT_ITEMS_LIMIT)

  return (
    <div className="space-y-4">
      {historyQuery.isLoading ? (
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

      {historyQuery.isLoading ? null : recentRows.length === 0 ? (
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

      <DetailLink to="/approval/business-trips/me/history" />
    </div>
  )
}

/**
 * "개인 기록 조회" 위젯(MyInfoPage 전용, adapt-ui 리디자인 신규).
 *
 * 근태/연차/출장 3개 도메인의 이미 존재하는 "내 이력" 쿼리 훅을 재사용해 월별 요약(건수/승인대기/
 * 처리완료)과 최근 기록 일부만 보여준다 — 전용 페이지(MyAttendancePage `/attendance/me`,
 * MyLeavePage `/leaves/me`, MyBusinessTripHistoryPage `/approval/business-trips/me/history`)와
 * 기능이 겹치지 않도록 각 탭 하단 "자세히 보기" 링크로 상세 조회는 전용 페이지에 위임한다
 * (신규 CRUD/필터 UI를 만들지 않는다).
 *
 * 연차/출장은 배열 응답(페이지네이션 없음)이라 서버가 건수/대기/완료를 내려주지 않으므로
 * `deriveApprovalStats`로 approvalStatus 표시명을 코드로 역매핑(resolveApprovalStatus)해
 * WAITING·IN_PROGRESS를 "대기"로, 나머지를 "완료"로 집계한다(근태는 서버가 MY_ATTENDANCE_MONTHLY_SUMMARY로
 * 직접 내려주므로 파생하지 않는다).
 */
export function PersonalRecordsWidget() {
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))

  function shiftMonth(delta: number) {
    setYearMonth((prev) => dayjs(prev).add(delta, 'month').format('YYYY-MM'))
  }

  /**
   * 네이티브 month 입력의 클리어 버튼으로 값이 ''가 되는 경우를 무시한다 — 그대로 반영하면
   * (1) 하위 쿼리에 yearMonth=''가 나가고 (2) 이후 shiftMonth의 dayjs('')가 "Invalid Date"를
   * 만들어 위젯이 자가복구 불가 상태로 빠진다(code-reviewer 지적).
   */
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
            <CardTitle>개인 기록 조회</CardTitle>
            <CardDescription>근태, 연차, 출장 등 월별 정보를 탭으로 확인합니다.</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="icon-sm" onClick={() => shiftMonth(-1)} aria-label="이전 달">
              <ChevronLeft />
            </Button>
            <label htmlFor="personal-records-month" className="sr-only">
              조회 월
            </label>
            <Input
              id="personal-records-month"
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
            <AttendanceTabContent yearMonth={yearMonth} />
          </TabsContent>
          <TabsContent value="leave" className="pt-4">
            <LeaveTabContent yearMonth={yearMonth} />
          </TabsContent>
          <TabsContent value="trip" className="pt-4">
            <BusinessTripTabContent yearMonth={yearMonth} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
