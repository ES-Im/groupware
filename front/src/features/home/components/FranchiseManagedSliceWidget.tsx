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

/**
 * 담당 가맹점 슬라이스 위젯(FRANCHISE, 레퍼런스 "담당 가맹점" 캐러셀 이식).
 *
 * FranchiseSalesComparisonWidget과 동일한 목록 쿼리(managerId=본인 empId)를 재사용한다 —
 * react-query가 동일 queryKey로 캐시를 공유하므로 두 위젯이 각자 훅을 호출해도 네트워크 요청은
 * 한 번만 발생한다(계획 문서 §재사용 자원 맵 "위 목록 재사용"). shadcn Carousel 프리미티브가
 * 프로젝트에 설치돼 있지 않아(새 라이브러리 도입 금지 원칙) 이전/다음 버튼 + 인덱스 state로 직접
 * 구현한다.
 *
 * 현재 선택된 가맹점만 상세(FRANCHISE_DETAIL)·월매출을 on-demand 조회한다. FranchiseDetail에는
 * 오픈일 필드가 없고, 미답변 문의 수는 franchiseId 역조회 API 자체가 없어(도메인 실측 기록) 둘 다
 * 표시하지 않는다(계약에 없는 정보 발명 금지) — 대신 계약에 있는 대표자·메모를 보여준다.
 */
export function FranchiseManagedSliceWidget() {
  const { data: me } = useMeQuery()
  const managerId = me?.empBasicInfo.empId

  // managerId 미확정(me 로딩 중) 상태에서는 enabled로 쿼리 자체를 막는다 — 표시 단만 가드하면
  // keepPreviousData 특성상 필터 없는 전체 목록이 placeholder로 잠깐 노출될 수 있다(useFranchisesQuery
  // JSDoc 참고).
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
