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

/** 전체 부서를 한 페이지에 담기 위한 size. 전용 "전체 조회" API가 없어(DEPTS는 페이징 응답)
 * UpdateDepartmentParentDialog의 CANDIDATE_PAGE_SIZE보다 넉넉하게 잡는다(백엔드 size 상한 없음, 실측 확인). */
const ALL_DEPARTMENTS_PAGE_SIZE = 500

/** 자식 라우트(DepartmentDetailPage)에 내려주는 outlet context 계약.
 *
 * departments: 이 레이아웃이 이미 트리 구성을 위해 조회한 flat 부서 목록. 자식이 상위 부서
 * 이름·하위 부서 배지를 파생시키는 데 재사용하도록 그대로 내려준다(중복 조회 방지). */
export interface DepartmentExplorerOutletContext {
  departments: DepartmentSummary[]
}

/**
 * 조직도 탐색형 레이아웃(좌측 트리 + 우측 상세, master-detail). DepartmentsPage(표 목록)를
 * 대체한다. deptId 파라미터는 자식 라우트(:deptId)가 갖고 있지만, useParams()는 레이아웃
 * 라우트에서도 자식의 파라미터를 읽을 수 있으므로 여기서도 그대로 읽어 트리 강조 표시에 쓴다.
 */
export function DepartmentsExplorerLayout() {
  const navigate = useNavigate()
  const { deptId: deptIdParam } = useParams()
  // DepartmentDetailPage와 동일한 유효성 검사 규칙(순수 10진 양의 정수만 허용)을 트리 강조
  // 표시에도 그대로 적용한다 — 여기서는 not-found 분기가 필요 없으므로 selectedDeptId가
  // undefined로 남는 것만으로 충분하다.
  const selectedDeptId =
    deptIdParam !== undefined && /^[1-9][0-9]*$/.test(deptIdParam) ? Number(deptIdParam) : undefined

  const roles = useAuthStore((state) => state.roles)
  const canRegisterDept = hasRequiredRole(roles, 'ADMIN')
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)

  // keyword/isActive는 서버에 보내지 않는다 — 검색·필터는 OrgChartExplorer가 클라이언트
  // 사이드로 처리하므로, 이 레이어는 전체 원본 목록만 공급한다(팀 결정).
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
    <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">조직 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          부서 구조를 조회하고 생성·이동·부서장 임명 등을 관리합니다.
        </p>
      </header>

      <RegisterDepartmentDialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen} />

      <OrgChartSummaryCards {...summary} />

      <div className="grid gap-4 lg:grid-cols-[minmax(300px,34%)_1fr]">
        {/* 데스크톱: 뷰포트 기준 높이(lg:h-[calc(100svh-2rem)])로 고정하고 sticky로 고정 노출한다.
            트리 목록은 OrgChartExplorer 내부에서 스크롤되므로 우측 상세 높이와 무관하게 박스 하단에
            빈 여백이 생기지 않는다. flex flex-col로 자식(OrgChartExplorer)의 h-full을 성립시킨다. */}
        <aside className="flex flex-col rounded-xl bg-card p-3 ring-1 ring-foreground/10 lg:sticky lg:top-4 lg:h-[calc(100svh-2rem)]">
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
        <div className="min-w-0">
          <Outlet
            context={{ departments } satisfies DepartmentExplorerOutletContext}
          />
        </div>
      </div>
    </div>
  )
}
