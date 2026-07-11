import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { CalendarDays, CircleCheck, Users } from 'lucide-react'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import { handleApiError } from '@/shared/lib/apiError'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useFranchiseEducationCalendarQuery } from '../api/useFranchiseEducationCalendarQuery'
import { FranchiseEducationCalendar } from '../components/FranchiseEducationCalendar'
import { FranchiseEducationCreateDialog } from '../components/FranchiseEducationCreateDialog'
import { FranchiseMetricCard } from '../components/FranchiseMetricCard'
import { FranchisePageHeader } from '../components/FranchisePageHeader'
import { buildFranchiseCalendarRangeParams, type CalendarRangeParams } from '../lib/calendarRange'

/**
 * P4 가맹점 교육 캘린더 페이지(F1609, ROADMAP(FRANCHISE) T4.1 — MyMeetingCalendarPage 동형).
 *
 * T4.1 래퍼(FranchiseEducationCalendar)에 교육 캘린더 조회 결과를 이벤트로 바인딩한다.
 * 월 이동 시 datesSet → buildFranchiseCalendarRangeParams로 range state가 갱신되고 queryKey가
 * 바뀌어 자동 재조회된다(최초 마운트는 range undefined → 서버 당월 기본값 위임).
 *
 * 이벤트에는 제목·장소를 표기하고, 비활성(isActive=false) 또는 정원 마감(isFull=true) 교육은
 * classNames(opacity-50)로만 최소 시각 구분한다(스타일링은 adapt-ui 단계로 미룸 — 내 예약
 * 캘린더의 취소건 구분과 동일 방식). 이벤트 클릭 시 P5 상세(`/franchise-educations/:educationId`)
 * 라우트 문자열만 내비게이션한다.
 *
 * `[교육 등록]` 다이얼로그(F1612, T4.2, MeetingRoomManagementPage의 등록 버튼 배선과 동형)는
 * 헤더에 트리거 버튼을 두고, 성공 시 생성된 교육의 P5(상세)로 자동 이동한다.
 */
export function FranchiseEducationCalendarPage() {
  const navigate = useNavigate()
  const [range, setRange] = useState<CalendarRangeParams | undefined>(undefined)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { data, error } = useFranchiseEducationCalendarQuery(range?.start, range?.end)

  useEffect(() => {
    if (!error) {
      return
    }
    handleApiError(error, { toast })
  }, [error])

  // 캘린더 조회 결과는 페이지네이션이 아니라 표시 범위 전체 배열이므로, KPI를 실데이터로 정확히
  // 집계할 수 있다(교육 수·활성·정원 마감).
  const items = data ?? []
  const activeCount = items.filter((item) => item.isActive).length
  const fullCount = items.filter((item) => item.isFull).length

  const events: EventInput[] = items.map((item) => ({
    id: String(item.id),
    title: `${item.title} · ${item.place}`,
    start: item.date,
    classNames: !item.isActive || item.isFull ? ['opacity-50'] : [],
  }))

  function handleRangeChange(nextRange: { start: Date; end: Date }) {
    setRange(buildFranchiseCalendarRangeParams(nextRange.start, nextRange.end))
  }

  function handleEventClick(info: EventClickArg) {
    navigate(`/franchise-educations/${info.event.id}`)
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <FranchisePageHeader
        title="가맹점 교육"
        description="교육 일정과 마감·활성 상태를 캘린더 기준으로 살펴봅니다."
      >
        <Button type="button" onClick={() => setCreateDialogOpen(true)}>
          교육 등록
        </Button>
      </FranchisePageHeader>

      {/* KPI: 표시 범위 전체 배열에서 집계(페이지네이션 아님). */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FranchiseMetricCard
          title="교육 수"
          value={`${items.length}건`}
          description="현재 캘린더 범위 기준"
          icon={<CalendarDays />}
          accent="primary"
        />
        <FranchiseMetricCard
          title="활성 교육"
          value={`${activeCount}건`}
          description="신청 가능 상태"
          icon={<CircleCheck />}
          accent="muted"
        />
        <FranchiseMetricCard
          title="정원 마감"
          value={`${fullCount}건`}
          description="만석 교육 수"
          icon={<Users />}
          accent="destructive"
        />
      </div>

      <Card className="h-fit">
        <CardHeader className="border-b">
          <CardTitle>교육 일정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 범례: 이벤트 흐림 처리(비활성/정원 마감) 의미 안내. */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">진행 예정</Badge>
            <Badge variant="destructive">정원 마감</Badge>
            <Badge variant="outline">비활성</Badge>
          </div>
          <FranchiseEducationCalendar
            events={events}
            onRangeChange={handleRangeChange}
            onEventClick={handleEventClick}
          />
        </CardContent>
      </Card>

      <FranchiseEducationCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
