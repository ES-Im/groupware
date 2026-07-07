import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useDepartmentsQuery } from '../api/useDepartmentsQuery'
import { DepartmentsTable } from '../components/DepartmentsTable'
import { RegisterDepartmentDialog } from '../components/RegisterDepartmentDialog'

/** 검색 디바운스 지연(ms). DepartmentDetailView(T2.1-b)와 동일한 값을 재사용한다. */
const SEARCH_DEBOUNCE_MS = 300

/** 페이지 크기 선택 옵션. DepartmentDetailView의 PAGE_SIZE_OPTIONS 패턴을 재사용한다. */
const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const

/** 활성상태 필터 값. undefined는 "전체"(isActive 쿼리 파라미터 생략)를 의미한다. */
type ActiveFilter = 'all' | 'active' | 'inactive'

/**
 * 부서 목록 페이지("조직도", F201, ROADMAP T6.3, PRD §3 부서 목록 페이지).
 *
 * 전사 부서를 열람하는 디렉터리 화면이다(기존 "부서 멤버 목록" `/department-members`는
 * 본인 소속 부서만 자동 표시하는 개인 바로가기로 별개 — PRD §메뉴 구조).
 *
 * keyword는 로컬 입력값을 디바운스한 뒤에만 쿼리 파라미터로 반영한다(DepartmentDetailView와 동일
 * 패턴). keyword/activeFilter/size 변경 시 page를 0으로 리셋해 존재하지 않는 페이지 조회를 막는다.
 *
 * 행 클릭은 `/departments/:deptId`로 이동시키기만 한다 — 실제 상세 컨테이너 페이지는 M7(T7.1)
 * 스코프이므로 아직 없다(이번 태스크는 네비게이션 경로만 배선).
 *
 * ADMIN 전용 "부서 등록" 버튼(F204, DEPT_REGISTER, ROADMAP T8.1)은 hasRequiredRole로 게이팅해
 * RegisterDepartmentDialog를 여닫는다 — 등록 성공 시 다이얼로그 내부 mutation이 이 페이지의
 * useDepartmentsQuery 캐시(departmentKeys.all)를 invalidate해 목록이 자동 재조회된다.
 */
export function DepartmentsPage() {
  const navigate = useNavigate()
  const roles = useAuthStore((state) => state.roles)
  const canRegisterDept = hasRequiredRole(roles, 'ADMIN')
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)

  // 검색 입력 디바운스: 300ms 유예 후에만 확정된 keyword로 반영하고 페이지를 0으로 리셋한다.
  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => {
      setKeyword(trimmed)
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword])

  const isActive = activeFilter === 'all' ? undefined : activeFilter === 'active'
  const departmentsQuery = useDepartmentsQuery({ keyword, isActive, page, size })

  // 조회 실패 중 not-found가 아닌 경우만 토스트로 알린다(not-found는 아래에서 전용 UX로 렌더).
  useEffect(() => {
    if (!departmentsQuery.error) {
      return
    }
    const apiError = normalizeApiError(departmentsQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [departmentsQuery.error])

  function handleRowClick(deptId: number) {
    navigate(`/departments/${deptId}`)
  }

  function handleActiveFilterChange(value: ActiveFilter) {
    setActiveFilter(value)
    setPage(0)
  }

  function handleSizeChange(value: number) {
    setSize(value)
    setPage(0)
  }

  const pageData = departmentsQuery.data
  const departments = pageData?.content ?? []
  const totalElements = pageData?.totalElements ?? 0
  const totalPages = pageData?.totalPages || 1
  const rangeStart = totalElements === 0 ? 0 : (pageData?.number ?? 0) * (pageData?.size ?? size) + 1
  const rangeEnd = (pageData?.number ?? 0) * (pageData?.size ?? size) + departments.length

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">조직도</h1>
        {canRegisterDept && (
          <Button type="button" size="sm" onClick={() => setIsRegisterDialogOpen(true)}>
            <Plus />
            부서 등록
          </Button>
        )}
      </div>

      <RegisterDepartmentDialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen} />

      <Card className="h-fit">
        <CardContent className="space-y-4">
          {/* 툴바: 검색 + 활성상태 필터 + 페이지 크기 select */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="dept-search" className="sr-only">
                부서명 검색
              </label>
              <Input
                id="dept-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="부서명 검색..."
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="dept-active-filter" className="sr-only">
                활성상태 필터
              </label>
              <select
                id="dept-active-filter"
                value={activeFilter}
                onChange={(event) => handleActiveFilterChange(event.target.value as ActiveFilter)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="all">전체</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
              <label htmlFor="dept-page-size" className="sr-only">
                페이지 크기
              </label>
              <select
                id="dept-page-size"
                value={size}
                onChange={(event) => handleSizeChange(Number(event.target.value))}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}개씩
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 표 영역: 로딩/에러/빈 상태를 순서대로 분기한다.
              placeholderData: keepPreviousData(useDepartmentsQuery)가 검색·필터·페이지 변경 중에도
              이전 목록을 유지하므로, isLoading은 최초 로딩에서만 true가 되어 깜빡임이 발생하지 않는다. */}
          {departmentsQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : departmentsQuery.error ? (
            isNotFound(normalizeApiError(departmentsQuery.error)) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                조회된 부서가 없습니다.
              </p>
            ) : (
              // not-found가 아닌 실패는 위 useEffect가 토스트로 알렸으므로, 화면은 빈 상태로만 표시한다.
              <p className="py-8 text-center text-sm text-muted-foreground">
                부서 목록을 불러오지 못했습니다.
              </p>
            )
          ) : (
            <DepartmentsTable data={departments} onRowClick={handleRowClick} />
          )}

          {/* 하단 페이지네이션 */}
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              총 {totalElements}개 중 {rangeStart}-{rangeEnd} 표시
            </p>
            <nav className="flex items-center gap-2" aria-label="페이지 이동">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageData?.first ?? true}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft />
                이전
              </Button>
              <span className="min-w-16 text-center text-sm text-muted-foreground">
                {(pageData?.number ?? 0) + 1} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageData?.last ?? true}
                onClick={() => setPage((current) => current + 1)}
              >
                다음
                <ChevronRight />
              </Button>
            </nav>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
