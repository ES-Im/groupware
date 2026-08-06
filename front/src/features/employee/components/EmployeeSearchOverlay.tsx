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
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'
import { useEmployeeQuery } from '../api/useEmployeeQuery'
import { useEmployeeSearchOverlayStore } from '../lib/employeeSearchOverlayStore'
import { EmployeeSummaryCard } from './EmployeeSummaryCard'

const SEARCH_DEBOUNCE_MS = 300

const ALL_DEPARTMENTS_PAGE_SIZE = 500

const ALL_DEPT_MEMBERS_PAGE_SIZE = 500

function Placeholder({
  icon,
  children,
  className,
}: {
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-40 flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground',
        className,
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  )
}

export function EmployeeSearchOverlay() {
  const isOpen = useEmployeeSearchOverlayStore((state) => state.isOpen)
  const close = useEmployeeSearchOverlayStore((state) => state.close)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
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

  const [debouncedKeyword, setDebouncedKeyword] = useState(query.trim())
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const searchResultsQuery = useEmployeeNameSearchQuery(debouncedKeyword)

  const departmentsQuery = useDepartmentsQuery({ size: ALL_DEPARTMENTS_PAGE_SIZE })
  const departments = departmentsQuery.data?.content ?? []
  const deptIds = departments.map((dept) => dept.deptInfoResponse.deptId)
  const memberCountsQuery = useDepartmentMemberCountsQuery(deptIds)
  const tree = buildDepartmentTree(departments, memberCountsQuery.counts)

  const deptSearchResults =
    debouncedKeyword.length > 0
      ? departments.filter((dept) => dept.deptInfoResponse.deptName.includes(debouncedKeyword))
      : []

  const deptInfoQuery = useDepartmentInfoQuery(selectedDeptId)
  const deptMembersQuery = useDepartmentMembersQuery(selectedDeptId, {
    keyword: '',
    page: 0,
    size: ALL_DEPT_MEMBERS_PAGE_SIZE,
  })

  const employeeQuery = useEmployeeQuery(selectedEmpId)

  function handleSelectDept(deptId: number) {
    selectDept(deptId)
  }

  function handleSelectSearchResult(item: DeptMemberSearchResult) {
    selectEmployee(item.empId, item.deptId)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
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

          {debouncedKeyword.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-80 space-y-3 overflow-y-auto rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-md">
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
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="검색창 닫기" onClick={close}>
          <X aria-hidden="true" />
        </Button>
      </div>

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

          <div className="flex min-h-0 flex-col gap-4">
            <div className="shrink-0">
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
            </div>

            <div className="flex min-h-0 flex-col @min-[720px]:flex-1">
              {selectedDeptId === undefined ? (
                <Placeholder
                  icon={<Building2 className="size-7 opacity-50" aria-hidden="true" />}
                  className="@min-[720px]:flex-1"
                >
                  조직도에서 부서를 선택하세요.
                </Placeholder>
              ) : deptInfoQuery.isLoading || !deptInfoQuery.data ? (
                <Placeholder className="@min-[720px]:flex-1">부서 정보를 불러오는 중...</Placeholder>
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
    </div>
  )
}
