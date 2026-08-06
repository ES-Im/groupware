import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { usePageState } from '@/shared/lib/usePageState'
import { useDepartmentInfoQuery } from '../api/useDepartmentInfoQuery'
import { useDepartmentMembersQuery } from '../api/useDepartmentMembersQuery'
import { DepartmentMembersView } from '../components/DepartmentMembersView'
import { getPrimaryDeptId } from '../lib/getPrimaryDeptId'

export function DepartmentMembersPage() {
  const navigate = useNavigate()
  const roles = useAuthStore((state) => state.roles)
  const canManageAsHr = hasRequiredRole(roles, 'HR')
  const canManageAsDeptManager = !canManageAsHr && hasRequiredRole(roles, 'DEPT_MANAGER')
  const canManageMembers = canManageAsHr || canManageAsDeptManager
  const meQuery = useMeQuery()
  const deptId = meQuery.data ? getPrimaryDeptId(meQuery.data.currentDepts) : undefined
  const [keyword, setKeyword] = useState('')
  const { page, size, onPageChange, onSizeChange, resetPage } = usePageState()
  const deptInfoQuery = useDepartmentInfoQuery(deptId)
  const membersQuery = useDepartmentMembersQuery(deptId, { keyword, page, size })

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

  function handleRowClick(empId: number) {
    navigate(`/employees/${empId}`)
  }

  if (meQuery.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (meQuery.isError) {
    const apiError = normalizeApiError(meQuery.error)
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
        <p className="text-sm text-muted-foreground">
          내 정보를 불러오지 못해 부서 상세를 표시할 수 없습니다. {apiError.message}
        </p>
      </div>
    )
  }

  if (meQuery.data && deptId === undefined) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
        <p className="text-sm text-muted-foreground">
          소속된 부서가 없어 부서 상세를 표시할 수 없습니다. 인사과에 문의해주세요.
        </p>
      </div>
    )
  }

  if (deptInfoQuery.isLoading || membersQuery.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">부서 상세를 불러오는 중...</p>
      </div>
    )
  }

  if (deptInfoQuery.error) {
    const apiError = normalizeApiError(deptInfoQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
          <p className="text-sm text-muted-foreground">부서 정보를 찾을 수 없습니다.</p>
        </div>
      )
    }
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
        <p className="text-sm text-muted-foreground">부서 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (membersQuery.error) {
    const apiError = normalizeApiError(membersQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
          <p className="text-sm text-muted-foreground">부서 정보를 찾을 수 없습니다.</p>
        </div>
      )
    }
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">부서 상세</h1>
        <p className="text-sm text-muted-foreground">부서 멤버 목록을 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (deptId === undefined) {
    return null
  }

  if (!deptInfoQuery.data) {
    return null
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-[1.375rem] font-semibold tracking-tight">부서 구성원</h1>
        <p className="mt-1 text-sm text-muted-foreground">내 소속 부서의 구성원을 조회합니다.</p>
      </header>
      <DepartmentMembersView
        deptInfo={deptInfoQuery.data.deptInfoResponse}
        deptLeader={deptInfoQuery.data.deptLeader}
        members={membersQuery.data?.content ?? []}
        pageInfo={
          membersQuery.data ?? {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size,
            first: true,
            last: true,
            numberOfElements: 0,
            empty: true,
          }
        }
        canManageMembers={canManageMembers}
        canManageAsHr={canManageAsHr}
        canManageAsDeptManager={canManageAsDeptManager}
        deptId={deptId}
        keyword={keyword}
        onKeywordChange={(value) => {
          setKeyword(value)
          resetPage()
        }}
        page={page}
        onPageChange={onPageChange}
        size={size}
        onSizeChange={onSizeChange}
        onRowClick={handleRowClick}
      />
    </div>
  )
}
