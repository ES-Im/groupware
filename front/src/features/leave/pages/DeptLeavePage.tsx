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
import { formatUsagePercent } from '../lib/formatUsagePercent'

const SEARCH_DEBOUNCE_MS = 300

const STATUS_OPTIONS = Object.keys(approvalStatusBadgeMap) as ApprovalStatus[]

export function DeptLeavePage() {
  const navigate = useNavigate()
  const deptId = usePrimaryDeptId()

  const [historySearchInput, setHistorySearchInput] = useState('')
  const [historyKeyword, setHistoryKeyword] = useState('')
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | undefined>(undefined)
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const { page: historyPage, size: historySize, onPageChange: onHistoryPageChange, resetPage: resetHistoryPage } =
    usePageState()

  const [summarySearchInput, setSummarySearchInput] = useState('')
  const [summaryKeyword, setSummaryKeyword] = useState('')
  const [yearInput, setYearInput] = useState(() => String(dayjs().year()))
  const [year, setYear] = useState(() => dayjs().year())
  const { page: summaryPage, size: summarySize, onPageChange: onSummaryPageChange, resetPage: resetSummaryPage } =
    usePageState()

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

                <div className="flex min-h-[38rem] flex-col">
                {historyQuery.isLoading ? (
                  <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">불러오는 중...</p>
                ) : historyQuery.error ? (
                  <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                    부서 휴가 이력을 불러오지 못했습니다.
                  </p>
                ) : historyRows.length === 0 ? (
                  <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
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
                </div>

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
                    <div
                      className="grid size-24 shrink-0 place-items-center rounded-full"
                      style={{
                        background: `conic-gradient(var(--primary) 0 ${usageQuery.data.annualLeaveUsagePercent}%, var(--muted) ${usageQuery.data.annualLeaveUsagePercent}% 100%)`,
                      }}
                    >
                      <div className="grid size-[68px] place-items-center rounded-full bg-card">
                        <span className="text-xl font-bold tabular-nums text-foreground">
                          {formatUsagePercent(usageQuery.data.annualLeaveUsagePercent)}%
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
