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

// 오늘 하루 범위(DashboardKpiRow의 TODAY_RANGE와 동일 방식 — 동일 queryKey라 react-query 캐시를 공유해
// KPI "오늘 일정" 카드와 네트워크 요청·데이터가 일치한다).
const TODAY_RANGE = buildCalendarRangeParams(dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate())

/**
 * 오늘 일정 위젯(레퍼런스 dashboard-roles.html "오늘 일정" 타임라인 이식).
 *
 * 사용자 확정(2026-07-13)으로 이전의 월 캘린더 + 선택일 상세 구조를 걷어내고, 레퍼런스처럼 오늘
 * 하루치 일정만 타임라인(시각 + 스파인 + 제목 + 유형 배지)으로 보여준다. 오늘 범위로
 * SCHEDULE_CALENDAR(useScheduleCalendarQuery)를 조회하며, DashboardKpiRow의 "오늘 일정" 카드와
 * 동일 range·동일 필터(취소 제외)를 써서 KPI 건수와 이 목록이 항상 일치한다.
 *
 * SCHEDULE_CALENDAR 응답에는 위치·참석자 필드가 없어(scheduleId/scheduleType/title/scheduleDate/
 * startAt/endAt/isAllDay/isCanceled만 존재) 레퍼런스의 위치·참석자 텍스트는 표시하지 않는다(계약에
 * 없는 정보 발명 금지). 유형별 색 구분(레퍼런스 .tl-line)은 프로젝트 무채색 정책상 단일 primary 톤
 * 스파인으로 통일한다.
 */
export function MyScheduleWidget() {
  const { data } = useScheduleCalendarQuery(TODAY_RANGE)
  const todayItems = (data ?? [])
    .filter((item) => !item.isCanceled)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))

  return (
    // 고정 높이(h-[420px]) + Card 기본 flex-col: header 고정 · content flex-1 스크롤 · footer 바닥 고정.
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
          // flex-1: 내용이 없을 때 남는 공간을 채워 안내를 세로 중앙에 둔다.
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
                {/* 타임라인 스파인(레퍼런스 .tl-line — 유형별 색은 무채색 정책상 단일 primary 톤으로 통일). */}
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
      {/* "더 보기" 링크는 세 카드 공통으로 하단 footer에 고정한다(내용량과 무관하게 바닥 정렬). */}
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
