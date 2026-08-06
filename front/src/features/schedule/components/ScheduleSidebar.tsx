import type { CSSProperties } from 'react'
import { Ban, CalendarPlus, Info } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import { Separator } from '@/shared/ui/separator'
import { SCHEDULE_TYPES, type ScheduleCalendarItem, type ScheduleType } from '../model/schedule'

const TYPE_META: Record<ScheduleType, { label: string; color: string }> = {
  MANUAL: { label: '개인 일정', color: '#6366f1' },
  MEETING: { label: '회의', color: '#0ea5e9' },
  LEAVE: { label: '휴가', color: '#10b981' },
  BUSINESS_TRIP: { label: '출장', color: '#f59e0b' },
}

interface ScheduleSidebarProps {
  counts: Record<ScheduleType, number>
  visibleTypes: Set<ScheduleType>
  onToggleType: (type: ScheduleType) => void
  showCanceled: boolean
  onToggleShowCanceled: () => void
  todayItems: ScheduleCalendarItem[]
  onCreateClick: () => void
}

function toHourMinute(time: string) {
  return time.slice(0, 5)
}

export function ScheduleSidebar({
  counts,
  visibleTypes,
  onToggleType,
  showCanceled,
  onToggleShowCanceled,
  todayItems,
  onCreateClick,
}: ScheduleSidebarProps) {
  return (
    <aside className="flex flex-col gap-3.5 lg:w-[300px] lg:shrink-0 lg:self-start">
      <Card>
        <CardContent className="flex flex-col gap-1">
          <h3 className="px-1 pb-1 text-xs font-semibold tracking-wide text-muted-foreground">
            일정 유형
          </h3>
          {SCHEDULE_TYPES.map((type) => {
            const meta = TYPE_META[type]
            const inputId = `schedule-type-filter-${type}`
            return (
              <div
                key={type}
                className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-muted/60"
              >
                <Checkbox
                  id={inputId}
                  checked={visibleTypes.has(type)}
                  onCheckedChange={() => onToggleType(type)}
                  style={{ '--type-color': meta.color } as CSSProperties}
                  className="data-checked:border-[var(--type-color)] data-checked:bg-[var(--type-color)] dark:data-checked:bg-[var(--type-color)]"
                />
                <Label
                  htmlFor={inputId}
                  className="flex flex-1 items-center gap-2 font-normal text-foreground"
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="min-w-0 flex-1 truncate">{meta.label}</span>
                </Label>
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {counts[type]}
                </Badge>
              </div>
            )
          })}

          <Separator className="my-1" />

          <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-muted/60">
            <Checkbox
              id="schedule-show-canceled"
              checked={showCanceled}
              onCheckedChange={onToggleShowCanceled}
            />
            <Label
              htmlFor="schedule-show-canceled"
              className="flex flex-1 items-center gap-2 font-normal text-foreground"
            >
              <Ban className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">취소된 일정 표시</span>
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground">오늘 일정</h3>
            <Badge variant="secondary" className="tabular-nums">
              {todayItems.length}건
            </Badge>
          </div>
          {todayItems.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">오늘 예정된 일정이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {todayItems.map((item) => {
                const meta = TYPE_META[item.scheduleType]
                return (
                  <li
                    key={item.scheduleId}
                    className={cn(
                      'flex items-stretch gap-2.5 rounded-md px-1 py-1.5',
                      item.isCanceled && 'opacity-50',
                    )}
                  >
                    <span
                      aria-hidden
                      className="w-[3px] shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-sm font-medium text-foreground',
                          item.isCanceled && 'line-through',
                        )}
                      >
                        {item.isCanceled ? `[취소] ${item.title}` : item.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.isAllDay ? '종일' : toHourMinute(item.startAt)} · {meta.label}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button type="button" onClick={onCreateClick} className="w-full">
        <CalendarPlus />
        새 일정 등록
      </Button>

      <p className="flex items-start gap-2 rounded-xl bg-primary/10 p-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>회의 · 휴가 · 출장 일정은 관련 업무(전자결재·회의 예약)에서 자동으로 반영됩니다.</span>
      </p>
    </aside>
  )
}
