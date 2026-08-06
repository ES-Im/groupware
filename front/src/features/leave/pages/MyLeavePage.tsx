import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { approvalStatusBadgeMap, getApprovalStatusBadge } from '@/features/approval/lib/approvalStatusBadge'
import type { ApprovalStatus } from '@/features/approval/model/approval'
import { handleApiError } from '@/shared/lib/apiError'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useMyLeaveHistoryQuery } from '../api/useMyLeaveHistoryQuery'
import { useMyLeaveSummaryQuery } from '../api/useMyLeaveSummaryQuery'

const STATUS_OPTIONS = Object.keys(approvalStatusBadgeMap) as ApprovalStatus[]

const SEARCH_DEBOUNCE_MS = 300

export function MyLeavePage() {
  const navigate = useNavigate()
  const [year, setYear] = useState(() => dayjs().year())
  const [yearInput, setYearInput] = useState(() => String(dayjs().year()))
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | undefined>(undefined)

  const summaryQuery = useMyLeaveSummaryQuery(year)
  const historyQuery = useMyLeaveHistoryQuery({ approvalStatus, yearMonth })

  useEffect(() => {
    if (!summaryQuery.error) {
      return
    }
    handleApiError(summaryQuery.error, { toast })
  }, [summaryQuery.error])

  useEffect(() => {
    if (!historyQuery.error) {
      return
    }
    handleApiError(historyQuery.error, { toast })
  }, [historyQuery.error])

  useEffect(() => {
    const parsed = Number(yearInput)
    if (yearInput.trim() === '' || Number.isNaN(parsed) || parsed === year) {
      return
    }
    const timer = setTimeout(() => {
      setYear(parsed)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearInput, year])

  function handleStatusChange(value: string) {
    setApprovalStatus(value === '' ? undefined : (value as ApprovalStatus))
  }

  const rows = historyQuery.data ?? []
  const summary = summaryQuery.data
  const leaveCategories = summary
    ? [
        { key: 'annual', label: '연차', grant: summary.annualBaseGrantDays, used: summary.annualUsedDays },
        { key: 'special', label: '특별휴가', grant: summary.specialGrantDays, used: summary.specialUsedDays },
        {
          key: 'compensatory',
          label: '포상휴가',
          grant: summary.compensatoryGrantDays,
          used: summary.compensatoryUsedDays,
        },
      ]
    : []

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">내 휴가</h1>
        <Button type="button" onClick={() => navigate('/approval/drafts/leaves/new')}>
          휴가 신청
        </Button>
      </div>

      <Card className="mb-6 h-fit">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>잔여 휴가</CardTitle>
              <CardDescription>연차·특별·포상 휴가의 부여·사용·잔여 일수입니다.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="leave-summary-year" className="sr-only">
                조회 연도
              </label>
              <Input
                id="leave-summary-year"
                type="number"
                value={yearInput}
                onChange={(event) => setYearInput(event.target.value)}
                className="w-24"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {summaryQuery.isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : !summary ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              잔여 휴가 정보를 불러오지 못했습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {leaveCategories.map((category) => (
                <div key={category.key} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium text-foreground">{category.label}</p>
                  <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">부여</dt>
                      <dd className="tabular-nums">{category.grant}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">사용</dt>
                      <dd className="tabular-nums">{category.used}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">잔여</dt>
                      <dd className="tabular-nums font-semibold text-foreground">
                        {category.grant - category.used}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="border-b">
          <CardTitle>신청 이력</CardTitle>
          <CardDescription>내가 신청한 휴가 기안 이력을 조회합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="leave-history-month" className="sr-only">
                조회 월
              </label>
              <Input
                id="leave-history-month"
                type="month"
                value={yearMonth}
                onChange={(event) => setYearMonth(event.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="leave-history-status" className="sr-only">
                결재 상태 필터
              </label>
              <select
                id="leave-history-status"
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
            <p className="text-xs text-muted-foreground">
              {yearMonth} 이력만 표시됩니다. 다른 달을 보려면 조회 월을 변경하세요.
            </p>
          </div>

          {historyQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : historyQuery.error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              휴가 이력을 불러오지 못했습니다.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              조회 조건에 해당하는 휴가 이력이 없습니다.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      유형
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      기간
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      신청일수
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      결재 상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const { label, variant } = getApprovalStatusBadge(row.approvalStatus)
                    return (
                      <tr
                        key={row.draftId}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/approval/drafts/${row.draftId}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            navigate(`/approval/drafts/${row.draftId}`)
                          }
                        }}
                        className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      >
                        <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                          {row.leaveType}
                        </td>
                        <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                          {row.startAt} ~ {row.endAt}
                        </td>
                        <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground tabular-nums">
                          {row.requestedLeaveDays}
                        </td>
                        <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                          <Badge variant={variant}>{label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
