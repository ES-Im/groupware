import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useScheduleCalendarQuery } from '@/features/schedule/api/useScheduleCalendarQuery'
import type { ScheduleType } from '@/features/schedule/model/schedule'
import { cn } from '@/shared/lib/utils'
import { Calendar } from '@/shared/ui/calendar'

type RailScheduleType = 'MANUAL' | 'BUSINESS_TRIP' | 'LEAVE'

const RAIL_SCHEDULE_DOT_CLASS: Record<RailScheduleType, string> = {
  MANUAL: 'bg-fuchsia-500',
  BUSINESS_TRIP: 'bg-blue-500',
  LEAVE: 'bg-green-500',
}

function isRailScheduleType(value: ScheduleType): value is RailScheduleType {
  return value === 'MANUAL' || value === 'BUSINESS_TRIP' || value === 'LEAVE'
}

export function RailMiniCalendar() {
  const [month, setMonth] = useState(new Date())

  const rangeStart = dayjs(month).startOf('month').format('YYYY-MM-DDTHH:mm:ss')
  const rangeEnd = dayjs(month).endOf('month').format('YYYY-MM-DDTHH:mm:ss')
  const calendarQuery = useScheduleCalendarQuery({ start: rangeStart, end: rangeEnd })

  const eventsByDate = useMemo(() => {
    const map = new Map<string, RailScheduleType[]>()
    for (const item of calendarQuery.data ?? []) {
      if (item.isCanceled || !isRailScheduleType(item.scheduleType)) {
        continue
      }
      const existing = map.get(item.scheduleDate) ?? []
      if (!existing.includes(item.scheduleType)) {
        existing.push(item.scheduleType)
      }
      map.set(item.scheduleDate, existing)
    }
    return map
  }, [calendarQuery.data])

  return (
    <Calendar
      month={month}
      onMonthChange={setMonth}
      className="mx-auto w-full bg-transparent p-0 text-primary-foreground dark:text-card-foreground"
      classNames={{
        month_grid: 'w-full border-collapse border-t border-l border-primary-foreground/30 dark:border-card-foreground/30',
        weekdays: 'flex w-full',
        weekday:
          'flex-1 border-r border-b border-primary-foreground/30 py-1 text-[0.7rem] font-normal text-primary-foreground/60 select-none dark:border-card-foreground/30 dark:text-card-foreground/60',
        week: 'flex w-full',
        day: 'group/day relative min-h-10 flex-1 border-r border-b border-primary-foreground/30 p-0 text-center select-none dark:border-card-foreground/30',
        today: 'bg-primary-foreground/15 dark:bg-card-foreground/15',
      }}
      components={{
        Day: ({ day, modifiers, children, ...tdProps }) => {
          const dateKey = dayjs(day.date).format('YYYY-MM-DD')
          const types = eventsByDate.get(dateKey)
          return (
            <td {...tdProps}>
              <div className="pt-1 text-center">{children}</div>
              {types && types.length > 0 && (
                <span className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center gap-1">
                  {types.map((type) => (
                    <span key={type} className={cn('size-1.5 rounded-full', RAIL_SCHEDULE_DOT_CLASS[type])} />
                  ))}
                </span>
              )}
            </td>
          )
        },
      }}
    />
  )
}
