import { useEffect, useState } from 'react'
import type { EventClickArg } from '@fullcalendar/core'
import { CalendarClock, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMeetingRoomReservationsCalendarQuery } from '../api/useMeetingRoomReservationsCalendarQuery'
import type { MeetingRoomReservationCalendarItem } from '../model/meeting'
import { MeetingCalendar } from './MeetingCalendar'
import { buildCalendarRangeParams, type CalendarRangeParams } from '../lib/calendarRange'
import { mapMeetingRoomReservationsToEvents } from '../lib/mapMeetingRoomReservationsToEvents'

interface MeetingRoomReservationCalendarBlockProps {
  meetingRoomId: number
}

/** "HH:mm:ss"(또는 "HH:mm") 시간 문자열을 "HH:mm"으로 다듬는다. 초 단위는 표시하지 않는다. */
function toHourMinute(time: string): string {
  return time.slice(0, 5)
}

/**
 * 회의실 예약(점유) 캘린더 공유 블록(ROADMAP(MEETING-ROOMS) T2.4-b, F809).
 *
 * `meetingRoomId` props만으로 독립 렌더 가능 — P4(T2.4-b)·P7(M7 T7.2)이 공유 소비한다.
 * 응답에 `meetingId`가 없어(model/meeting.ts 주석 참고) 상세로 이동시킬 식별자가 없으므로 이벤트를
 * 상세 화면으로 링크하지는 않지만, 이벤트를 클릭하면 카드 하단에 그 예약 요약(예약자·부서·시간·
 * 참여자 수)을 인라인으로 보여준다(사용자 요청). 회의 제목은 응답에 없어(타 부서 비공개 정책)
 * 표시하지 않는다. 월을 이동하면(range 변경) 선택을 해제한다.
 */
export function MeetingRoomReservationCalendarBlock({ meetingRoomId }: MeetingRoomReservationCalendarBlockProps) {
  const [range, setRange] = useState<CalendarRangeParams | undefined>(undefined)
  const [selectedReservation, setSelectedReservation] = useState<MeetingRoomReservationCalendarItem | null>(null)
  const { data, error } = useMeetingRoomReservationsCalendarQuery(meetingRoomId, range)

  // 회의실 자체의 not-found는 형제 블록(MeetingRoomInfoPanel)이 이미 안내하므로, 여기서는
  // 그 외 실패만 토스트로 알린다. MeetingCalendar는 항상 마운트해 range 변경(=새 queryKey)에
  // 따른 재조회 중에도 리마운트되지 않게 한다(MyMeetingCalendarPage와 동일 패턴 — 리마운트되면
  // FullCalendar가 initialDate 없이 현재 월로 리셋돼 월 이동이 막힌다).
  useEffect(() => {
    if (!error) {
      return
    }
    const apiError = normalizeApiError(error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [error])

  function handleRangeChange(nextRange: { start: Date; end: Date }) {
    setRange(buildCalendarRangeParams(nextRange.start, nextRange.end))
    // 다른 달로 이동하면 이전 달의 선택 예약은 더 이상 화면에 없으므로 조회 카드를 닫는다.
    setSelectedReservation(null)
  }

  function handleEventClick(info: EventClickArg) {
    // mapMeetingRoomReservationsToEvents가 원본 항목 전체를 extendedProps로 실어 두었다.
    setSelectedReservation(info.event.extendedProps as MeetingRoomReservationCalendarItem)
  }

  return (
    // 이 카드는 P4/P7 상세 페이지에서 좌측 병합 카드와 같은 grid 행에 놓여 stretch로 높이가 균일해진다
    // (grid 셀 확정 높이). 그 높이를 캘린더가 그대로 채우도록 CardContent를 세로 flex로 만들고 캘린더
    // 영역을 flex-1로 늘린다 → MeetingCalendar fillHeight(height="100%")가 카드 하단까지 채운다
    // (종전 height="auto"는 달의 주(week) 수에 따라 카드보다 넘치거나 아래에 여백이 생겼다). lg 미만은
    // 그리드가 grid-cols-1로 스택되어 카드가 콘텐츠 높이라 확정 높이가 없으므로, 캘린더 영역에 고정
    // 높이(max-lg:h-[26rem])를 줘 height="100%"가 접히지 않게 한다.
    <Card className="lg:min-h-0">
      <CardHeader className="border-b">
        <CardTitle>기간별 예약 현황</CardTitle>
        <CardDescription>타 부서 예약은 점유 시간대만 표시되며 제목은 공개되지 않습니다.</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="min-h-0 max-lg:h-[26rem] lg:flex-1">
          <MeetingCalendar
            events={mapMeetingRoomReservationsToEvents(data ?? [])}
            onRangeChange={handleRangeChange}
            onEventClick={handleEventClick}
            fillHeight
          />
        </div>
        {/* 선택한 예약 요약: 캘린더 이벤트를 클릭하면 카드 하단에 나타난다(사용자 요청). 제목은
            응답에 없어(비공개) 예약자·시간·참여자만 보여준다. shrink-0으로 캘린더 flex-1에 눌리지 않게 한다. */}
        {selectedReservation && (
          <div className="shrink-0 rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">선택한 예약</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="예약 요약 닫기"
                onClick={() => setSelectedReservation(null)}
              >
                <X />
              </Button>
            </div>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">예약자</dt>
                <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {selectedReservation.reserverDeptName} · {selectedReservation.reserverEmpName}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" />
                  예약 시간
                </dt>
                <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {selectedReservation.meetingDate} {toHourMinute(selectedReservation.startAt)}
                  {' ~ '}
                  {toHourMinute(selectedReservation.endAt)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  참여자
                </dt>
                <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {selectedReservation.participantCount}명
                </dd>
              </div>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
