import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

export type ScheduleViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'

const VIEW_OPTIONS: { value: ScheduleViewType; label: string }[] = [
  { value: 'dayGridMonth', label: '월' },
  { value: 'timeGridWeek', label: '주' },
  { value: 'timeGridDay', label: '일' },
  { value: 'listWeek', label: '목록' },
]

interface ScheduleToolbarProps {
  title: string
  view: ScheduleViewType
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (view: ScheduleViewType) => void
}

export function ScheduleToolbar({
  title,
  view,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: ScheduleToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="icon" onClick={onPrev} aria-label="이전 기간">
            <ChevronLeft />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={onNext} aria-label="다음 기간">
            <ChevronRight />
          </Button>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onToday}>
          오늘
        </Button>
        <h2 className="ml-1 text-base font-semibold tracking-tight sm:ml-2 sm:text-lg">{title}</h2>
      </div>

      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(next) => {
          if (next) {
            onViewChange(next as ScheduleViewType)
          }
        }}
        className="gap-0.5 self-start rounded-lg bg-muted p-[3px] sm:self-auto"
        aria-label="캘린더 보기 방식"
      >
        {VIEW_OPTIONS.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            size="sm"
            className="rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-primary data-[state=on]:shadow-sm data-[state=on]:hover:bg-card"
            aria-label={`${option.label} 보기`}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
