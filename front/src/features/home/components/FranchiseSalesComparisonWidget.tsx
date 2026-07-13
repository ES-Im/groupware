import dayjs from 'dayjs'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { useFranchisesQuery } from '@/features/franchise/api/useFranchisesQuery'
import { useFranchiseMonthlySalesBatchQuery } from '@/features/franchise/api/useFranchiseMonthlySalesBatchQuery'
import { FranchiseMetricCard } from '@/features/franchise/components/FranchiseMetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const CURRENT_YEAR_MONTH = dayjs().format('YYYY-MM')

function formatCurrency(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

/**
 * 가맹점 매출 비교 위젯(FRANCHISE, 레퍼런스 "가맹점 월별 매출 현황" 이식).
 * 밴드 타이틀(RoleBandHeader)은 HomePage가 렌더한다 — 이 컴포넌트는 카드 자체만 담당한다.
 *
 * 담당 가맹점 수만큼 월매출(FRANCHISE_SALES_MONTHLY)을 병렬 조회한다(계획 문서 확정 설계 결정
 * — "가맹점 매출 비교 막대차트 포함"). 담당 목록은 FRANCHISE_LIST의 managerId=본인 empId 필터로
 * 얻는다. 이번 달 고정 조회이며(레퍼런스의 "지난 달/연간" 세그먼트는 계획 범위 밖 — 과설계 방지).
 */
export function FranchiseSalesComparisonWidget() {
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
  const franchiseIds = franchises.map((franchise) => franchise.id)

  const { salesByFranchiseId } = useFranchiseMonthlySalesBatchQuery(franchiseIds, CURRENT_YEAR_MONTH)

  const points = franchises.map((franchise) => ({
    label: franchise.name,
    salesAmount: salesByFranchiseId[franchise.id]?.totalSalesAmount ?? 0,
  }))
  const totalSalesAmount = points.reduce((sum, point) => sum + point.salesAmount, 0)

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>가맹점 월별 매출 현황</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            담당 가맹점 · {dayjs().format('YYYY년 M월')}
          </p>
        </div>
        <Link
          to="/franchises"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          가맹점 매출
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FranchiseMetricCard title="이번 달 합계" value={formatCurrency(totalSalesAmount)} accent="primary" />
          <FranchiseMetricCard title="담당 가맹점" value={`${franchises.length}개점`} accent="muted" />
        </div>

        {points.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">담당 가맹점이 없습니다.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis
                  width={72}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value: number) => value.toLocaleString('ko-KR')}
                />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="salesAmount" name="매출액" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
