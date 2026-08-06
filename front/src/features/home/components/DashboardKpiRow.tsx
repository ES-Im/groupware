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
