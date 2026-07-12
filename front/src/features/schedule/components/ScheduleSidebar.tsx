import type { ComponentType, CSSProperties } from 'react'
import { Ban, Briefcase, CalendarDays, CalendarPlus, Info, Palmtree, Users } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import { Separator } from '@/shared/ui/separator'
import { SCHEDULE_TYPES, type ScheduleCalendarItem, type ScheduleType } from '../model/schedule'

/**
 * 일정 유형 표시 메타(라벨·아이콘·인디케이터 색).
 * 인디케이터 색은 시맨틱 토큰으로 표현할 수 없는 범주형 색이라 vivid -500 톤을 인라인으로 쓴다 —
 * 라이트/다크 카드 배경 모두에서 대비가 확보되는 값으로 고른다(캘린더 이벤트 색과 결을 맞춘 계열).
 */
const TYPE_META: Record<
  ScheduleType,
  { label: string; Icon: ComponentType<{ className?: string; style?: CSSProperties }>; color: string }
> = {
  MANUAL: { label: '개인 일정', Icon: CalendarDays, color: '#6366f1' },
  MEETING: { label: '회의', Icon: Users, color: '#0ea5e9' },
  LEAVE: { label: '휴가', Icon: Palmtree, color: '#10b981' },
  BUSINESS_TRIP: { label: '출장', Icon: Briefcase, color: '#f59e0b' },
}

interface ScheduleSidebarProps {
  /** [새 일정 등록] 클릭 — 등록 다이얼로그 오픈(로직은 페이지 소유). */
  onCreate: () => void
  /** 현재 로드된 range 데이터 기준 유형별 개수. */
  counts: Record<ScheduleType, number>
  /** 캘린더에 표시 중인 유형 집합(체크된 것만 노출). */
  visibleTypes: Set<ScheduleType>
  onToggleType: (type: ScheduleType) => void
  /** 취소된 일정도 캘린더에 표시할지(해제하면 숨김, 유형 필터와 별개 축). */
  showCanceled: boolean
  onToggleShowCanceled: () => void
  /** 오늘 날짜에 해당하는 일정(현재 range 데이터에서 필터링된 결과, showCanceled 반영됨). */
  todayItems: ScheduleCalendarItem[]
}

/** 'HH:mm:ss' → 'HH:mm'(초 절삭). 종일 일정은 상위에서 '종일'로 대체 표기한다. */
function toHourMinute(time: string) {
  return time.slice(0, 5)
}

/**
 * 캘린더 좌측 보조 패널(Ubold calendar 좌측 컬럼 이식).
 * shadcn Card 하나에 [새 일정 등록] + 유형 필터(체크 토글 + 개수) + 취소 여부 필터 + 오늘 일정 요약 +
 * 안내 callout을 담는다. 데이터/상태는 전부 props 주입(순수 뷰) — 필터 토글·개수 집계·오늘 필터링은
 * 페이지가 계산해 내려준다.
 */
export function ScheduleSidebar({
  onCreate,
  counts,
  visibleTypes,
  onToggleType,
  showCanceled,
  onToggleShowCanceled,
  todayItems,
}: ScheduleSidebarProps) {
  return (
    <Card className="lg:w-[300px] lg:shrink-0">
      <CardContent className="flex flex-col gap-4">
        <Button type="button" className="w-full" onClick={onCreate}>
          <CalendarPlus />
          새 일정 등록
        </Button>

        {/* 일정 유형 필터: 각 유형 독립 토글(다중선택). 개수는 현재 로드된 range 기준. */}
        <section className="flex flex-col gap-1">
          <h3 className="px-1 pb-1 text-xs font-medium tracking-wide text-muted-foreground">일정 유형</h3>
          {SCHEDULE_TYPES.map((type) => {
            const meta = TYPE_META[type]
            const inputId = `schedule-type-filter-${type}`
            return (
              <div
                key={type}
                className="flex items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-muted/60"
              >
                <Checkbox
                  id={inputId}
                  checked={visibleTypes.has(type)}
                  onCheckedChange={() => onToggleType(type)}
                />
                <Label
                  htmlFor={inputId}
                  className="flex flex-1 items-center gap-2 font-normal text-foreground"
                >
                  <meta.Icon className="size-4 shrink-0" style={{ color: meta.color }} />
                  <span className="min-w-0 flex-1 truncate">{meta.label}</span>
                </Label>
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {counts[type]}
                </Badge>
              </div>
            )
          })}
        </section>

        {/* 취소 여부 필터: 유형 필터와 별개 축. 취소된 더미/실 일정이 많을 때 캘린더가 어수선해지는
            것을 막기 위한 표시 옵션이라 유형 체크박스와 달리 개수 배지 없이 단일 토글로 둔다. */}
        <div className="flex items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-muted/60">
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

        <Separator />

        {/* 오늘 일정 요약: 현재 range가 오늘을 포함할 때만 항목이 있고, 아니면 빈 상태 문구. */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground">오늘 일정</h3>
            <Badge variant="secondary" className="tabular-nums">
              {todayItems.length}건
            </Badge>
          </div>
          {todayItems.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">오늘 예정된 일정이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {todayItems.map((item) => {
                const meta = TYPE_META[item.scheduleType]
                return (
                  // 취소 일정은 캘린더 이벤트(mapScheduleToEvents의 [취소] 접두사 + opacity-55)와
                  // 결을 맞춰 흐림 처리 + 취소선을 준다 — 그러지 않으면 정상 일정과 구분이 안 된다.
                  <li
                    key={item.scheduleId}
                    className={cn(
                      'flex items-start gap-2.5 rounded-md px-1 py-1.5',
                      item.isCanceled && 'opacity-50',
                    )}
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 size-2 shrink-0 rounded-full"
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
        </section>

        <Separator />

        <p className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>회의·휴가·출장 일정은 관련 업무에서 자동으로 반영됩니다.</span>
        </p>
      </CardContent>
    </Card>
  )
}
