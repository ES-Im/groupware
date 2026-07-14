import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Building2, Search, UserRound, X } from 'lucide-react'
import { useDepartmentInfoQuery } from '@/features/department/api/useDepartmentInfoQuery'
import { useDepartmentMemberCountsQuery } from '@/features/department/api/useDepartmentMemberCountsQuery'
import { useDepartmentMembersQuery } from '@/features/department/api/useDepartmentMembersQuery'
import { useDepartmentsQuery } from '@/features/department/api/useDepartmentsQuery'
import { useEmployeeNameSearchQuery } from '@/features/department/api/useEmployeeNameSearchQuery'
import { DepartmentDetailView } from '@/features/department/components/DepartmentDetailView'
import { OrgChartExplorer } from '@/features/department/components/OrgChartExplorer'
import { buildDepartmentTree } from '@/features/department/lib/buildDepartmentTree'
import type { DeptMemberSearchResult } from '@/features/department/model/deptMember'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'
import { useEmployeeQuery } from '../api/useEmployeeQuery'
import { useEmployeeSearchOverlayStore } from '../lib/employeeSearchOverlayStore'
import { EmployeeSummaryCard } from './EmployeeSummaryCard'

/** 상단 검색 결과 디바운스 지연(ms). ChatEmployeeListPanel의 SEARCH_DEBOUNCE_MS와 동일 값. */
const SEARCH_DEBOUNCE_MS = 300

/** 전체 부서를 한 페이지에 담기 위한 size. DepartmentsExplorerLayout의 ALL_DEPARTMENTS_PAGE_SIZE와 동일 값. */
const ALL_DEPARTMENTS_PAGE_SIZE = 500

/**
 * 오버레이의 부서 멤버 카드는 검색/페이징 UI 없이 선택 부서의 멤버 '전원'을 한 번에 보여주므로
 * (사용자 요청), 한 페이지에 전체를 담는 큰 size로 조회한다. 페이징이 없으므로 이 값보다 멤버가
 * 많으면 잘릴 수 있어, 부서 목록 조회의 ALL_DEPARTMENTS_PAGE_SIZE와 동일하게 넉넉히 잡는다.
 */
const ALL_DEPT_MEMBERS_PAGE_SIZE = 500

/** 미선택 상태 플레이스홀더 공통 박스(선택적 아이콘 + 안내 문구). */
function Placeholder({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {icon}
      <span>{children}</span>
    </div>
  )
}

/**
 * 헤더 검색 오버레이 진입점. `LayoutShell` 최상위의 고정 자식으로 항상 마운트되며, shadcn Sheet로
 * 뷰포트 우측에서 슬라이드-인하는 패널이다. 패널은 어떤 브레이크포인트에서도 뷰포트 폭의 50%만
 * 차지해(나머지 절반에 뒤 페이지가 보임), SheetContent의 기본 폭 유틸리티를 같은 variant로 덮어쓴다.
 * 배경 클릭/Escape 닫힘·포커스 트랩은 Radix Sheet가 기본 제공한다.
 */
export function EmployeeSearchOverlay() {
  const isOpen = useEmployeeSearchOverlayStore((state) => state.isOpen)
  const close = useEmployeeSearchOverlayStore((state) => state.close)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      {/* 폭은 모든 브레이크포인트에서 50vw로 고정한다: SheetContent 기본값(data-[side=right]:w-3/4,
          data-[side=right]:sm:max-w-sm)은 속성 셀렉터라 특이도가 높으므로, 같은 variant를 붙인
          data-[side=right]:w-1/2 / data-[side=right]:sm:max-w-none으로 덮어써야 tailwind-merge가
          충돌을 해소한다. 내부 레이아웃이 패딩/간격을 직접 관리하므로 p-0·gap-0으로 리셋하고,
          기존 오버레이와 동일하게 표면색은 bg-background로 맞춘다(SheetContent 기본 bg-popover 덮어씀). */}
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 bg-background p-0 text-foreground data-[side=right]:w-1/2 data-[side=right]:sm:max-w-none"
      >
        <EmployeeSearchOverlayContent />
      </SheetContent>
    </Sheet>
  )
}

