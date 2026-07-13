import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

/** ScheduleCalendar가 지원하는 4개 뷰 식별자(FullCalendar view type). */
export type ScheduleViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'

const VIEW_OPTIONS: { value: ScheduleViewType; label: string }[] = [
  { value: 'dayGridMonth', label: '월' },
  { value: 'timeGridWeek', label: '주' },
  { value: 'timeGridDay', label: '일' },
  { value: 'listWeek', label: '목록' },
]

interface ScheduleToolbarProps {
  /** FullCalendar가 계산한 현재 뷰 타이틀(예: "2026년 7월"). datesSet에서 끌어올린 값. */
  title: string
  /** 현재 활성 뷰(세그먼트 버튼 선택 표시). */
  view: ScheduleViewType
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (view: ScheduleViewType) => void
}

/**
 * 캘린더 상단 커스텀 툴바(FullCalendar 기본 headerToolbar 대체).
 * 좌측 이전/다음·오늘, 중앙 타이틀, 우측 월/주/일/목록 세그먼트(shadcn ToggleGroup)로 구성한다.
 * 실제 네비게이션/뷰 전환은 부모가 FullCalendar ref.getApi()로 수행하고, 이 컴포넌트는 순수 뷰다.
 *
 * 반응형: 모바일은 세로 스택(제목 → 컨트롤 줄), sm 이상에서 한 줄로 배치한다. 세그먼트는 공간이
 * 부족하면 가로 스크롤 없이 줄바꿈되도록 flex-wrap을 허용한다.
 */
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

      {/* 세그먼트 컨트롤: muted 트랙 안에서 활성 항목만 카드색 pill(+그림자)로 떠오르게 한다. */}
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
