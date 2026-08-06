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

export function EmployeeDetailPage() {
  const { empId } = useParams<{ empId: string }>()
  const parsedEmpId = empId !== undefined ? Number(empId) : undefined
  const isValidEmpId = parsedEmpId !== undefined && !Number.isNaN(parsedEmpId)
  const query = useEmployeeQuery(isValidEmpId ? parsedEmpId : undefined)
  const roles = useAuthStore((state) => state.roles)
  const canManageAsHr = hasRequiredRole(roles, 'HR')
  const canManageAsDeptManager = !canManageAsHr && hasRequiredRole(roles, 'DEPT_MANAGER')
  const canManage = canManageAsHr || canManageAsDeptManager
  const canViewRecordsBoard = hasRequiredRole(roles, 'DEPT_MANAGER')

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">사원 상세</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          사원의 프로필과 소속 정보를 확인합니다
        </p>
      </div>

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
