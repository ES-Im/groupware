import { useMemo, useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router'
import { useAuthStore } from '@/features/auth/store/authStore'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import type { DepartmentSummary } from '../api/getDepartments'
import { useDepartmentMemberCountsQuery } from '../api/useDepartmentMemberCountsQuery'
import { useDepartmentsQuery } from '../api/useDepartmentsQuery'
import { RegisterDepartmentDialog } from '../components/RegisterDepartmentDialog'
import { OrgChartExplorer } from '../components/OrgChartExplorer'
import { OrgChartSummaryCards } from '../components/OrgChartSummaryCards'
import { buildDepartmentTree } from '../lib/buildDepartmentTree'

const ALL_DEPARTMENTS_PAGE_SIZE = 500

export interface DepartmentExplorerOutletContext {
  departments: DepartmentSummary[]
}

export function DepartmentsExplorerLayout() {
  const navigate = useNavigate()
  const { deptId: deptIdParam } = useParams()
  const selectedDeptId =
    deptIdParam !== undefined && /^[1-9][0-9]*$/.test(deptIdParam) ? Number(deptIdParam) : undefined

  const roles = useAuthStore((state) => state.roles)
  const canRegisterDept = hasRequiredRole(roles, 'ADMIN')
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)

  const departmentsQuery = useDepartmentsQuery({ size: ALL_DEPARTMENTS_PAGE_SIZE })
  const departments = useMemo(() => departmentsQuery.data?.content ?? [], [departmentsQuery.data])
  const deptIds = useMemo(() => departments.map((dept) => dept.deptInfoResponse.deptId), [departments])
  const memberCountsQuery = useDepartmentMemberCountsQuery(deptIds)

  const tree = useMemo(
    () => buildDepartmentTree(departments, memberCountsQuery.counts),
    [departments, memberCountsQuery.counts],
  )

  const summary = useMemo(() => {
    const totalDeptCount = departments.length
    const activeDeptCount = departments.filter((dept) => dept.deptInfoResponse.isActive).length
    const leaderAssignedCount = departments.filter((dept) => dept.deptLeader !== null).length
    const totalMemberCount = Object.values(memberCountsQuery.counts).reduce((sum, count) => sum + count, 0)
    return { totalDeptCount, activeDeptCount, leaderAssignedCount, totalMemberCount }
  }, [departments, memberCountsQuery.counts])

  function handleSelect(deptId: number) {
    navigate(`/departments/${deptId}`)
  }

  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6 lg:h-full lg:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">조직 관리</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          부서 구조를 조회하고 생성·이동·부서장 임명 등을 관리합니다.
        </p>
      </header>

      <RegisterDepartmentDialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen} />

      <OrgChartSummaryCards {...summary} />

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(300px,34%)_1fr]">
        <aside className="flex flex-col rounded-xl bg-card p-3 ring-1 ring-foreground/10 lg:min-h-0">
          {departmentsQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : (
            <OrgChartExplorer
              tree={tree}
              selectedDeptId={selectedDeptId}
              onSelect={handleSelect}
              canRegisterDept={canRegisterDept}
              onOpenRegisterDialog={() => setIsRegisterDialogOpen(true)}
            />
          )}
        </aside>
        <div className="min-w-0 lg:min-h-0 lg:overflow-y-auto">
          <Outlet
            context={{ departments } satisfies DepartmentExplorerOutletContext}
          />
        </div>
      </div>
    </div>
  )
}
