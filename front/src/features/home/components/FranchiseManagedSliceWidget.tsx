import { useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { useFranchisesQuery } from '@/features/franchise/api/useFranchisesQuery'
import { useFranchiseDetailQuery } from '@/features/franchise/api/useFranchiseDetailQuery'
import { useFranchiseMonthlySalesQuery } from '@/features/franchise/api/useFranchiseMonthlySalesQuery'
import { resolveBusinessStatusCode } from '@/features/franchise/model/franchise'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'

const CURRENT_YEAR_MONTH = dayjs().format('YYYY-MM')

function formatCurrency(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

function KvTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-base font-semibold">{value}</p>
    </div>
  )
}

export function FranchiseManagedSliceWidget() {
  const { data: me } = useMeQuery()
  const managerId = me?.empBasicInfo.empId

  const franchisesQuery = useFranchisesQuery(
    { managerId, page: 0, size: 50 },
    { enabled: managerId != null },
  )
  const franchises = franchisesQuery.data?.content ?? []

  const [index, setIndex] = useState(0)
  const current = franchises[index]

  const detailQuery = useFranchiseDetailQuery(current?.id)
  const salesQuery = useFranchiseMonthlySalesQuery(current?.id, CURRENT_YEAR_MONTH)

  function goPrev() {
    setIndex((prev) => (prev - 1 + franchises.length) % franchises.length)
  }
  function goNext() {
    setIndex((prev) => (prev + 1) % franchises.length)
  }

  const detail = detailQuery.data
  const statusCode = detail ? resolveBusinessStatusCode(detail.BusinessStatus) : undefined
  const statusVariant = statusCode === 'CLOSED' ? 'destructive' : statusCode === 'OPEN' ? 'default' : 'secondary'
  const monthlySales = salesQuery.data && typeof salesQuery.data === 'object' ? salesQuery.data : undefined

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <CardTitle>담당 가맹점</CardTitle>
        {franchises.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {index + 1} / {franchises.length}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {franchises.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">담당 가맹점이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={goPrev}
                aria-label="이전 가맹점"
                disabled={franchises.length <= 1}
              >
                <ChevronLeft />
              </Button>
              <div className="flex items-center gap-1.5">
                {franchises.map((franchise, dotIndex) => (
                  <span
                    key={franchise.id}
                    className={cn(
                      'h-1.5 rounded-full bg-border transition-all',
                      dotIndex === index ? 'w-5 bg-primary' : 'w-1.5',
                    )}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={goNext}
                aria-label="다음 가맹점"
                disabled={franchises.length <= 1}
              >
                <ChevronRight />
              </Button>
            </div>

            {current && (
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold tracking-tight">{current.name}</p>
                  {detail && <Badge variant={statusVariant}>{detail.BusinessStatus}</Badge>}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <KvTile
                    label="이번 달 매출"
                    value={monthlySales ? formatCurrency(monthlySales.totalSalesAmount) : '-'}
                  />
                  <KvTile label="담당자" value={detail?.managerEmpName ?? '-'} />
                  <KvTile label="대표자" value={detail?.ownerName ?? '-'} />
                  <KvTile label="연락처" value={detail?.contactNumber ?? '-'} />
                </div>
                {detail?.memo && (
                  <p className="mt-3 rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
                    메모 · {detail.memo}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
