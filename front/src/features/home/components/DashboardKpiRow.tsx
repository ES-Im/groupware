import dayjs from 'dayjs'
import { CalendarCheck, ClipboardList, DoorOpen, Mail } from 'lucide-react'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useMyPendingApprovalDraftsCountQuery } from '@/features/approval/api/useMyPendingApprovalDraftsCountQuery'
import { useScheduleCalendarQuery } from '@/features/schedule/api/useScheduleCalendarQuery'
import { useManagementReservationsQuery } from '@/features/meeting/api/useManagementReservationsQuery'
import { useMyMeetingReservationsCalendarQuery } from '@/features/meeting/api/useMyMeetingReservationsCalendarQuery'
import { useMailboxCountsQuery } from '@/features/message/api/useMailboxCountsQuery'
import { buildCalendarRangeParams } from '@/features/meeting/lib/calendarRange'
import { DashboardKpiCard } from './DashboardKpiCard'

const TODAY = dayjs().format('YYYY-MM-DD')
const TODAY_RANGE = buildCalendarRangeParams(dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate())
const CURRENT_YEAR_MONTH = dayjs().format('YYYY-MM')

/** FACILITY·ADMIN 전용: 오늘 전사 회의실 예약 현황(현재월 관리 목록 → 오늘 클라이언트 필터). */
function FacilityMeetingKpiCard() {
  const query = useManagementReservationsQuery({ yearMonth: CURRENT_YEAR_MONTH, page: 0, size: 100 })
  const count = (query.data?.content ?? []).filter(
    (item) => item.meetingDate === TODAY && !item.isCanceled,
  ).length

  return (
    <DashboardKpiCard
      label="회의실 예약"
      value={count}
      unit="건"
      sub="오늘 전사 회의실 예약"
      icon={<DoorOpen />}
      accent="muted"
    />
  )
}

/** 그 외 역할 전용: 오늘 내 회의 일정 건수(내 예약 캘린더 → 오늘 클라이언트 필터). */
function MyMeetingKpiCard() {
  const query = useMyMeetingReservationsCalendarQuery()
  const count = (query.data ?? []).filter(
    (item) => item.meetingDate === TODAY && !item.isCanceled,
  ).length

  return (
    <DashboardKpiCard
      label="회의실 예약"
      value={count}
      unit="건"
      sub="오늘 내 회의 일정"
      icon={<DoorOpen />}
      accent="muted"
    />
  )
}

/**
 * 공통 KPI 요약 4종(레퍼런스 `.kpis` 섹션 이식, "B안 채택" 축약형).
 * franchise 도메인의 FranchiseMetricCard를 그대로 cross-feature 재사용한다(계획 문서 §재사용
 * 자원 맵 — franchise 전용 컴포넌트가 아니라 프로젝트 공용 KPI 카드 프레젠테이션으로 취급).
 *
 * 회의실 예약 KPI는 역할별로 소스가 갈린다(사용자 확정 설계 결정: FACILITY·ADMIN은 전사 현황,
 * 그 외는 내 회의 일정). 두 컴포넌트로 분리해 조건부 마운트하면 필요한 쿼리만 실행되고
 * 비활성 역할의 API가 불필요하게 호출되지 않는다.
 */
export function DashboardKpiRow() {
  const roles = useAuthStore((state) => state.roles)
  const isFacilityOrAdmin = hasRequiredRole(roles, 'FACILITY')

  const pendingCountQuery = useMyPendingApprovalDraftsCountQuery()
  const todayScheduleQuery = useScheduleCalendarQuery(TODAY_RANGE)
  const mailboxCountsQuery = useMailboxCountsQuery()

  const todayScheduleCount = (todayScheduleQuery.data ?? []).filter((item) => !item.isCanceled).length

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardKpiCard
        label="결재 대기"
        value={pendingCountQuery.data ?? 0}
        unit="건"
        icon={<ClipboardList />}
        accent="primary"
      />
      <DashboardKpiCard
        label="오늘 일정"
        value={todayScheduleCount}
        unit="건"
        icon={<CalendarCheck />}
        accent="muted"
      />
      {isFacilityOrAdmin ? <FacilityMeetingKpiCard /> : <MyMeetingKpiCard />}
      <DashboardKpiCard
        label="미확인 쪽지"
        value={mailboxCountsQuery.data?.unreadReceivedCount ?? 0}
        unit="건"
        icon={<Mail />}
        accent="destructive"
      />
    </div>
  )
}
