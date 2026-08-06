import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMyBusinessTripHistoryQuery } from '@/features/approval/api/useMyBusinessTripHistoryQuery'
import { getApprovalStatusBadge } from '@/features/approval/lib/approvalStatusBadge'
import { MyBusinessTripHistoryPage } from '@/features/approval/pages/MyBusinessTripHistoryPage'
import { useMyAttendanceMonthlyQuery } from '@/features/attendance/api/useMyAttendanceMonthlyQuery'
import { useMyAttendanceMonthlySummaryQuery } from '@/features/attendance/api/useMyAttendanceMonthlySummaryQuery'
import type { AttendanceItem, AttendanceStatus } from '@/features/attendance/model/attendance'
import { MyAttendancePage } from '@/features/attendance/pages/MyAttendancePage'
import { useMyLeaveHistoryQuery } from '@/features/leave/api/useMyLeaveHistoryQuery'
import { useMyLeaveSummaryQuery } from '@/features/leave/api/useMyLeaveSummaryQuery'
import { MyLeavePage } from '@/features/leave/pages/MyLeavePage'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

type OverlayKey = 'attendance' | 'leave' | 'trip'

const OVERLAY_TITLES: Record<OverlayKey, string> = {
  attendance: '내 근태',
  leave: '내 휴가',
  trip: '내 출장 이력',
}

type CalendarDayTone = 'work' | 'late' | 'half' | 'leave' | 'absent' | 'none'

const CALENDAR_TONE_CLASS: Record<CalendarDayTone, string> = {
  work: 'bg-primary text-primary-foreground',
  late: 'bg-amber-500 text-white',
  half: 'bg-violet-300 text-violet-950',
  leave: 'bg-emerald-500 text-white',
  absent: 'bg-destructive text-white',
  none: 'bg-muted text-muted-foreground',
}

const CALENDAR_LEGEND: { tone: CalendarDayTone; label: string }[] = [
  { tone: 'work', label: '정상' },
  { tone: 'late', label: '지각·조퇴' },
  { tone: 'half', label: '반차' },
  { tone: 'leave', label: '연차·병가' },
  { tone: 'absent', label: '결근' },
]

