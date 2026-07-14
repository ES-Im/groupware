import { useEffect } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { getPrimaryDeptId } from '@/features/department/lib/getPrimaryDeptId'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { useEmployeeQuery } from '../api/useEmployeeQuery'
import { EmpManagementSection } from '../components/EmpManagementSection'
import { EmpRecordsWidget } from '../components/EmpRecordsWidget'
import { EmployeeProfileTabs } from '../components/EmployeeProfileTabs'
import { EmployeeSummaryCard } from '../components/EmployeeSummaryCard'

/**
 * 사원 상세 페이지(타 사원, F002 RETRIEVE_EMP_INFO, ROADMAP T2.2).
 * 부서 멤버 목록(T2.1-b)의 행 클릭이 `/employees/:empId`로 이동시켜 도달한다.
 *
 * 조회 실패는 DepartmentMembersPage(T2.1-b)와 동일한 분기 패턴을 따른다: not-found →
 * 전용 not-found UX, forbidden(ROLE_003) → 전용 권한 부족 UX, 그 외 → 토스트(useEffect로
 * 1회성 알림, 렌더 중 side effect 방지).
 */
export function EmployeeDetailPage() {
  const { empId } = useParams<{ empId: string }>()
  const parsedEmpId = empId !== undefined ? Number(empId) : undefined
  const isValidEmpId = parsedEmpId !== undefined && !Number.isNaN(parsedEmpId)
  const query = useEmployeeQuery(isValidEmpId ? parsedEmpId : undefined)
  const roles = useAuthStore((state) => state.roles)
  const canManageAsHr = hasRequiredRole(roles, 'HR')
  const canManageAsDeptManager = !canManageAsHr && hasRequiredRole(roles, 'DEPT_MANAGER')
  const canManage = canManageAsHr || canManageAsDeptManager
  // DEPT_ATTENDANCE_MONTHLY/DEPT_LEAVE_REQUEST_HISTORY/DEPT_BUSINESS_TRIP_REQUEST_HISTORY는
  // DEPT_MANAGER(같은 부서) 또는 ADMIN만 허용하고 HR은 불가하므로 canManage와 별도로 계산한다
  // (ADMIN은 RoleHierarchy로 DEPT_MANAGER를 포함해 별도 분기 불필요 — DepartmentDetailView의
  // canViewAttendanceBoard와 동일 패턴).
  const canViewRecordsBoard = hasRequiredRole(roles, 'DEPT_MANAGER')

  // not-found/forbidden은 아래에서 전용 UX로 렌더하므로, 그 외 실패만 토스트로 알린다.
  useEffect(() => {
    if (!query.error) {
      return
    }
    const apiError = normalizeApiError(query.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [query.error])

  if (!isValidEmpId) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">사원 상세</h1>
        <p className="text-sm text-muted-foreground">잘못된 사원 식별자입니다.</p>
      </div>
    )
  }

  if (query.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (query.error) {
    const apiError = normalizeApiError(query.error)
    if (isNotFound(apiError)) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">사원 상세</h1>
          <p className="text-sm text-muted-foreground">사원 정보를 찾을 수 없습니다.</p>
        </div>
      )
    }
    if (isForbidden(apiError)) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">사원 상세</h1>
          <p className="text-sm text-muted-foreground">이 사원 정보를 조회할 권한이 없습니다.</p>
        </div>
      )
    }
    // not-found/forbidden이 아닌 실패는 위 useEffect가 토스트로 알렸으므로 화면은 빈 상태로만 표시한다.
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">사원 상세</h1>
        <p className="text-sm text-muted-foreground">사원 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!query.data) {
    return null
  }

  const deptId = getPrimaryDeptId(query.data.currentDepts)

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* 메인 레이아웃 타이틀 표준(기준: MeetingReservationManagementPage). 사원명/사번은 아래
          EmployeeSummaryCard가 직접 표시하고, 이 타이틀은 페이지 레벨 라벨로 둔다(MyInfoPage와 동일). */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">사원 상세</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          사원의 프로필과 소속 정보를 확인합니다
        </p>
      </div>

      {/*
        타 사원 조회이므로 viewerIsSelf={false}로 아이디(loginId)/파일 탭/활성 파일 섹션을 숨겨
        개인정보 노출을 막는다(본인 조회 페이지인 MyInfoPage와의 핵심 차이점).
        레이아웃은 MyInfoPage와 동일한 2열 그리드(320px+1fr)를 직접 조립한다 — 좌측 컬럼에
        요약 카드+관리 섹션(canManage, HR/DEPT_MANAGER), 우측 컬럼에 프로필 탭+기록 위젯
        (canViewRecordsBoard, DEPT_MANAGER/ADMIN)을 각각 게이팅해 붙인다.
      */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <EmployeeSummaryCard data={query.data} empId={parsedEmpId} viewerIsSelf={false} />
          {canManage && (
            <EmpManagementSection
              empId={parsedEmpId}
              deptId={deptId}
              canManageAsHr={canManageAsHr}
              canManageAsDeptManager={canManageAsDeptManager}
            />
          )}
        </div>

        <div className="space-y-6">
          <EmployeeProfileTabs data={query.data} empId={parsedEmpId} viewerIsSelf={false} />
          {canViewRecordsBoard && deptId !== undefined && (
            <EmpRecordsWidget empId={parsedEmpId} deptId={deptId} />
          )}
        </div>
      </div>
    </div>
  )
}
