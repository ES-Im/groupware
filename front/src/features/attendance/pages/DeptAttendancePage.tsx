import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import type { EventClickArg } from '@fullcalendar/core'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useDeptAttendanceMonthlyQuery } from '../api/useDeptAttendanceMonthlyQuery'
import { useDeptAttendancePendingQuery } from '../api/useDeptAttendancePendingQuery'
import { AttendanceCalendar } from '../components/AttendanceCalendar'
import { DeptAttendanceMemberList } from '../components/DeptAttendanceMemberList'
import { DeptAttendancePendingTable } from '../components/DeptAttendancePendingTable'
import { UpdateAttendanceDialog } from '../components/UpdateAttendanceDialog'
import { attendanceStatusBadgeMap } from '../lib/attendanceStatusBadge'
import { mapAttendanceToEvents } from '../lib/mapAttendanceToEvents'
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
 * T3.4-b가 이 태스크에서 완성했다. query-parameters.adoc 실측(현재)은 아직 page/size뿐이지만,
 * DEPT_ATTENDANCE_MONTHLY와 동일한 단일값 `status` 필터가 백엔드에 곧 추가될 예정이라(사용자 확인)
 * 탭②도 탭①과 동일한 서버 사이드 status 필터 컨벤션으로 미리 맞춰뒀다 — 검색/월 필터는 계약에
 * 없어 그대로 없다.
 *
 * 탭①의 필터/페이지 상태(keyword/yearMonth/status/usePageState)와 탭②의 필터/페이지 상태
 * (status/usePageState, 별도 훅 호출)는 서로 다른 useState/usePageState 호출로 완전히 독립된
 * 스코프를 가진다. 두 상태 모두 이 페이지 컴포넌트(DeptAttendancePage) 최상단에서 선언되고 각
 * 쿼리 훅도 여기서 호출되므로(Radix Tabs.Content가 비활성 탭의 DOM만 언마운트할 뿐 이 최상위
 * 함수 자체는 리렌더되지 않는 한 계속 유지됨), 탭①에서 페이지를 이동한 뒤 탭②로 전환해도 탭①의
 * page/필터 상태가 그대로 보존된다(반대 방향도 동일).
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

  // 월별 탭(마스터-디테일) 좌측 목록에서 선택된 사원. 셀렉션 전용 로컬 state로, 우측 캘린더 상세를
  // 결정한다(라우트/URL 파라미터 미도입).
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [status, setStatus] = useState<AttendanceStatus | undefined>(undefined)
  const { page, size, onPageChange, resetPage } = usePageState()

  // 탭②(승인 대기) 전용 필터/페이지 상태 — 탭①의 useState/usePageState 인스턴스와 완전히 분리된
  // 별도 선언. status는 서버 사이드 필터(getDeptAttendancePending 참고, 백엔드 반영 예정)라
  // useDeptAttendancePendingQuery에 그대로 전달한다. Tabs.Content가 비활성 탭을 언마운트하므로
  // 이 상위 컴포넌트가 계속 들고 있어야 탭 전환 후에도 유지된다(탭①과 동일 컨벤션).
  const [pendingStatus, setPendingStatus] = useState<AttendanceStatus | undefined>(undefined)
  const {
    page: pendingPage,
    size: pendingSize,
    onPageChange: onPendingPageChange,
    resetPage: resetPendingPage,
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

  // 좌측 목록에서 선택된 사원의 행(없으면 null). content는 react-query가 참조를 유지하므로
  // selectedEmpId/데이터가 바뀔 때만 새 참조가 된다.
  const monthlyRows = monthlyQuery.data?.content ?? []
  const selectedRow =
    selectedEmpId === null ? null : (monthlyRows.find((row) => row.empInfo.empId === selectedEmpId) ?? null)

  // 선택 사원의 근태 상세 배열 → FullCalendar 이벤트. 선택이 없으면 빈 배열.
  const calendarEvents = useMemo(
    () => (selectedRow ? mapAttendanceToEvents(selectedRow.attendanceInfo, selectedRow.empInfo.empId) : []),
    [selectedRow],
  )

  // 캘린더 이벤트 클릭 → 미승인 근태일 때만 수정 다이얼로그(F307)를 연다(승인된 근태는 서버가 수정
  // 자체를 거부하므로 무시). 대상 근태 페이로드는 mapAttendanceToEvents가 extendedProps로 실어 둔다.
  function handleCalendarEventClick(arg: EventClickArg) {
    const props = arg.event.extendedProps as {
      targetEmpId: number
      attendanceId: number
      startAt: string | null
      endAt: string | null
      isApproved: boolean
    }
    if (props.isApproved) {
      return
    }
    setEditTarget({
      targetEmpId: props.targetEmpId,
      attendanceId: props.attendanceId,
      startAt: props.startAt,
      endAt: props.endAt,
    })
  }

  const pendingQuery = useDeptAttendancePendingQuery(deptId, {
    status: pendingStatus,
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

  function handlePendingStatusChange(nextStatus: AttendanceStatus | undefined) {
    setPendingStatus(nextStatus)
    resetPendingPage()
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
            {/* 마스터-디테일 2분할: 좌측(필터+사원 목록+페이지네이션) / 우측(선택 사원 근태 캘린더).
                DepartmentsExplorerLayout의 grid 패턴을 근태 목록 폭에 맞춰 좁게 조정한다. */}
            <div className="grid gap-4 lg:grid-cols-[minmax(280px,34%)_1fr]">
              <Card className="h-fit">
                <CardContent className="space-y-4">
                  {/* 필터 툴바: 부서원 이름 검색 + 조회 월(yyyy-MM) + 근태 상태 필터 */}
                  <div className="flex flex-col gap-3">
                    <div className="relative w-full">
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
                    <div className="flex flex-wrap items-center gap-2">
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
                    <DeptAttendanceMemberList
                      data={monthlyRows}
                      selectedEmpId={selectedEmpId}
                      onSelect={setSelectedEmpId}
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

              {/* 우측 상세: 선택 사원의 근태 캘린더. height="100%" 성립을 위해 카드에 고정 높이를 준다. */}
              <Card className="h-[440px] lg:sticky lg:top-4 lg:h-[560px]">
                <CardContent className="flex h-full min-h-0 flex-col">
                  {selectedRow ? (
                    <>
                      <header className="mb-3 shrink-0">
                        <h2 className="text-sm font-semibold text-foreground">
                          {selectedRow.empInfo.empName}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {selectedRow.empInfo.positionName} · {dayjs(yearMonth).format('YYYY년 M월')}
                        </p>
                      </header>
                      <div className="min-h-0 flex-1">
                        <AttendanceCalendar
                          key={yearMonth}
                          events={calendarEvents}
                          initialDate={`${yearMonth}-01`}
                          onEventClick={handleCalendarEventClick}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="max-w-xs text-center text-sm text-muted-foreground">
                        좌측 목록에서 부서원을 선택하면 해당 월 근태 캘린더가 표시됩니다.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            {/* 승인 대기 탭(F306, T3.4-b). status는 서버 사이드 필터로 pendingQuery에 그대로
                전달되고(백엔드 반영 예정, useDeptAttendancePendingQuery 참고), 페이지네이션도
                탭①과 동일하게 서버 page/size를 그대로 쓴다 — 클라이언트 전량 조회/재슬라이싱 없음. */}
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
                    totalElements={pendingQuery.data?.totalElements ?? 0}
                    onEdit={setEditTarget}
                    status={pendingStatus}
                    onStatusChange={handlePendingStatusChange}
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