function toCalendarTone(status: AttendanceStatus | null): CalendarDayTone {
  switch (status) {
    case 'NORMAL':
      return 'work'
    case 'LATE_EARLY':
      return 'late'
    case 'HALF_DAY_LEAVE':
      return 'half'
    case 'ALL_DAY_LEAVE':
    case 'SICK_LEAVE':
      return 'leave'
    case 'ABSENT':
      return 'absent'
    default:
      return 'none'
  }
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function AttendanceMiniCalendar({ yearMonth, items }: { yearMonth: string; items: AttendanceItem[] }) {
  const statusByDate = useMemo(() => {
    const map = new Map<string, AttendanceStatus | null>()
    items.forEach((item) => map.set(item.attendanceDate, item.attendanceStatus))
    return map
  }, [items])

  const monthStart = dayjs(`${yearMonth}-01`)
  const daysInMonth = monthStart.daysInMonth()
  const leadingBlanks = monthStart.day()
  const today = dayjs().format('YYYY-MM-DD')
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const cell = monthStart.date(index + 1)
    return { day: index + 1, dateStr: cell.format('YYYY-MM-DD') }
  })

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {days.map(({ day, dateStr }) => {
          const tone = toCalendarTone(statusByDate.get(dateStr) ?? null)
          return (
            <div
              key={dateStr}
              className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold ${CALENDAR_TONE_CLASS[tone]} ${
                dateStr === today ? 'ring-2 ring-primary ring-offset-1' : ''
              }`}
            >
              {day}
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {CALENDAR_LEGEND.map(({ tone, label }) => (
          <span key={tone} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${CALENDAR_TONE_CLASS[tone].split(' ')[0]}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function StatTile({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">{value}건</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function AttendanceTabContent({ yearMonth, onOpenDetail }: { yearMonth: string; onOpenDetail: () => void }) {
  const summaryQuery = useMyAttendanceMonthlySummaryQuery({ yearMonth })
  const listQuery = useMyAttendanceMonthlyQuery({ yearMonth, page: 0, size: 100 })

  if (summaryQuery.isLoading || listQuery.isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
  }

  const items = listQuery.data?.content ?? []
  const abnormalCount = items.filter(
    (item) => item.attendanceStatus === 'LATE_EARLY' || item.attendanceStatus === 'ABSENT',
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onOpenDetail}>
          자세히 보기 →
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
        <AttendanceMiniCalendar yearMonth={yearMonth} items={items} />
        <div className="grid content-start grid-cols-2 gap-3">
          <StatTile
            label="근태 건수"
            value={summaryQuery.data?.totalAttendanceCount ?? 0}
            hint={`${yearMonth} 기준`}
          />
          <StatTile
            label="승인 대기"
            value={summaryQuery.data?.pendingAttendanceCount ?? 0}
            hint="추가 확인 필요"
          />
          <StatTile
            label="처리 완료"
            value={summaryQuery.data?.approvedAttendanceCount ?? 0}
            hint="승인 및 등록 완료"
          />
          <StatTile
            label="지각 · 결근"
            value={abnormalCount}
            hint={abnormalCount === 0 ? '이상 없음' : '확인 필요'}
          />
        </div>
      </div>
    </div>
  )
}

interface RecentEntry {
  key: string
  date: string
  title: string
  subtitle: string
  approvalStatus: string
}

function LeaveTripTabContent({
  yearMonth,
  onOpenLeaveDetail,
  onOpenTripDetail,
}: {
  yearMonth: string
  onOpenLeaveDetail: () => void
  onOpenTripDetail: () => void
}) {
  const summaryQuery = useMyLeaveSummaryQuery(dayjs(yearMonth).year())
  const leaveHistoryQuery = useMyLeaveHistoryQuery({ yearMonth })
  const tripHistoryQuery = useMyBusinessTripHistoryQuery({ yearMonth })

  const summary = summaryQuery.data
  const remainingAnnual = summary ? summary.annualBaseGrantDays - summary.annualUsedDays : 0
  const remainingSpecial = summary ? summary.specialGrantDays - summary.specialUsedDays : 0
  const remainingCompensatory = summary ? summary.compensatoryGrantDays - summary.compensatoryUsedDays : 0
  const annualPct =
    summary && summary.annualBaseGrantDays > 0
      ? Math.round((remainingAnnual / summary.annualBaseGrantDays) * 100)
      : 0

  const recentEntries: RecentEntry[] = [
    ...(leaveHistoryQuery.data ?? []).map((entry) => ({
      key: `leave-${entry.draftId}`,
      date: entry.startAt,
      title: `${entry.leaveType} (${dayjs(entry.startAt).format('M/D')}~${dayjs(entry.endAt).format('M/D')})`,
      subtitle: `연차 신청 · ${entry.requestedLeaveDays}일`,
      approvalStatus: entry.approvalStatus,
    })),
    ...(tripHistoryQuery.data ?? []).map((entry) => ({
      key: `trip-${entry.draftId}`,
      date: entry.startAt,
      title: entry.destination,
      subtitle: `출장 신청 · ${entry.purpose}`,
      approvalStatus: entry.approvalStatus,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5)

  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,240px)_1fr]">
      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">잔여 휴가</p>
          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onOpenLeaveDetail}>
            자세히 →
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="relative grid size-24 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--primary) 0% ${annualPct}%, var(--muted) ${annualPct}% 100%)`,
            }}
          >
            <div className="grid size-[68px] place-items-center rounded-full bg-card text-center">
              <span className="text-xl leading-none font-bold tabular-nums">{remainingAnnual}</span>
              <span className="mt-1 text-[10px] text-muted-foreground">잔여 일수</span>
            </div>
          </div>
          <dl className="flex-1 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-sm bg-primary" />
                연차
              </dt>
              <dd className="font-medium tabular-nums">
                {remainingAnnual} / {summary?.annualBaseGrantDays ?? 0}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-sm bg-emerald-500" />
                특별
              </dt>
              <dd className="font-medium tabular-nums">
                {remainingSpecial} / {summary?.specialGrantDays ?? 0}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-sm bg-amber-500" />
                포상
              </dt>
              <dd className="font-medium tabular-nums">
                {remainingCompensatory} / {summary?.compensatoryGrantDays ?? 0}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">최근 신청 내역</p>
          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onOpenTripDetail}>
            출장 이력 →
          </Button>
        </div>
        {recentEntries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{yearMonth} 신청 내역이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentEntries.map((entry) => {
              const badge = getApprovalStatusBadge(entry.approvalStatus)
              return (
                <li key={entry.key} className="flex items-center gap-3 py-2.5">
                  <span className="w-12 shrink-0 font-mono text-[11px] text-muted-foreground">
                    {dayjs(entry.date).format('MM-DD')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{entry.subtitle}</p>
                  </div>
                  <Badge variant={badge.variant} className="shrink-0">
                    {badge.label}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export function PersonalRecordsWidget() {
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [openOverlay, setOpenOverlay] = useState<OverlayKey | null>(null)

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
            <CardTitle>근태 · 휴가</CardTitle>
            <CardDescription>근태, 연차, 출장 등 월별 정보를 확인합니다.</CardDescription>
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
            <TabsTrigger value="leave">휴가 · 출장</TabsTrigger>
          </TabsList>
          <TabsContent value="attendance" className="pt-4">
            <AttendanceTabContent yearMonth={yearMonth} onOpenDetail={() => setOpenOverlay('attendance')} />
          </TabsContent>
          <TabsContent value="leave" className="pt-4">
            <LeaveTripTabContent
              yearMonth={yearMonth}
              onOpenLeaveDetail={() => setOpenOverlay('leave')}
              onOpenTripDetail={() => setOpenOverlay('trip')}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={openOverlay !== null} onOpenChange={(open) => !open && setOpenOverlay(null)}>
        <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto p-0 pt-10 sm:max-w-4xl">
          <DialogTitle className="sr-only">{openOverlay ? OVERLAY_TITLES[openOverlay] : ''}</DialogTitle>
          {openOverlay === 'attendance' && <MyAttendancePage />}
          {openOverlay === 'leave' && <MyLeavePage />}
          {openOverlay === 'trip' && <MyBusinessTripHistoryPage />}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
