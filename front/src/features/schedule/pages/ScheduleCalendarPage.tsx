import { useEffect, useMemo, useRef, useState } from 'react'
import type FullCalendar from '@fullcalendar/react'
import type { DatesSetArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
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
    setCreateDefaultStart(dayjs(arg.date).format('YYYY-MM-DDTHH:mm'))
    setCreateOpen(true)
  }

  function handleEventClick(arg: EventClickArg) {
    setSelectedScheduleId(Number(arg.event.id))
    setDetailOpen(true)
  }

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
    <div className="flex w-full flex-col p-4 sm:p-6 lg:h-full lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">일정 캘린더</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          개인 · 회의 · 휴가 · 출장 일정을 한 화면에서 관리하세요
        </p>
      </header>

      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row">
        <ScheduleSidebar
          counts={counts}
          visibleTypes={visibleTypes}
          onToggleType={toggleType}
          todayItems={todayItems}
          showCanceled={showCanceled}
          onToggleShowCanceled={() => setShowCanceled((prev) => !prev)}
          onCreateClick={openCreate}
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
