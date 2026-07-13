import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { approvalStatusBadgeMap, getApprovalStatusBadge } from '@/features/approval/lib/approvalStatusBadge'
import type { ApprovalStatus } from '@/features/approval/model/approval'
import { usePrimaryDeptId } from '@/features/attendance/model/usePrimaryDeptId'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useDeptEmpLeaveSummaryQuery } from '../api/useDeptEmpLeaveSummaryQuery'
import { useDeptLeaveHistoryQuery } from '../api/useDeptLeaveHistoryQuery'
import { useDeptLeaveUsageSummaryQuery } from '../api/useDeptLeaveUsageSummaryQuery'

/** 검색 디바운스 지연(ms). DeptAttendancePage/DeptBusinessTripHistoryPage와 동일 값을 재사용한다. */
const SEARCH_DEBOUNCE_MS = 300

/** 결재 상태 필터 셀렉트 옵션(approvalStatusBadgeMap 키 그대로 파생 — MyLeavePage 동형, 별도 배열 중복 선언 금지). */
const STATUS_OPTIONS = Object.keys(approvalStatusBadgeMap) as ApprovalStatus[]

/**
 * 부서 휴가 관리 페이지(F744·F745·F746, ROADMAP(LEAVE) M4 T4.3, PRD §페이지별 상세(부서 휴가 관리 페이지)).
 *
 * deptId는 `usePrimaryDeptId()`(strict, 폴백 없음)로 도출한다. useMeQuery가 아직 로딩 중이거나
 * primary 소속이 없으면 deptId가 undefined인데, 이때 두 조회 훅 모두 `enabled:false`로 대기만 할
 * 뿐이라 이 페이지는 `deptId === undefined`를 별도로 감지해 필터/탭 대신 "부서 정보를 확인하는 중"
 * 안내만 렌더하는 게이팅 분기를 둔다(DeptAttendancePage/DeptBusinessTripHistoryPage 동형).
 *
 * 탭①(신청 이력, F744)과 탭②(사용률+부서원 요약, F745·F746)는 각자 독립된 필터/페이지 상태를
 * 가진다(usePageState 별도 인스턴스 — DeptAttendancePage의 탭①/탭② 분리 패턴 동형). 탭 전환으로
 * 비활성 탭의 DOM이 언마운트되어도 이 컴포넌트 최상단 state는 유지되므로 필터·페이지가 보존된다.
 *
 * 탭①의 keyword는 로컬 입력값(historySearchInput)을 300ms 디바운스한 뒤에만 확정 keyword로
 * 반영한다. yearMonth(기본=당월)·approvalStatus·keyword 중 하나라도 바뀌면 resetPage()로 페이지를
 * 0으로 되돌린다. 탭②는 keyword(별도 디바운스)와 year(기본=올해, 마찬가지로 300ms 디바운스) 필터를
 * 공유하며, year는 사용률 카드(F746)와 부서원 요약표(F745) 양쪽 쿼리에 동일하게 반영된다(PRD
 * §페이지별 상세 — 두 조회가 같은 year 축을 공유). year를 keyword와 동일하게 디바운스하는 이유는
 * `type=number` 입력이 확정 없이 즉시 반영되면 키 입력마다(예: "2"→"20"→"202") 두 쿼리가 매번
 * 재요청되고 summaryQuery(keepPreviousData)에 중간값 캐시 키까지 쌓이기 때문이다(code-reviewer 지적,
 * MyLeavePage/AdminLeavePage도 동일하게 통일).
 *
 * 조회 실패(타 부서 접근 403 ROLE_003 포함)는 handleApiError 단일 진입점으로 토스트만 남긴다.
 * 탭① 이력 행 클릭 → 기안서 상세 페이지(①공통, /approval/drafts/{draftId})로 이동한다.
 */
