import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useDeptAttendanceMonthlyQuery } from '../api/useDeptAttendanceMonthlyQuery'
import { useDeptAttendancePendingQuery } from '../api/useDeptAttendancePendingQuery'
import { DeptAttendanceMonthlyTable } from '../components/DeptAttendanceMonthlyTable'
import { DeptAttendancePendingTable } from '../components/DeptAttendancePendingTable'
import { UpdateAttendanceDialog } from '../components/UpdateAttendanceDialog'
import { attendanceStatusBadgeMap } from '../lib/attendanceStatusBadge'
import type { AttendanceStatus } from '../model/attendance'
import type { AttendanceEditTarget } from '../model/deptAttendance'
import { usePrimaryDeptId } from '../model/usePrimaryDeptId'

/** 검색 디바운스 지연(ms). DepartmentsPage/DepartmentDetailView와 동일 값을 재사용한다. */
const SEARCH_DEBOUNCE_MS = 300

/** 근태 상태 필터 셀렉트 옵션(attendanceStatusBadgeMap 키 그대로 파생 — MyAttendancePage와 별도 배열 중복 선언 금지). */
const STATUS_OPTIONS = Object.keys(attendanceStatusBadgeMap) as AttendanceStatus[]

/**
 * 부서 근태 관리 페이지(ROADMAP2 T3.4-a/T3.4-b, docs/prd/5.attendance-prd.md §페이지별 상세(부서 근태 관리)).
 *
 * shadcn Tabs로 셸을 구성한다: 탭①(월별 근태, F305)은 T3.4-a가 완성했고, 탭②(승인 대기, F306)는
 * T3.4-b가 이 태스크에서 완성한다. 탭②는 계약상 필터가 page/size뿐이라(query-parameters.adoc
 * DEPT_ATTENDANCE_PENDING 실측) 탭①과 달리 검색/월/상태 필터 UI가 없다.
 *
 * 탭①의 필터/페이지 상태(keyword/yearMonth/status/usePageState)와 탭②의 페이지 상태
 * (별도 usePageState 호출)는 서로 다른 useState/usePageState 호출로 완전히 독립된 스코프를
 * 가진다. 두 상태 모두 이 페이지 컴포넌트(DeptAttendancePage) 최상단에서 선언되고 각 쿼리 훅도
 * 여기서 호출되므로(Radix Tabs.Content가 비활성 탭의 DOM만 언마운트할 뿐 이 최상위 함수 자체는
 * 리렌더되지 않는 한 계속 유지됨), 탭①에서 페이지를 이동한 뒤 탭②로 전환해도 탭①의 page/필터
 * 상태가 그대로 보존된다(반대 방향도 동일).
 *
 * deptId는 T3.2(usePrimaryDeptId, 폴백 없는 엄격 도출)로 얻는다. useMeQuery가 아직 로딩 중이거나
 * isPrimary 소속이 없으면 deptId가 undefined인데, 이때 useDeptAttendanceMonthlyQuery는
 * `enabled:false`로 대기만 할 뿐 isLoading을 true로 만들지 않는다(TanStack Query v5, disabled query는
 * status:'pending'이지만 fetchStatus:'idle'). 그래서 이 페이지는 `deptId === undefined`를 별도로
 * 감지해 필터/표 대신 "부서 정보를 확인하는 중" 안내만 렌더하는 전용 게이팅 분기를 둔다(MyAttendancePage엔
 * 없던 케이스 — 본인 근태는 deptId 개념이 없어 이 대기 상태가 발생하지 않는다).
 *
 * keyword는 DepartmentsPage와 동일하게 로컬 입력값(searchInput)을 300ms 디바운스한 뒤에만 확정
 * keyword로 반영한다. yearMonth(기본=현재월)·status·keyword 중 하나라도 바뀌면 resetPage()로 페이지를
 * 0으로 되돌려 존재하지 않는 페이지를 조회하는 사고를 막는다(usePageState 표준, T10.1).
 *
 * 조회 실패는 MyAttendancePage와 동일하게 handleApiError(공용 에러 코드 분기)로 토스트만 남긴다 —
 * 타 부서 접근 403(ROLE_003)도 이 단일 진입점이 그대로 처리한다(별도 재구현 금지).
 *
 * 근태 수정 다이얼로그(T4.3, F307)는 `editTarget`(단일 상태) 하나로 두 탭을 모두 커버한다.
 * 탭①·탭②의 [수정] 버튼은 각자 대상 근태를 `setEditTarget`으로 넘길 뿐이고, 다이얼로그
 * 인스턴스는 이 컴포넌트 최하단에 하나만 마운트한다(Tabs와 무관하게 항상 렌더).
 */
