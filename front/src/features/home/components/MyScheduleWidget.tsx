import dayjs from 'dayjs'
import { Link } from 'react-router'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { buildCalendarRangeParams } from '@/features/meeting/lib/calendarRange'
import { useScheduleCalendarQuery } from '@/features/schedule/api/useScheduleCalendarQuery'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'

const SCHEDULE_TYPE_LABEL: Record<string, string> = {
  MANUAL: '일정',
  MEETING: '회의',
  LEAVE: '휴가',
  BUSINESS_TRIP: '출장',
}

const TODAY_RANGE = buildCalendarRangeParams(dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate())

export function MyScheduleWidget() {
  const { data } = useScheduleCalendarQuery(TODAY_RANGE)
  const todayItems = (data ?? [])
    .filter((item) => !item.isCanceled)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))

  return (
    <Card className="h-[420px]">
      <CardHeader className="flex shrink-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-4">
          <CalendarDays />
        </span>
        <div className="min-w-0">
          <CardTitle className="truncate">오늘 일정</CardTitle>
          <p className="mt-1 truncate text-sm text-muted-foreground">{dayjs().format('M월 D일 (ddd)')}</p>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {todayItems.length === 0 ? (
          <p className="flex flex-1 items-center justify-center py-10 text-center text-sm text-muted-foreground">
            오늘 일정이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col">
            {todayItems.map((item) => (
              <div
                key={item.scheduleId}
                className="flex items-stretch gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0"
              >
                <time className="w-12 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
                  {item.isAllDay ? '종일' : dayjs(item.startAt, 'HH:mm:ss').format('HH:mm')}
                </time>
                <span className="w-1 shrink-0 rounded-full bg-primary/60" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{item.title}</p>
                    <Badge variant="outline" className="shrink-0">
                      {SCHEDULE_TYPE_LABEL[item.scheduleType] ?? item.scheduleType}
                    </Badge>
                  </div>
                  {!item.isAllDay && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {dayjs(item.startAt, 'HH:mm:ss').format('HH:mm')} -{' '}
                      {dayjs(item.endAt, 'HH:mm:ss').format('HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Link
          to="/schedules"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          전체 보기
          <ArrowRight className="size-3.5" />
        </Link>
      </CardFooter>
    </Card>
  )
}
