import { useEffect } from 'react'
import { useOutletContext, useParams } from 'react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { handleApiError, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { useActivateDepartmentMutation } from '../api/useActivateDepartmentMutation'
import { useDeactivateDepartmentMutation } from '../api/useDeactivateDepartmentMutation'
import { useDepartmentInfoQuery } from '../api/useDepartmentInfoQuery'
import { useDepartmentMembersQuery } from '../api/useDepartmentMembersQuery'
import { OrgChartDepartmentPanel } from '../components/OrgChartDepartmentPanel'
import type { DepartmentExplorerOutletContext } from './DepartmentsExplorerLayout'

const LEADER_CANDIDATE_PAGE_SIZE = 100

export function DepartmentDetailPage() {
  const { deptId: deptIdParam } = useParams()
  const isDecimalPositiveInteger = deptIdParam !== undefined && /^[1-9][0-9]*$/.test(deptIdParam)
  const deptId = isDecimalPositiveInteger ? Number(deptIdParam) : undefined
  const isInvalidDeptId = deptId === undefined

  const { departments } = useOutletContext<DepartmentExplorerOutletContext>()

  const roles = useAuthStore((state) => state.roles)
  const canManageDept = hasRequiredRole(roles, 'ADMIN')

  const deptInfoQuery = useDepartmentInfoQuery(isInvalidDeptId ? undefined : deptId)
  const membersQuery = useDepartmentMembersQuery(isInvalidDeptId ? undefined : deptId, {
    isEmpActive: true,
    size: LEADER_CANDIDATE_PAGE_SIZE,
  })

  const activateMutation = useActivateDepartmentMutation()
  const deactivateMutation = useDeactivateDepartmentMutation()
  const isTogglingActive = activateMutation.isPending || deactivateMutation.isPending

  function handleToggleActive() {
    if (deptId === undefined) {
      return
    }
    const isActive = deptInfoQuery.data?.deptInfoResponse.isActive
    const mutation = isActive ? deactivateMutation : activateMutation
    mutation.mutate(deptId, {
      onSuccess: () => {
        toast.success(isActive ? '부서를 비활성화했습니다' : '부서를 활성화했습니다')
      },
      onError: (error) => {
        handleApiError(error, { toast })
      },
    })
  }

  useEffect(() => {
    if (!deptInfoQuery.error) {
      return
    }
    const apiError = normalizeApiError(deptInfoQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [deptInfoQuery.error])

  useEffect(() => {
    if (!membersQuery.error) {
      return
    }
    const apiError = normalizeApiError(membersQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [membersQuery.error])

  if (isInvalidDeptId) {
    return <p className="text-sm text-muted-foreground">부서 정보를 찾을 수 없습니다.</p>
  }

  if (deptInfoQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">부서 상세를 불러오는 중...</p>
  }

  if (deptInfoQuery.error) {
    const apiError = normalizeApiError(deptInfoQuery.error)
    if (isNotFound(apiError)) {
      return <p className="text-sm text-muted-foreground">부서 정보를 찾을 수 없습니다.</p>
    }
    return <p className="text-sm text-muted-foreground">부서 정보를 불러오지 못했습니다.</p>
  }

  if (!deptInfoQuery.data) {
    return null
  }

  const { deptInfoResponse, deptLeader } = deptInfoQuery.data
  const memberCount = membersQuery.data?.totalElements ?? 0
  const currentMembers = membersQuery.data?.content ?? []

  const departmentsById = new Map(departments.map((dept) => [dept.deptInfoResponse.deptId, dept]))

  const parentDeptName =
    deptInfoResponse.parentDeptId !== null
      ? (departmentsById.get(deptInfoResponse.parentDeptId)?.deptInfoResponse.deptName ?? null)
      : null

  const subDepartments = departments
    .filter((dept) => dept.deptInfoResponse.parentDeptId === deptInfoResponse.deptId)
    .map((dept) => dept.deptInfoResponse)

  return (
    <OrgChartDepartmentPanel
      deptInfo={deptInfoResponse}
      deptLeader={deptLeader}
      memberCount={memberCount}
      parentDeptName={parentDeptName}
      subDepartments={subDepartments}
      canManageDept={canManageDept}
      members={currentMembers}
      onToggleActive={handleToggleActive}
      isTogglingActive={isTogglingActive}
    />
  )
}
