import { useState } from 'react'
import dayjs from 'dayjs'
import { Link } from 'react-router'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { EventClickArg } from '@fullcalendar/core'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { buildCalendarRangeParams, type CalendarRangeParams } from '@/features/meeting/lib/calendarRange'
import { useScheduleCalendarQuery } from '@/features/schedule/api/useScheduleCalendarQuery'
import { mapScheduleToEvents } from '@/features/schedule/lib/mapScheduleToEvents'
import '@/features/schedule/components/scheduleCalendar.css'
import './myScheduleWidget.css'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const SCHEDULE_TYPE_LABEL: Record<string, string> = {
  MANUAL: '일정',
  MEETING: '회의',
  LEAVE: '휴가',
  BUSINESS_TRIP: '출장',
}

/**
 * 내 일정 위젯(레퍼런스 dashboard/index.tsx "로그인 사원 일정" 섹션 이식, F001 SCHEDULE_CALENDAR
 * 재사용). 사용자 지시로 리스트형에서 "월 캘린더(read-only) + 선택한 날짜 상세 카드" 구조로
 * 재구성했다(2026-07-12) — ScheduleCalendarPage의 FullCalendar 구성(dayGridMonth·ko locale·
 * scheduleCalendar.css 토큰)을 그대로 재사용하되, 이 위젯은 조회 전용이라 등록/수정/드래그
 * 이동을 전부 막는다: mapScheduleToEvents가 MANUAL 이벤트에 부여하는 editable 힌트를 홈
 * 위젯에서는 무시하고 매핑 직후 전부 editable:false로 덮어쓴다(달력 자체 editable prop만으로는
 * 이벤트별 editable:true가 우선하기 때문). 날짜 클릭/이벤트 클릭은 등록 다이얼로그를 열지 않고
 * 그 날짜를 선택해 하단 상세 카드에 반영하는 용도로만 쓴다.
 *
 * 레퍼런스는 일정에 위치(본사 5층 미팅룸 A)·참석자(운영팀, 교육팀) 텍스트를 보여주지만
 * SCHEDULE_CALENDAR 응답에는 해당 필드가 없어(scheduleId/scheduleType/title/scheduleDate/
 * startAt/endAt/isAllDay/isCanceled만 존재) 표시하지 않는다(계약에 없는 정보 발명 금지).
 */
export function MyScheduleWidget() {
  const [range, setRange] = useState<CalendarRangeParams | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState(() => dayjs().format('YYYY-MM-DD'))

  const { data } = useScheduleCalendarQuery(range)
  const items = data ?? []

  const events = mapScheduleToEvents(items).map((event) => ({
    ...event,
    editable: false,
    startEditable: false,
  }))

  const selectedDayItems = items
    .filter((item) => item.scheduleDate === selectedDate && !item.isCanceled)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))

  const today = dayjs().format('YYYY-MM-DD')

  function selectDate(dateStr: string) {
    setSelectedDate(dateStr)
  }

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-4">
            <CalendarDays />
          </span>
          <div>
            <CardTitle>내 일정</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              날짜를 선택하면 아래에서 하루 일정을 확인할 수 있습니다.
            </p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/schedules">
            일정 전체 보기
            <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="schedule-calendar overflow-hidden rounded-lg border">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={koLocale}
            headerToolbar={{ left: 'title', center: '', right: 'prev,next today' }}
            height={880}
            dayMaxEvents={2}
            editable={false}
            selectable={false}
            events={events}
            eventDisplay="block"
            datesSet={(arg) => setRange(buildCalendarRangeParams(arg.view.activeStart, arg.view.activeEnd))}
            dateClick={(arg: DateClickArg) => selectDate(arg.dateStr)}
            eventClick={(arg: EventClickArg) => selectDate(arg.event.startStr.slice(0, 10))}
            dayCellClassNames={(arg) =>
              dayjs(arg.date).format('YYYY-MM-DD') === selectedDate ? ['schedule-calendar-selected-day'] : []
            }
          />
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant={selectedDate === today ? 'default' : 'secondary'}>
              {selectedDate === today ? '오늘' : dayjs(selectedDate).format('MM월 DD일 (ddd)')}
            </Badge>
            {selectedDate === today && (
              <span className="text-sm text-muted-foreground">
                {dayjs(selectedDate).format('MM월 DD일 (ddd)')}
              </span>
            )}
          </div>
          {selectedDayItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              선택한 날짜에 일정이 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {selectedDayItems.map((item) => (
                <div key={item.scheduleId} className="flex items-start gap-3 rounded-md border p-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    {SCHEDULE_TYPE_LABEL[item.scheduleType] ?? item.scheduleType}
                  </Badge>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.isAllDay
                        ? '종일'
                        : `${dayjs(item.startAt, 'HH:mm:ss').format('HH:mm')} - ${dayjs(item.endAt, 'HH:mm:ss').format('HH:mm')}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
