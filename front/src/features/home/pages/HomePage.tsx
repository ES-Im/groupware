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
import { MyScheduleWidget } from '../components/MyScheduleWidget'
import { NewEmployeeApprovalPreviewWidget } from '../components/NewEmployeeApprovalPreviewWidget'
import { RoleBandHeader } from '../components/RoleBandHeader'
import { UnreadMessagesWidget } from '../components/UnreadMessagesWidget'
import { WelcomeAttendanceCard } from '../components/WelcomeAttendanceCard'

export function HomePage() {
  const roles = useAuthStore((state) => state.roles)
  const isHr = hasRequiredRole(roles, 'HR')
  const isFacility = hasRequiredRole(roles, 'FACILITY')
  const isFranchise = hasRequiredRole(roles, 'FRANCHISE')

  return (
    <div className="w-full space-y-4 p-4 sm:p-6 lg:p-8">
      <WelcomeAttendanceCard />

      <DashboardKpiRow />

      <div className="grid gap-4 xl:grid-cols-3">
        <ApprovalStatusWidget />
        <UnreadMessagesWidget />
        <MyScheduleWidget />
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
