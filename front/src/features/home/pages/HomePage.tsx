import { DoorOpen, Store, UserPlus } from 'lucide-react'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { useAuthStore } from '@/features/auth/store/authStore'
import { ApprovalStatusWidget } from '../components/ApprovalStatusWidget'
import { DashboardKpiRow } from '../components/DashboardKpiRow'
import { FranchiseEducationPreviewWidget } from '../components/FranchiseEducationPreviewWidget'
import { FranchiseInquiryPreviewWidget } from '../components/FranchiseInquiryPreviewWidget'
import { FranchiseManagedSliceWidget } from '../components/FranchiseManagedSliceWidget'
import { FranchiseSalesComparisonWidget } from '../components/FranchiseSalesComparisonWidget'
import { MeetingRoomStatusWidget } from '../components/MeetingRoomStatusWidget'
import { MyLeaveSummaryWidget } from '../components/MyLeaveSummaryWidget'
import { MyScheduleWidget } from '../components/MyScheduleWidget'
import { NewEmployeeApprovalPreviewWidget } from '../components/NewEmployeeApprovalPreviewWidget'
import { RoleBandHeader } from '../components/RoleBandHeader'
import { UnreadMessagesWidget } from '../components/UnreadMessagesWidget'
import { WelcomeAttendanceCard } from '../components/WelcomeAttendanceCard'

/**
 * 홈 대시보드(사이드바 "홈" 항목, minRole EMPLOYEE의 실제 진입점).
 *
 * 사용자가 첨부한 레퍼런스(dashboard-roles.html, "A안 · 권한별 대시보드")를 승인된 계획
 * (mighty-frolicking-squirrel)에 따라 이식했다 — 전 직원 공통 섹션(환영+출퇴근 · KPI 4종 ·
 * 전자결재 2탭 · 오늘 일정 · 최근 쪽지 · 내 휴가 요약)에 로그인 사용자의 업무 권한(Layer 2:
 * HR/FACILITY/FRANCHISE)에 따라 노출되는 3개 역할 밴드를 이어 붙인다. roles는 authStore
 * (WelcomeAttendanceCard와 동일 소스)에서, 게이팅은 라우트 가드와 동일한
 * hasRequiredRole(roles, minRole)로 판정한다(신규 유틸 없음, ADMIN은 계층상 전 역할 자동 포함).
 *
 * RoleBandHeader는 밴드마다 이 페이지가 한 번씩 직접 렌더한다 — FRANCHISE 밴드는 위젯이 4개라
 * 헤더를 개별 위젯 내부에 두면 grid 컬럼 폭에 갇혀 레퍼런스처럼 전체 너비를 차지하지 못하기
 * 때문이다(밴드 헤더 1개당 위젯 1~4개인 HR/FACILITY/FRANCHISE 전부 이 방식으로 통일).
 *
 * 기존 4개 위젯 중 MyScheduleWidget(월 캘린더+상세 카드)·UnreadMessagesWidget은 2026-07-12
 * 사용자 확정 그대로 재배치했다(로직 변경 없음). PendingApprovalWidget은 ApprovalStatusWidget
 * (상신 진행·결재 대기 2탭)으로 대체되어 삭제했다.
 */
export function HomePage() {
  const roles = useAuthStore((state) => state.roles)
  const isHr = hasRequiredRole(roles, 'HR')
  const isFacility = hasRequiredRole(roles, 'FACILITY')
  const isFranchise = hasRequiredRole(roles, 'FRANCHISE')

  return (
    <div className="w-full space-y-4 p-4 sm:p-6 lg:p-8">
      <WelcomeAttendanceCard />

      <DashboardKpiRow />

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <ApprovalStatusWidget />
        <MyScheduleWidget />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UnreadMessagesWidget />
        <MyLeaveSummaryWidget />
      </div>

      {isHr && (
        <div>
          <RoleBandHeader icon={<UserPlus />} title="신규 사원 가입 승인" roleChip="HR" />
          <NewEmployeeApprovalPreviewWidget />
        </div>
      )}

      {isFacility && (
        <div>
          <RoleBandHeader icon={<DoorOpen />} title="회의실 운영" roleChip="FACILITY" />
          <MeetingRoomStatusWidget />
        </div>
      )}

      {isFranchise && (
        <div>
          <RoleBandHeader icon={<Store />} title="가맹점 관리" roleChip="FRANCHISE" />
          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <FranchiseSalesComparisonWidget />
            <FranchiseManagedSliceWidget />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <FranchiseEducationPreviewWidget />
            <FranchiseInquiryPreviewWidget />
          </div>
        </div>
      )}
    </div>
  )
}