export function DeptAttendancePage() {
  const deptId = usePrimaryDeptId()

  // 근태 수정 다이얼로그(T4.3) 대상. null이면 닫힘, 탭①·탭② 어느 쪽 [수정] 버튼을 눌러도
  // 동일한 상태 하나(단일 다이얼로그 인스턴스)를 채운다.
  const [editTarget, setEditTarget] = useState<AttendanceEditTarget | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [status, setStatus] = useState<AttendanceStatus | undefined>(undefined)
  const { page, size, onPageChange, resetPage } = usePageState()

  // 탭②(승인 대기) 전용 페이지 상태 — 탭①의 usePageState 인스턴스와 완전히 분리된 별도 훅 호출.
  // 필터가 page/size뿐이라 resetPage를 트리거할 다른 필터 상태가 없다.
  const {
    page: pendingPage,
    size: pendingSize,
    onPageChange: onPendingPageChange,
  } = usePageState()

  // 검색 입력 디바운스(DepartmentsPage와 동일 패턴): 300ms 유예 후에만 확정 keyword로 반영 + page 리셋.
  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => {
      setKeyword(trimmed)
      resetPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, keyword])

  const monthlyQuery = useDeptAttendanceMonthlyQuery(deptId, {
    keyword: keyword || undefined,
    yearMonth,
    status,
    page,
    size,
  })

  useEffect(() => {
    if (!monthlyQuery.error) {
      return
    }
    handleApiError(monthlyQuery.error, { toast })
  }, [monthlyQuery.error])

  const pendingQuery = useDeptAttendancePendingQuery(deptId, {
    page: pendingPage,
    size: pendingSize,
  })

  useEffect(() => {
    if (!pendingQuery.error) {
      return
    }
    handleApiError(pendingQuery.error, { toast })
  }, [pendingQuery.error])

  function handleYearMonthChange(value: string) {
    setYearMonth(value)
    resetPage()
  }

  function handleStatusChange(value: string) {
    setStatus(value === '' ? undefined : (value as AttendanceStatus))
    resetPage()
  }

  const pageInfo: PageMeta = monthlyQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const pendingPageInfo: PageMeta = pendingQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: pendingSize,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">부서 근태 관리</h1>
      </div>

      {deptId === undefined ? (
        <Card className="h-fit">
          <CardContent>
            <p className="py-8 text-center text-sm text-muted-foreground">
              부서 정보를 확인하는 중입니다...
            </p>
          </CardContent>
        </Card>
      ) : (
        // Tabs 루트는 기본 gap-2라 탭바와 카드가 다소 붙어 보여 gap-3으로 살짝 띄운다(시각 조정만).
        <Tabs defaultValue="monthly" className="gap-3">
          <TabsList>
            <TabsTrigger value="monthly">월별 근태</TabsTrigger>
            <TabsTrigger value="pending">승인 대기</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <Card className="h-fit">
              <CardContent className="space-y-4">
                {/* 필터 툴바: 부서원 이름 검색 + 조회 월(yyyy-MM) + 근태 상태 필터 */}
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <label htmlFor="dept-attendance-keyword" className="sr-only">
                      부서원 이름 검색
                    </label>
                    <Input
                      id="dept-attendance-keyword"
                      type="search"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="부서원 이름 검색..."
                      className="pl-8"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="dept-attendance-month" className="sr-only">
                      조회 월
                    </label>
                    <Input
                      id="dept-attendance-month"
                      type="month"
                      value={yearMonth}
                      onChange={(event) => handleYearMonthChange(event.target.value)}
                      className="w-auto"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="dept-attendance-status-select" className="sr-only">
                      근태 상태 필터
                    </label>
                    <select
                      id="dept-attendance-status-select"
                      value={status ?? ''}
                      onChange={(event) => handleStatusChange(event.target.value)}
                      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="">전체</option>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {attendanceStatusBadgeMap[option].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {monthlyQuery.isLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
                ) : monthlyQuery.error ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    부서 근태 목록을 불러오지 못했습니다.
                  </p>
                ) : (
                  <DeptAttendanceMonthlyTable
                    data={monthlyQuery.data?.content ?? []}
                    onEdit={setEditTarget}
                  />
                )}

                <PaginationControls
                  className="border-t pt-4"
                  pageInfo={pageInfo}
                  page={page}
                  onPageChange={onPageChange}
                  unit="명"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            {/* 승인 대기 탭(F306, T3.4-b). 계약상 필터가 page/size뿐이라 검색/월/상태 UI는 없다. */}
            <Card className="h-fit">
              <CardContent className="space-y-4">
                {pendingQuery.isLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
                ) : pendingQuery.error ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    승인 대기 목록을 불러오지 못했습니다.
                  </p>
                ) : (
                  <DeptAttendancePendingTable
                    data={pendingQuery.data?.content ?? []}
                    onEdit={setEditTarget}
                  />
                )}

                <PaginationControls
                  className="border-t pt-4"
                  pageInfo={pendingPageInfo}
                  page={pendingPage}
                  onPageChange={onPendingPageChange}
                  unit="건"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <UpdateAttendanceDialog
        open={editTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditTarget(null)
          }
        }}
        target={editTarget}
      />
    </div>
  )
}