export function DeptLeavePage() {
  const navigate = useNavigate()
  const deptId = usePrimaryDeptId()

  // 탭① 신청 이력 필터/페이지 상태.
  const [historySearchInput, setHistorySearchInput] = useState('')
  const [historyKeyword, setHistoryKeyword] = useState('')
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | undefined>(undefined)
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const { page: historyPage, size: historySize, onPageChange: onHistoryPageChange, resetPage: resetHistoryPage } =
    usePageState()

  // 탭② 부서 사용률 + 부서원 요약 필터/페이지 상태(서로 다른 usePageState 인스턴스 — 탭①과 완전히 독립).
  const [summarySearchInput, setSummarySearchInput] = useState('')
  const [summaryKeyword, setSummaryKeyword] = useState('')
  const [yearInput, setYearInput] = useState(() => String(dayjs().year()))
  const [year, setYear] = useState(() => dayjs().year())
  const { page: summaryPage, size: summarySize, onPageChange: onSummaryPageChange, resetPage: resetSummaryPage } =
    usePageState()

  // 탭① 검색 입력 디바운스: 300ms 유예 후에만 확정 keyword로 반영 + page 리셋.
  useEffect(() => {
    const trimmed = historySearchInput.trim()
    if (trimmed === historyKeyword) {
      return
    }
    const timer = setTimeout(() => {
      setHistoryKeyword(trimmed)
      resetHistoryPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historySearchInput, historyKeyword])

  // 탭② 검색 입력 디바운스: 탭①과 완전히 독립된 별도 상태.
  useEffect(() => {
    const trimmed = summarySearchInput.trim()
    if (trimmed === summaryKeyword) {
      return
    }
    const timer = setTimeout(() => {
      setSummaryKeyword(trimmed)
      resetSummaryPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summarySearchInput, summaryKeyword])

  // 탭② 연도 입력 디바운스: keyword와 동일 패턴(300ms 유예 후에만 확정 year로 반영 + page 리셋).
  // 키 입력마다 즉시 반영하면 usageQuery·summaryQuery가 매 keystroke마다 재요청되고 중간값("2",
  // "20" 등)까지 캐시되는 문제가 있어(code-reviewer 지적), keyword 디바운스와 동형으로 통일한다.
  useEffect(() => {
    const trimmed = yearInput.trim()
    const parsed = Number(trimmed)
    if (trimmed === '' || Number.isNaN(parsed) || parsed === year) {
      return
    }
    const timer = setTimeout(() => {
      setYear(parsed)
      resetSummaryPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearInput, year])

  const historyQuery = useDeptLeaveHistoryQuery(deptId, {
    keyword: historyKeyword || undefined,
    approvalStatus,
    yearMonth,
    page: historyPage,
    size: historySize,
  })

  useEffect(() => {
    if (!historyQuery.error) {
      return
    }
    handleApiError(historyQuery.error, { toast })
  }, [historyQuery.error])

  const usageQuery = useDeptLeaveUsageSummaryQuery(deptId, { year })

  useEffect(() => {
    if (!usageQuery.error) {
      return
    }
    handleApiError(usageQuery.error, { toast })
  }, [usageQuery.error])

  const summaryQuery = useDeptEmpLeaveSummaryQuery(deptId, {
    keyword: summaryKeyword || undefined,
    year,
    page: summaryPage,
    size: summarySize,
  })

  useEffect(() => {
    if (!summaryQuery.error) {
      return
    }
    handleApiError(summaryQuery.error, { toast })
  }, [summaryQuery.error])

  function handleYearMonthChange(value: string) {
    setYearMonth(value)
    resetHistoryPage()
  }

  function handleStatusChange(value: string) {
    setApprovalStatus(value === '' ? undefined : (value as ApprovalStatus))
    resetHistoryPage()
  }

  const historyRows = historyQuery.data?.content ?? []
  const historyPageInfo: PageMeta = historyQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: historySize,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const summaryRows = summaryQuery.data?.content ?? []
  const summaryPageInfo: PageMeta = summaryQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: summarySize,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-[1.375rem] font-semibold tracking-tight">부서 휴가 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          부서원 휴가 신청 이력과 사용 현황을 확인합니다.
        </p>
      </header>

      {deptId === undefined ? (
        <Card className="h-fit">
          <CardContent>
            <p className="py-8 text-center text-sm text-muted-foreground">
              부서 정보를 확인하는 중입니다...
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="history" className="gap-3">
          <TabsList>
            <TabsTrigger value="history">신청 이력</TabsTrigger>
            <TabsTrigger value="summary">부서 요약</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card className="h-fit">
              <CardHeader className="border-b">
                <CardTitle>휴가 신청 이력</CardTitle>
                <CardDescription>부서원의 휴가 신청 이력과 결재 상태를 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 필터 툴바: 부서원 이름 검색 + 조회 월(yyyy-MM) + 결재 상태 필터 */}
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <label htmlFor="dept-leave-history-keyword" className="sr-only">
                      부서원 이름 검색
                    </label>
                    <Input
                      id="dept-leave-history-keyword"
                      type="search"
                      value={historySearchInput}
                      onChange={(event) => setHistorySearchInput(event.target.value)}
                      placeholder="부서원 이름 검색..."
                      className="pl-8"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="dept-leave-history-month" className="sr-only">
                      조회 월
                    </label>
                    <Input
                      id="dept-leave-history-month"
                      type="month"
                      value={yearMonth}
                      onChange={(event) => handleYearMonthChange(event.target.value)}
                      className="w-auto"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="dept-leave-history-status" className="sr-only">
                      결재 상태 필터
                    </label>
                    <select
                      id="dept-leave-history-status"
                      value={approvalStatus ?? ''}
                      onChange={(event) => handleStatusChange(event.target.value)}
                      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="">전체</option>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {approvalStatusBadgeMap[option].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {yearMonth} 이력만 표시됩니다. 다른 달을 보려면 조회 월을 변경하세요.
                </p>

                {historyQuery.isLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
                ) : historyQuery.error ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    부서 휴가 이력을 불러오지 못했습니다.
                  </p>
                ) : historyRows.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    조회 조건에 해당하는 휴가 신청 이력이 없습니다.
                  </p>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                            사원
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                            유형
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                            기간
                          </th>
                          <th className="px-3 py-2.5 text-center text-xs font-medium whitespace-nowrap text-muted-foreground">
                            신청일수
                          </th>
                          <th className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap text-muted-foreground">
                            결재 상태
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyRows.map((row) => {
                          const { label, variant } = getApprovalStatusBadge(
                            row.historyResponse.approvalStatus,
                          )
                          const draftId = row.historyResponse.draftId
                          return (
                            <tr
                              key={draftId}
                              role="button"
                              tabIndex={0}
                              onClick={() => navigate(`/approval/drafts/${draftId}`)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  navigate(`/approval/drafts/${draftId}`)
                                }
                              }}
                              className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                            >
                              <td className="px-3 py-3 align-middle whitespace-nowrap">
                                <div className="flex items-center gap-2.5">
                                  <BlobAvatar
                                    empId={row.empId}
                                    fileId={undefined}
                                    fallbackText={row.empName}
                                    className="size-7"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground">{row.empName}</p>
                                    <p className="font-mono text-[11px] text-muted-foreground">
                                      {row.empNo}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 align-middle whitespace-nowrap">
                                <Badge variant="secondary">{row.historyResponse.leaveType}</Badge>
                              </td>
                              <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground">
                                {row.historyResponse.startAt} ~ {row.historyResponse.endAt}
                              </td>
                              <td className="px-3 py-3 text-center align-middle whitespace-nowrap tabular-nums">
                                <span className="font-semibold text-foreground">
                                  {row.historyResponse.requestedLeaveDays}
                                </span>
                                <span className="text-muted-foreground">일</span>
                              </td>
                              <td className="px-3 py-3 text-right align-middle whitespace-nowrap">
                                <Badge variant={variant}>{label}</Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationControls
                  className="border-t pt-4"
                  pageInfo={historyPageInfo}
                  page={historyPage}
                  onPageChange={onHistoryPageChange}
                  unit="건"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card className="mb-6 h-fit">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>부서 연차 사용률</CardTitle>
                    <CardDescription>부서 기본 연차 사용률입니다.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="dept-leave-summary-year" className="sr-only">
                      조회 연도
                    </label>
                    <Input
                      id="dept-leave-summary-year"
                      type="number"
                      value={yearInput}
                      onChange={(event) => setYearInput(event.target.value)}
                      className="w-24"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usageQuery.isLoading ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
                ) : !usageQuery.data ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    사용률 정보를 불러오지 못했습니다.
                  </p>
                ) : (
                  <div className="flex items-center gap-5">
                    {/* 연차 사용률 도넛: conic-gradient로 primary(사용)·muted(잔여) 비율을 그린다. */}
                    <div
                      className="grid size-24 shrink-0 place-items-center rounded-full"
                      style={{
                        background: `conic-gradient(var(--primary) 0 ${usageQuery.data.annualLeaveUsagePercent}%, var(--muted) ${usageQuery.data.annualLeaveUsagePercent}% 100%)`,
                      }}
                    >
                      <div className="grid size-[68px] place-items-center rounded-full bg-card">
                        <span className="text-xl font-bold tabular-nums text-foreground">
                          {usageQuery.data.annualLeaveUsagePercent}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      부서 기본 연차 사용률
                      <br />
                      부여 대비 연차 소진 비율입니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader className="border-b">
                <CardTitle>부서원 휴가 요약</CardTitle>
                <CardDescription>부서원별 연차·특별·포상 휴가의 부여·사용·잔여 일수입니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <label htmlFor="dept-leave-summary-keyword" className="sr-only">
                    부서원 이름 검색
                  </label>
                  <Input
                    id="dept-leave-summary-keyword"
                    type="search"
                    value={summarySearchInput}
                    onChange={(event) => setSummarySearchInput(event.target.value)}
                    placeholder="부서원 이름 검색..."
                    className="pl-8"
                  />
                </div>

                {summaryQuery.isLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
                ) : summaryQuery.error ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    부서원 휴가 요약을 불러오지 못했습니다.
                  </p>
                ) : summaryRows.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    조회 조건에 해당하는 부서원 휴가 요약이 없습니다.
                  </p>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                            사원
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                            직책
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                            연차
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                            특별휴가
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                            포상휴가
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryRows.map((row) => {
                          const categories = [
                            {
                              key: 'annual',
                              grant: row.leaveSummary.annualBaseGrantDays,
                              used: row.leaveSummary.annualUsedDays,
                            },
                            {
                              key: 'special',
                              grant: row.leaveSummary.specialGrantDays,
                              used: row.leaveSummary.specialUsedDays,
                            },
                            {
                              key: 'compensatory',
                              grant: row.leaveSummary.compensatoryGrantDays,
                              used: row.leaveSummary.compensatoryUsedDays,
                            },
                          ]
                          return (
                            <tr
                              key={row.empId}
                              className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                            >
                              <td className="px-3 py-3 align-middle whitespace-nowrap">
                                <div className="flex items-center gap-2.5">
                                  <BlobAvatar
                                    empId={row.empId}
                                    fileId={undefined}
                                    fallbackText={row.empName}
                                    className="size-7"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground">{row.empName}</p>
                                    <p className="font-mono text-[11px] text-muted-foreground">
                                      {row.empNo}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground">
                                {row.positionName}
                              </td>
                              {categories.map((category) => (
                                <td
                                  key={category.key}
                                  className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground tabular-nums"
                                >
                                  <span className="block text-xs">
                                    부여 {category.grant} · 사용 {category.used}
                                  </span>
                                  <span className="block text-xs font-semibold text-foreground">
                                    잔여 {category.grant - category.used}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <PaginationControls
                  className="border-t pt-4"
                  pageInfo={summaryPageInfo}
                  page={summaryPage}
                  onPageChange={onSummaryPageChange}
                  unit="명"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
