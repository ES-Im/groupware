import { useEffect, useState } from 'react'
import type { EventClickArg } from '@fullcalendar/core'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { MeetingCalendar } from '@/features/meeting/components/MeetingCalendar'
import { buildCalendarRangeParams, type CalendarRangeParams } from '@/features/meeting/lib/calendarRange'
import { useScheduleCalendarQuery } from '../api/useScheduleCalendarQuery'
import { ScheduleCreateDialog } from '../components/ScheduleCreateDialog'
import { ScheduleDetailDialog } from '../components/ScheduleDetailDialog'
import { mapScheduleToEvents } from '../lib/mapScheduleToEvents'
import type { ScheduleType } from '../model/schedule'

type TypeFilter = ScheduleType | 'ALL'

const TYPE_FILTER_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'MANUAL', label: '수기 일정' },
  { value: 'MEETING', label: '회의' },
  { value: 'LEAVE', label: '휴가' },
  { value: 'BUSINESS_TRIP', label: '출장' },
]

/**
 * 통합 일정 캘린더 페이지(F001, ROADMAP(SCHEDULE) T1.4, P1).
 * meeting 도메인의 MeetingCalendar(FullCalendar 제네릭 래퍼)·buildCalendarRangeParams를
 * 도메인 간 그대로 재사용한다(PRD·ROADMAP상 재구축 금지, shared 승격은 3번째 소비 도메인
 * 등장 시 별도 논의). scheduleType 필터는 서버 재요청 없이 클라이언트에서 이벤트 배열을
 * 걸러 표시한다. 이벤트 클릭(M2 T2.3)은 ScheduleDetailDialog(T2.2)를, [일정 등록] 버튼
 * (M3 T3.4)은 ScheduleCreateDialog(T3.3)를 오픈한다 — 등록 성공 시 캘린더 갱신(쿼리
 * invalidate)·토스트·다이얼로그 닫기는 전부 ScheduleCreateDialog 내부 책임이라 이 페이지는
 * open state만 소유한다.
 */
export function ScheduleCalendarPage() {
  const [range, setRange] = useState<CalendarRangeParams | undefined>(undefined)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [selectedScheduleId, setSelectedScheduleId] = useState<number>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { data, error } = useScheduleCalendarQuery(range)

  useEffect(() => {
    if (!error) {
      return
    }
    handleApiError(error, { toast })
  }, [error])

  const events = mapScheduleToEvents(data ?? []).filter(
    (event) => typeFilter === 'ALL' || event.extendedProps?.scheduleType === typeFilter,
  )

  function handleRangeChange(nextRange: { start: Date; end: Date }) {
    setRange(buildCalendarRangeParams(nextRange.start, nextRange.end))
  }

  function handleEventClick(clickInfo: EventClickArg) {
    setSelectedScheduleId(Number(clickInfo.event.id))
    setDetailOpen(true)
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">일정 캘린더</h1>
      </div>

      {/* Ubold 캘린더 화면의 좌측 필터 패널 + 우측 캘린더 2컬럼 레이아웃을 이식한다.
          모바일은 세로 스택, lg 이상에서 고정폭 사이드 + 유동폭 캘린더로 나눈다. */}
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-6">
        <aside className="flex flex-col gap-4">
          <Button type="button" className="w-full" onClick={() => setCreateOpen(true)}>
            일정 등록
          </Button>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">일정 유형</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {TYPE_FILTER_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={typeFilter === option.value ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setTypeFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <p className="rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            회의·휴가·출장 일정은 관련 업무에서 자동으로 반영됩니다.
          </p>
        </aside>

        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle>일정</CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingCalendar events={events} onRangeChange={handleRangeChange} onEventClick={handleEventClick} />
          </CardContent>
        </Card>
      </div>

      <ScheduleDetailDialog scheduleId={selectedScheduleId} open={detailOpen} onOpenChange={setDetailOpen} />
      <ScheduleCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
