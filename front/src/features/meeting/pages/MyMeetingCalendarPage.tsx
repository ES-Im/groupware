import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMyMeetingReservationsCalendarQuery } from '../api/useMyMeetingReservationsCalendarQuery'
import { MeetingCalendar } from '../components/MeetingCalendar'
import { MeetingReservationDetailPanel } from '../components/MeetingReservationDetailPanel'
import { buildCalendarRangeParams, type CalendarRangeParams } from '../lib/calendarRange'

/**
 * P1 내 예약 캘린더 페이지(F800, ROADMAP(MEETING-ROOMS) M1 T1.4).
 * T1.2 FullCalendar 래퍼에 T1.3 조회 결과를 이벤트로 바인딩한다. 취소건(isCanceled=true)은
 * classNames(opacity-50 + line-through)로 시각 구분한다 — MeetingCalendar(T1.2)의 props를
 * 확장하지 않고 FullCalendar 표준 eventClassNames만으로 처리 가능한 최소 방식(F809도 이
 * 래퍼를 재사용하므로 래퍼 자체는 이벤트 형태에 결합시키지 않는다).
 * 이벤트 클릭·[회의 예약하기]의 라우팅은 M8 T8.1에서 배선되므로 이 페이지는 navigate 경로
 * 문자열만 준비한다(직접 URL `/meetings` 진입으로만 검증).
 */
export function MyMeetingCalendarPage() {
  const navigate = useNavigate()
  const [range, setRange] = useState<CalendarRangeParams | undefined>(undefined)
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | undefined>(undefined)
  const { data, error } = useMyMeetingReservationsCalendarQuery(range)

  useEffect(() => {
    if (!error) {
      return
    }
    handleApiError(error, { toast })
  }, [error])

  const events: EventInput[] = (data ?? []).map((item) => ({
    id: String(item.meetingId),
    title: `${item.meetingRoomName} · ${item.title} · ${item.startAt}~${item.endAt}`,
    start: `${item.meetingDate}T${item.startAt}`,
    end: `${item.meetingDate}T${item.endAt}`,
    classNames: item.isCanceled ? ['opacity-50', 'line-through'] : [],
  }))

  function handleRangeChange(nextRange: { start: Date; end: Date }) {
    setRange(buildCalendarRangeParams(nextRange.start, nextRange.end))
  }

  // 이벤트 클릭 시 상세 "페이지"로 이동하는 대신, 선택된 예약을 캘린더 아래 인라인 상세 패널로 표시한다.
  function handleEventClick(info: EventClickArg) {
    setSelectedMeetingId(Number(info.event.id))
  }

  return (
    // lg 이상에서 페이지를 main 스크롤 컨테이너 높이에 꽉 채워(lg:h-full), 아래 2컬럼 그리드가 메인
    // 영역 전체 높이를 차지하게 한다(P7 회의실 관리 상세와 동일한 flex 패턴).
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6 lg:h-full lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">내 예약 캘린더</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          내가 예약한 회의 일정을 캘린더로 확인합니다
        </p>
      </div>

      {/* lg에서 그리드가 min-h-0 flex-1로 메인 영역 전체 높이를 차지하면, align-items:stretch가 좌·우
          컬럼을 그 높이로 늘린다. 좌측 캘린더 카드는 고정 높이 대신 늘어난 카드 높이를 그대로 채우고
          (lg:h-auto lg:min-h-0 + CardContent flex-1), fillHeight 캘린더(height="100%")가 카드 하단까지
          셀을 늘려 채운다 → 화면(메인 레이아웃)이 꽉 찬다. 종전 compactCells(셀 aspect-ratio 1:1)는
          제거했다(폭에 따라 세로가 과하게 커짐).
          모바일(단일 컬럼 스택)은 그리드가 flex-1을 안 걸어 확정 높이가 없으므로, 좌측 카드에 고정
          높이(h-[440px])를 줘 height="100%"가 접히지 않게 한다.
          우측 상세 컬럼도 같은 행 높이로 stretch되며(좌측과 동일 높이), 참가자가 많아 내용이 넘치면
          컬럼 안에서만 세로 스크롤한다(lg:overflow-y-auto). 미선택 플레이스홀더는 min-h-full로 채운다. */}
      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[7fr_3fr]">
        <Card className="h-[440px] lg:h-auto lg:min-h-0">
          <CardHeader className="border-b">
            <CardTitle>내가 예약한 회의</CardTitle>
            {/* 회의 예약하기: 캘린더 카드 헤더 우측에 배치(페이지 헤더에서 이동). 라우팅 로직 유지. */}
            <CardAction>
              <Button type="button" onClick={() => navigate('/meetings/new')}>
                회의 예약하기
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1">
              <MeetingCalendar
                events={events}
                onRangeChange={handleRangeChange}
                onEventClick={handleEventClick}
                fillHeight
              />
            </div>
          </CardContent>
        </Card>

        {/* 상세 패널(공유 컴포넌트)은 그대로 두고, 페이지에서 높이만 좌측 카드와 동일하게(행 stretch)
            맞춘다. 미선택 플레이스홀더는 min-h-full로 채우고, 선택 시 2카드 스택이 넘치면 세로 스크롤한다. */}
        <div className="min-h-0 lg:overflow-y-auto lg:[&>[data-testid=reservation-detail-panel]]:min-h-full">
          <MeetingReservationDetailPanel meetingId={selectedMeetingId} />
        </div>
      </div>
    </div>
  )
}