function EmployeeSearchOverlayContent() {
  const query = useEmployeeSearchOverlayStore((state) => state.query)
  const selectedDeptId = useEmployeeSearchOverlayStore((state) => state.selectedDeptId)
  const selectedEmpId = useEmployeeSearchOverlayStore((state) => state.selectedEmpId)
  const setQuery = useEmployeeSearchOverlayStore((state) => state.setQuery)
  const selectDept = useEmployeeSearchOverlayStore((state) => state.selectDept)
  const selectEmployee = useEmployeeSearchOverlayStore((state) => state.selectEmployee)
  const close = useEmployeeSearchOverlayStore((state) => state.close)

  // 상단 검색 결과 디바운스(ChatEmployeeListPanel과 동일 패턴). query 자체는 store가 단일
  // 소스이므로(헤더에서 넘어온 초기값 포함), 여기서는 debouncedKeyword만 지연 파생한다.
  const [debouncedKeyword, setDebouncedKeyword] = useState(query.trim())
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const searchResultsQuery = useEmployeeNameSearchQuery(debouncedKeyword)

  // 좌측 조직도 트리(DepartmentsExplorerLayout과 동일 배선). useEmployeeNameSearchQuery도 내부에서
  // 동일 queryKey(size=500)로 부서 목록을 조회하므로 캐시를 공유하며 중복 네트워크 요청은 없다.
  const departmentsQuery = useDepartmentsQuery({ size: ALL_DEPARTMENTS_PAGE_SIZE })
  const departments = departmentsQuery.data?.content ?? []
  const deptIds = departments.map((dept) => dept.deptInfoResponse.deptId)
  const memberCountsQuery = useDepartmentMemberCountsQuery(deptIds)
  const tree = buildDepartmentTree(departments, memberCountsQuery.counts)

  // 상단 검색어로 부서도 함께 찾는다. 이미 불러온 부서 목록에서 부서명이 검색어를 포함하는 부서만
  // 골라내며, OrgChartExplorer의 filterTree와 동일한 단순 includes(대소문자 구분) 매칭을 쓴다.
  const deptSearchResults =
    debouncedKeyword.length > 0
      ? departments.filter((dept) => dept.deptInfoResponse.deptName.includes(debouncedKeyword))
      : []

  // 우측 하단 부서 멤버 카드(조회 전용). 오버레이에서는 검색/총원/페이징 UI를 노출하지 않으므로
  // (overlayLayout), 검색어 없이 첫 페이지에 멤버 전원을 담는 큰 size로 한 번만 조회한다.
  const deptInfoQuery = useDepartmentInfoQuery(selectedDeptId)
  const deptMembersQuery = useDepartmentMembersQuery(selectedDeptId, {
    keyword: '',
    page: 0,
    size: ALL_DEPT_MEMBERS_PAGE_SIZE,
  })

  // 우측 상단 사원 프로필.
  const employeeQuery = useEmployeeQuery(selectedEmpId)

  function handleSelectDept(deptId: number) {
    selectDept(deptId)
  }

  function handleSelectSearchResult(item: DeptMemberSearchResult) {
    selectEmployee(item.empId, item.deptId)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 상단: 타이틀 + 검색 input + 닫기 */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        {/* SheetContent(Radix Dialog)의 접근성 타이틀. 시각 타이틀을 겸하며 중복을 피한다. */}
        <SheetTitle className="hidden shrink-0 text-sm font-semibold sm:block">사원 찾기</SheetTitle>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="employee-search-overlay-input" className="sr-only">
            사원 이름 검색
          </label>
          <Input
            id="employee-search-overlay-input"
            type="search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="사원 이름 검색..."
            className="pl-8"
          />
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="검색창 닫기" onClick={close}>
          <X aria-hidden="true" />
        </Button>
      </div>

      {/* 검색 결과 리스트: 상단 검색창 바로 아래. 같은 검색어로 부서/사원을 함께 찾아 두 섹션으로 보여준다. */}
      {debouncedKeyword.length > 0 && (
        <div className="max-h-72 shrink-0 space-y-3 overflow-y-auto border-b border-border p-2">
          {/* 부서 검색 결과: 부서명 부분일치. 행 클릭 시 handleSelectDept로 좌측 조직도/우측 멤버 카드를 갱신. */}
          {deptSearchResults.length > 0 && (
            <section>
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                부서 {deptSearchResults.length}건
              </p>
              <ul className="flex flex-col gap-0.5">
                {deptSearchResults.map((dept) => {
                  const info = dept.deptInfoResponse
                  const memberCount = memberCountsQuery.counts[info.deptId]
                  return (
                    <li key={info.deptId}>
                      <button
                        type="button"
                        onClick={() => handleSelectDept(info.deptId)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Building2 className="size-4" aria-hidden="true" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">{info.deptName}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {info.deptCode}
                            {dept.deptLeader ? ` · ${dept.deptLeader.empName}` : ''}
                            {memberCount !== undefined ? ` · 구성원 ${memberCount}명` : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* 사원 검색 결과: 이름 부분일치(비동기 조회). */}
          {searchResultsQuery.isLoading ? (
            <p className="p-2 text-sm text-muted-foreground">검색 중...</p>
          ) : searchResultsQuery.items.length > 0 ? (
            <section>
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                사원 {searchResultsQuery.items.length}건
              </p>
              <ul className="flex flex-col gap-0.5">
                {searchResultsQuery.items.map((item) => (
                  <li key={item.empId}>
                    <button
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <BlobAvatar empId={item.empId} fallbackText={item.empName} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{item.empName}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.deptName} · {item.position}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : deptSearchResults.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">검색 결과가 없습니다.</p>
          ) : null}
        </div>
      )}

      {/* 하단: 좌측 조직도 + 우측(상단 프로필 / 하단 부서멤버 카드).
          패널이 50vw로 고정돼 좁으므로 뷰포트가 아니라 '패널 자체 폭'을 기준으로 2단 전환한다
          (@container). 패널이 충분히 넓을 때(@min-[720px])만 좌우 2단·독립 스크롤이 되고,
          좁으면 세로 스택으로 자연스럽게 접혀 한 컬럼으로 스크롤한다. */}
      <div className="@container flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 @min-[720px]:grid-cols-[minmax(280px,34%)_1fr] @min-[720px]:overflow-hidden">
          <aside className="flex flex-col rounded-xl border border-border p-3 @min-[720px]:min-h-0 @min-[720px]:overflow-y-auto">
            {departmentsQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
            ) : (
              <OrgChartExplorer
                tree={tree}
                selectedDeptId={selectedDeptId}
                onSelect={handleSelectDept}
                canRegisterDept={false}
                onOpenRegisterDialog={() => {}}
              />
            )}
          </aside>

          <div className="flex min-h-0 flex-col gap-4 @min-[720px]:overflow-y-auto">
            {/* 우측 상단: 사원 프로필 */}
            {selectedEmpId === undefined ? (
              <Placeholder icon={<UserRound className="size-7 opacity-50" aria-hidden="true" />}>
                사원을 선택하세요.
              </Placeholder>
            ) : employeeQuery.isLoading || !employeeQuery.data ? (
              <Placeholder>불러오는 중...</Placeholder>
            ) : (
              <EmployeeSummaryCard
                data={employeeQuery.data}
                empId={selectedEmpId}
                viewerIsSelf={false}
                variant="horizontal"
              />
            )}

            {/* 우측 하단: 부서 멤버 목록 카드 */}
            {selectedDeptId === undefined ? (
              <Placeholder icon={<Building2 className="size-7 opacity-50" aria-hidden="true" />}>
                조직도에서 부서를 선택하세요.
              </Placeholder>
            ) : deptInfoQuery.isLoading || !deptInfoQuery.data ? (
              <Placeholder>부서 정보를 불러오는 중...</Placeholder>
            ) : (
              <DepartmentDetailView
                deptInfo={deptInfoQuery.data.deptInfoResponse}
                deptLeader={deptInfoQuery.data.deptLeader}
                members={deptMembersQuery.data?.content ?? []}
                pageInfo={
                  deptMembersQuery.data ?? {
                    content: [],
                    totalElements: 0,
                    totalPages: 0,
                    number: 0,
                    size: ALL_DEPT_MEMBERS_PAGE_SIZE,
                    first: true,
                    last: true,
                    numberOfElements: 0,
                    empty: true,
                  }
                }
                canManageMembers={false}
                canViewAttendanceBoard={false}
                overlayLayout
                // overlayLayout이라 검색/총원/페이징 UI가 렌더되지 않으므로, 관련 props는
                // 정적 기본값과 no-op으로 채운다(DepartmentDetailView 시그니처 유지용).
                keyword=""
                onKeywordChange={() => {}}
                page={0}
                onPageChange={() => {}}
                size={ALL_DEPT_MEMBERS_PAGE_SIZE}
                onSizeChange={() => {}}
                onRowClick={(empId) => selectEmployee(empId, selectedDeptId)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
