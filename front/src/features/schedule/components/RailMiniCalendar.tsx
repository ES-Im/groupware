import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useScheduleCalendarQuery } from '@/features/schedule/api/useScheduleCalendarQuery'
import type { ScheduleType } from '@/features/schedule/model/schedule'
import { cn } from '@/shared/lib/utils'
import { Calendar } from '@/shared/ui/calendar'

type RailScheduleType = 'MANUAL' | 'BUSINESS_TRIP' | 'LEAVE'

/** 요청 색 지정 그대로: 자홍색(수기)/파란색(출장)/초록색(연가). 회의(MEETING)는 색 지정이 없어 표시 대상에서 제외한다. */
const RAIL_SCHEDULE_DOT_CLASS: Record<RailScheduleType, string> = {
  MANUAL: 'bg-fuchsia-500',
  BUSINESS_TRIP: 'bg-blue-500',
  LEAVE: 'bg-green-500',
}

function isRailScheduleType(value: ScheduleType): value is RailScheduleType {
  return value === 'MANUAL' || value === 'BUSINESS_TRIP' || value === 'LEAVE'
}

/**
 * 좌측 고정 패널의 작은 캘린더(요청: "취소되지 않은 일정에 대해 자홍색(수기)/파란색(출장)/
 * 초록색(연가)으로 표시"). ScheduleCalendarPage의 기존 유형별 색(mapScheduleToEvents/
 * scheduleCalendar.css)과는 별개로, 이 위젯 전용 색 매핑을 요청 그대로 적용한다.
 *
 * 표시 중인 달 범위(start of month ~ end of month)로만 조회한다 — FullCalendar처럼 뷰에 걸친
 * 인접 달의 outside days까지 정확히 채우진 않지만, 빠른 일별 점 확인용 축약 위젯이라 충분하다.
 *
 * 점(dot) 렌더 위치(react-day-picker v10): 이 캘린더는 mode/onDayClick가 없는 '디스플레이 전용'이라
 * DayButton 슬롯이 렌더되지 않는다(isInteractive === false → 날짜는 plain text). 따라서 상호작용을
 * 더하지 않고 표시 전용을 유지하기 위해, 점은 항상 렌더되는 Day(td) 슬롯에서 직접 그린다(아래 참고).
 */
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
      // 좌측 고정 패널의 어두운 크롬 배경 위에 놓이므로: 기본 bg-background를 투명으로 덮고(크롬 배경이
      // 그대로 비치게), 전경은 primary-foreground/card-foreground로 상속시킨다. 루트를 w-full로 만들어
      // (기본 w-fit 덮음) 패널 폭을 채우고, 아래 day/weekday를 flex-1로 균등 분배시킨다
      // (w-fit + 퍼센트 폭은 min-content로 붕괴해 셀이 찌그러지므로 flex-1로 명시 분배).
      className="mx-auto w-full bg-transparent p-0 text-primary-foreground dark:text-card-foreground"
      // 요청4: 가시성을 위해 행(주)·열(요일) 사이에 격자선을 그린다. 컨테이너에 상/좌 외곽선을,
      // 각 셀에 우/하 보더를 주어 이중선 없이 완전한 격자를 만든다. 이 미니 캘린더는 선택(selection)이
      // 없어 day 슬롯 기본값(선택 코너 라운딩 등)을 대체해도 안전하다.
      classNames={{
        month_grid: 'w-full border-collapse border-t border-l border-primary-foreground/30 dark:border-card-foreground/30',
        weekdays: 'flex w-full',
        weekday:
          'flex-1 border-r border-b border-primary-foreground/30 py-1 text-[0.7rem] font-normal text-primary-foreground/60 select-none dark:border-card-foreground/30 dark:text-card-foreground/60',
        week: 'flex w-full',
        // aspect-square(셀 폭 종속) 대신 명시적 최소 높이(min-h-10)를 줘, 위=날짜 숫자 / 아래=점이
        // 세로로 분리될 세로 공간을 확보한다(점이 숫자와 겹치거나 셀 하단에 눌리지 않게). relative는
        // 아래 Day 슬롯에서 점을 셀 기준으로 absolute 배치하기 위한 기준이다.
        day: 'group/day relative min-h-10 flex-1 border-r border-b border-primary-foreground/30 p-0 text-center select-none dark:border-card-foreground/30',
        today: 'bg-primary-foreground/15 dark:bg-card-foreground/15',
      }}
      components={{
        // react-day-picker v10은 mode/onDayClick가 없는 '디스플레이 전용' 캘린더에서는 DayButton을
        // 렌더하지 않고 날짜를 plain text로만 그린다(DayPicker.js: isInteractive === false). 그래서 점(dot)
        // 은 항상 렌더되는 Day(td) 슬롯에서 직접 그린다 — 상호작용(클릭/포커스)을 추가하지 않고 표시
        // 전용을 유지하기 위함이다. day/modifiers는 DOM 속성이 아니라 분해해 제외하고 나머지(className·
        // 격자 보더·today 하이라이트·role/aria/data-*)만 td에 그대로 전달한다.
        Day: ({ day, modifiers, children, ...tdProps }) => {
          const dateKey = dayjs(day.date).format('YYYY-MM-DD')
          const types = eventsByDate.get(dateKey)
          return (
            <td {...tdProps}>
              {/* 위: 날짜 숫자(셀 상단 중앙). p-0인 td에서 상단 보더와 붙지 않게 살짝 내린다(pt-1). */}
              <div className="pt-1 text-center">{children}</div>
              {/* 아래: 유형별 색 점. 어두운 크롬 배경에서 잘 보이도록 size-1.5로 키우고 gap-1로 띄운다.
                  셀 하단(bottom-1)에 가로 중앙으로 모아 날짜 숫자와 세로로 분리한다. */}
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
