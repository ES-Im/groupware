import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { usePrimaryDeptId } from '@/features/attendance/model/usePrimaryDeptId'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { useDeptBusinessTripHistoryQuery } from '../api/useDeptBusinessTripHistoryQuery'
import { approvalStatusBadgeMap, getApprovalStatusBadge } from '../lib/approvalStatusBadge'
import type { ApprovalStatus } from '../model/approval'

const SEARCH_DEBOUNCE_MS = 300

const STATUS_OPTIONS = Object.keys(approvalStatusBadgeMap) as ApprovalStatus[]

export function DeptBusinessTripHistoryPage() {
  const navigate = useNavigate()
  const deptId = usePrimaryDeptId()

  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | undefined>(undefined)
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const { page, size, onPageChange, resetPage } = usePageState()

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

  const historyQuery = useDeptBusinessTripHistoryQuery(deptId, {
    keyword: keyword || undefined,
    approvalStatus,
    yearMonth,
    page,
    size,
  })

  useEffect(() => {
    if (!historyQuery.error) {
      return
    }
    handleApiError(historyQuery.error, { toast })
  }, [historyQuery.error])

  function handleYearMonthChange(value: string) {
    setYearMonth(value)
    resetPage()
  }

  function handleStatusChange(value: string) {
    setApprovalStatus(value === '' ? undefined : (value as ApprovalStatus))
    resetPage()
  }

  const rows = historyQuery.data?.content ?? []

  const pageInfo: PageMeta = historyQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-[1.375rem] font-semibold tracking-tight">부서 출장 이력</h1>
        <p className="mt-1 text-sm text-muted-foreground">부서원의 출장 신청 이력을 확인합니다.</p>
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
        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle>출장 신청 이력</CardTitle>
            <CardDescription>부서원의 출장 신청 이력과 결재 상태를 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <label htmlFor="dept-business-trip-keyword" className="sr-only">
                  사원 이름 검색
                </label>
                <Input
                  id="dept-business-trip-keyword"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="사원 이름 검색..."
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="dept-business-trip-month" className="sr-only">
                  조회 월
                </label>
                <Input
                  id="dept-business-trip-month"
                  type="month"
                  value={yearMonth}
                  onChange={(event) => handleYearMonthChange(event.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="dept-business-trip-status" className="sr-only">
                  결재 상태 필터
                </label>
                <select
                  id="dept-business-trip-status"
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
                <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                  불러오는 중...
                </p>
              ) : historyQuery.error ? (
                <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                  부서 출장 이력을 불러오지 못했습니다.
                </p>
              ) : rows.length === 0 ? (
                <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                  출장 이력이 없습니다.
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
                        기간
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                        목적지
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                        목적
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap text-muted-foreground">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
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
                          <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground">
                            {row.historyResponse.startAt} ~ {row.historyResponse.endAt}
                          </td>
                          <td className="px-3 py-3 align-middle font-medium text-foreground">
                            {row.historyResponse.destination}
                          </td>
                          <td className="px-3 py-3 align-middle text-muted-foreground">
                            {row.historyResponse.purpose}
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
              pageInfo={pageInfo}
              page={page}
              onPageChange={onPageChange}
              unit="건"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
