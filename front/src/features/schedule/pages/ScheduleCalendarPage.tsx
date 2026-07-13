import { useEffect, useMemo, useRef, useState } from 'react'
import type FullCalendar from '@fullcalendar/react'
import type { DatesSetArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { buildCalendarRangeParams, type CalendarRangeParams } from '@/features/meeting/lib/calendarRange'
import { useScheduleCalendarQuery } from '../api/useScheduleCalendarQuery'
import { useUpdateManualScheduleMutation } from '../api/useUpdateManualScheduleMutation'
import { ScheduleCalendar } from '../components/ScheduleCalendar'
import { ScheduleCreateDialog } from '../components/ScheduleCreateDialog'
import { ScheduleDetailDialog } from '../components/ScheduleDetailDialog'
import { ScheduleSidebar } from '../components/ScheduleSidebar'
import { ScheduleToolbar, type ScheduleViewType } from '../components/ScheduleToolbar'
import { mapScheduleToEvents } from '../lib/mapScheduleToEvents'
import { SCHEDULE_TYPES, type ScheduleType } from '../model/schedule'
import { scheduleKeys } from '../model/scheduleKeys'

/**
 * 통합 일정 캘린더 페이지(F001). Ubold calendar 화면을 shadcn/ui로 재해석해 "좌측 보조 패널 +
 * 우측 캘린더(커스텀 툴바 + FullCalendar 4개 뷰)" 2컬럼으로 구성한다.
 *
 * 아키텍처: FullCalendar 인스턴스 ref를 이 페이지가 소유하고, 커스텀 툴바(ScheduleToolbar)의
 * 이전/다음/오늘/뷰전환 요청을 ref.getApi()로 위임한다. datesSet 콜백 하나로 (1)서버 range 재요청,
 * (2)툴바 타이틀, (3)활성 뷰 세그먼트를 동시에 동기화한다. scheduleType 필터는 서버 재요청 없이
 * 클라이언트에서 이벤트를 걸러 표시하며, 각 유형을 독립 토글하는 다중선택 Set으로 관리한다.
 * 유형별 개수·오늘 일정 요약은 현재 로드된 range 데이터 기준으로 집계한다.
 *
 * 상세/등록 다이얼로그의 데이터·검증·invalidate는 각 다이얼로그 내부 책임이라 이 페이지는 open
 * state와 선택된 scheduleId, 등록 프리필 기본값만 소유한다. 드래그 이동(eventDrop)만 예외로 이
 * 페이지가 mutation을 호출하고 실패 시 revert 한다(캘린더 인스턴스와 직접 맞물리는 동작이라 페이지가 배선).
 */
export function ScheduleCalendarPage() {
  const queryClient = useQueryClient()
  const calendarRef = useRef<FullCalendar | null>(null)
  const [range, setRange] = useState<CalendarRangeParams | undefined>(undefined)
  const [title, setTitle] = useState('')
  const [view, setView] = useState<ScheduleViewType>('dayGridMonth')
  const [visibleTypes, setVisibleTypes] = useState<Set<ScheduleType>>(() => new Set(SCHEDULE_TYPES))
  const [showCanceled, setShowCanceled] = useState(true)
  const [selectedScheduleId, setSelectedScheduleId] = useState<number>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createDefaultStart, setCreateDefaultStart] = useState<string>()

  const { data, error } = useScheduleCalendarQuery(range)
  const updateMutation = useUpdateManualScheduleMutation()

  useEffect(() => {
    if (!error) {
      return
    }
    handleApiError(error, { toast })
  }, [error])

  const items = data ?? []

  // 유형별 개수 배지는 취소된 일정을 세지 않는다 — "이 유형에 유효한 일정이 몇 건인지"를 보여주는
  // 배지라 취소 건은 실질적으로 존재하지 않는 일정과 같다(showCanceled 토글과 무관하게 항상 제외).
  const counts = useMemo(() => {
    const base: Record<ScheduleType, number> = { MANUAL: 0, MEETING: 0, LEAVE: 0, BUSINESS_TRIP: 0 }
    for (const item of items) {
      if (!item.isCanceled) {
        base[item.scheduleType] += 1
      }
    }
    return base
  }, [items])

  const todayItems = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return items.filter((item) => item.scheduleDate === today && (showCanceled || !item.isCanceled))
  }, [items, showCanceled])

  const events = useMemo(
    () =>
      mapScheduleToEvents(items).filter((event) => {
        const props = event.extendedProps
        return visibleTypes.has(props?.scheduleType as ScheduleType) && (showCanceled || !props?.isCanceled)
      }),
    [items, visibleTypes, showCanceled],
  )

  function handleDatesSet(arg: DatesSetArg) {
    setRange(buildCalendarRangeParams(arg.view.activeStart, arg.view.activeEnd))
    setTitle(arg.view.title)
    setView(arg.view.type as ScheduleViewType)
  }

  function toggleType(type: ScheduleType) {
    setVisibleTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  function openCreate() {
    setCreateDefaultStart(undefined)
    setCreateOpen(true)
  }

  function handleDateClick(arg: DateClickArg) {
    // 클릭한 날짜/슬롯을 시작 일시 기본값으로 프리필해 등록 다이얼로그를 연다.
    setCreateDefaultStart(dayjs(arg.date).format('YYYY-MM-DDTHH:mm'))
    setCreateOpen(true)
  }

  function handleEventClick(arg: EventClickArg) {
    setSelectedScheduleId(Number(arg.event.id))
    setDetailOpen(true)
  }

  // MANUAL 미취소 이벤트만 draggable(mapScheduleToEvents 힌트) — 실제 소유자 판정은 서버가 한다.
  // 타임존 변환 없이 naive wall-clock 시각(HH:mm:ss)만 SINGLE 스코프로 보내고, 실패 시 원위치로 되돌린다.
  function handleEventDrop(arg: EventDropArg) {
    const start = arg.event.start
    if (!start) {
      arg.revert()
      return
    }
    const end = arg.event.end ?? start
    const startAt = dayjs(start).format('HH:mm:ss')
    const endAt = dayjs(end).format('HH:mm:ss')
    updateMutation.mutate(
      { scheduleId: Number(arg.event.id), payload: { startAt, endAt }, scope: 'SINGLE' },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: scheduleKeys.calendar() })
          toast.success('일정을 이동했습니다')
        },
        onError: (mutationError) => {
          handleApiError(mutationError, { toast })
          arg.revert()
        },
      },
    )
  }

  return (
    // lg 이상에서 페이지를 main 스크롤 컨테이너 높이(헤더~푸터 사이)에 꽉 채워, 우측 캘린더 카드가
    // 남는 높이 전체를 차지하게 한다(BoardListPage와 동일 패턴). 좌측 사이드바는 h-fit으로 그리드/
    // flex 기본 stretch를 눌러 콘텐츠 높이만큼만 차지한다.
    <div className="flex w-full flex-col p-4 sm:p-6 lg:h-full lg:p-8">
      {/* 페이지 헤더: 좌측 타이틀+부제, 우측 등록 버튼(모바일은 세로 스택). 버튼 로직은 페이지 소유. */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">일정 캘린더</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            개인 · 회의 · 휴가 · 출장 일정을 한 화면에서 관리하세요
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="sm:shrink-0">
          <CalendarPlus />
          새 일정 등록
        </Button>
      </header>

      {/* mobile-first: 세로 1열 → lg 이상에서 300px 고정 좌측 패널 + 유동폭 우측 캘린더. */}
      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row">
        <ScheduleSidebar
          counts={counts}
          visibleTypes={visibleTypes}
          onToggleType={toggleType}
          todayItems={todayItems}
          showCanceled={showCanceled}
          onToggleShowCanceled={() => setShowCanceled((prev) => !prev)}
        />

        <Card className="flex min-w-0 flex-col gap-0 py-0 lg:min-h-0 lg:flex-1">
          <CardHeader className="border-b p-4">
            <ScheduleToolbar
              title={title}
              view={view}
              onPrev={() => calendarRef.current?.getApi().prev()}
              onNext={() => calendarRef.current?.getApi().next()}
              onToday={() => calendarRef.current?.getApi().today()}
              onViewChange={(next) => calendarRef.current?.getApi().changeView(next)}
            />
          </CardHeader>
          <CardContent className="min-w-0 p-4 lg:min-h-0 lg:flex-1">
            <ScheduleCalendar
              calendarRef={calendarRef}
              events={events}
              onDatesSet={handleDatesSet}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              onEventDrop={handleEventDrop}
            />
          </CardContent>
        </Card>
      </div>

      <ScheduleDetailDialog scheduleId={selectedScheduleId} open={detailOpen} onOpenChange={setDetailOpen} />
      <ScheduleCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStartAt={createDefaultStart}
      />
    </div>
  )
}
