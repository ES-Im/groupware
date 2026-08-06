import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useMyBusinessTripHistoryQuery } from '../api/useMyBusinessTripHistoryQuery'
import { approvalStatusBadgeMap, getApprovalStatusBadge } from '../lib/approvalStatusBadge'
import type { ApprovalStatus } from '../model/approval'

const STATUS_OPTIONS = Object.keys(approvalStatusBadgeMap) as ApprovalStatus[]

export function MyBusinessTripHistoryPage() {
  const navigate = useNavigate()
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | undefined>(undefined)

  const historyQuery = useMyBusinessTripHistoryQuery({ approvalStatus, yearMonth })

  useEffect(() => {
    if (!historyQuery.error) {
      return
    }
    handleApiError(historyQuery.error, { toast })
  }, [historyQuery.error])

  function handleStatusChange(value: string) {
    setApprovalStatus(value === '' ? undefined : (value as ApprovalStatus))
  }

  const rows = historyQuery.data ?? []

  return (
    <div className="w-full p-3">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">내 출장 이력</h1>
      </div>
      <Card className="h-fit">
        <CardHeader className="border-b">
          <CardTitle>출장 신청 이력</CardTitle>
          <CardDescription>내가 신청한 출장 기안 이력을 조회합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="business-trip-history-month" className="sr-only">
                조회 월
              </label>
              <Input
                id="business-trip-history-month"
                type="month"
                value={yearMonth}
                onChange={(event) => setYearMonth(event.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="business-trip-history-status" className="sr-only">
                결재 상태 필터
              </label>
              <select
                id="business-trip-history-status"
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
              출장 이력을 불러오지 못했습니다.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              조회 조건에 해당하는 출장 이력이 없습니다.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      기간
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      목적지
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      목적
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
                          {row.startAt} ~ {row.endAt}
                        </td>
                        <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                          {row.destination}
                        </td>
                        <td className="px-3 py-3 text-left align-middle text-muted-foreground">
                          {row.purpose}
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
