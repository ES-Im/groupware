import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { cn } from '@/shared/lib/utils'
import { useFranchiseDailySalesQuery } from '../api/useFranchiseDailySalesQuery'
import { useFranchiseMonthlySalesQuery } from '../api/useFranchiseMonthlySalesQuery'
import { useFranchiseYearlySalesQuery } from '../api/useFranchiseYearlySalesQuery'

dayjs.extend(customParseFormat)

type SalesUnit = 'year' | 'month' | 'day'

function formatCurrency(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

function SalesKpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl leading-tight font-semibold tracking-tight tabular-nums break-keep">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function SalesBarChart({
  points,
  highlightIndex,
  onBarClick,
}: {
  points: Array<{ label: string; salesAmount: number }>
  highlightIndex?: number
  onBarClick?: (index: number) => void
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            width={88}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => value.toLocaleString('ko-KR')}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            formatter={(value) => formatCurrency(Number(value))}
          />
          <Bar
            dataKey="salesAmount"
            name="매출액"
            radius={[4, 4, 0, 0]}
            className={onBarClick ? 'cursor-pointer' : undefined}
            onClick={(_data, index) => onBarClick?.(index)}
          >
            {points.map((point, index) => (
              <Cell
                key={point.label}
                fill="var(--primary)"
                fillOpacity={highlightIndex === undefined || index === highlightIndex ? 1 : 0.25}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function SalesEmpty({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>
}

function YearlySalesPanel({
  franchiseId,
  year,
}: {
  franchiseId: number
  year: number | undefined
}) {
  const query = useFranchiseYearlySalesQuery(franchiseId, year)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  useEffect(() => {
    setSelectedIndex(null)
  }, [year])

  if (year === undefined) {
    return <SalesEmpty message="조회 연도를 입력하세요." />
  }
  if (query.isLoading) {
    return <SalesEmpty message="불러오는 중..." />
  }
  if (query.error) {
    return <p className="text-sm text-destructive">{normalizeApiError(query.error).message}</p>
  }
  const data = query.data
  if (!data || typeof data === 'string' || data.monthlySales.length === 0) {
    return <SalesEmpty message="선택한 기간의 매출 데이터가 없습니다." />
  }

  const sorted = [...data.monthlySales].sort((a, b) => a.salesMonth - b.salesMonth)
  const points = sorted.map((point) => ({
    label: dayjs(String(point.salesMonth), 'YYYYMM').format('M월'),
    salesAmount: point.salesAmount,
  }))
  const activeIndex =
    selectedIndex !== null && selectedIndex >= 0 && selectedIndex < sorted.length
      ? selectedIndex
      : sorted.length - 1
  const recent = sorted[activeIndex]
  const previous = activeIndex > 0 ? sorted[activeIndex - 1] : undefined
  const recentLabel = dayjs(String(recent.salesMonth), 'YYYYMM').format('YYYY-MM')
  const previousLabel = previous
    ? dayjs(String(previous.salesMonth), 'YYYYMM').format('YYYY-MM')
    : undefined
  const deltaPct =
    previous && previous.salesAmount > 0
      ? ((recent.salesAmount - previous.salesAmount) / previous.salesAmount) * 100
      : undefined
  const deltaHint =
    deltaPct === undefined
      ? undefined
      : `전월 대비 ${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%`

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <SalesKpi label={`${recentLabel} 매출`} value={formatCurrency(recent.salesAmount)} hint={deltaHint} />
        <SalesKpi
          label="전월 매출"
          value={previous ? formatCurrency(previous.salesAmount) : '—'}
          hint={previousLabel}
        />
        <SalesKpi
          label="연 누적 (YTD)"
          value={formatCurrency(data.totalSalesAmount)}
          hint={`${data.salesYear}년`}
        />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium">
          {data.salesYear}년 월별 매출
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            단위: 원 · 막대를 클릭해 월별 KPI를 전환
          </span>
        </h4>
        <SalesBarChart points={points} highlightIndex={activeIndex} onBarClick={setSelectedIndex} />
      </div>
    </div>
  )
}

function MonthlySalesPanel({ franchiseId, month }: { franchiseId: number; month: string }) {
  const query = useFranchiseMonthlySalesQuery(franchiseId, month || undefined)

  if (!month) {
    return <SalesEmpty message="조회 월을 선택하세요." />
  }
  if (query.isLoading) {
    return <SalesEmpty message="불러오는 중..." />
  }
  if (query.error) {
    return <p className="text-sm text-destructive">{normalizeApiError(query.error).message}</p>
  }
  const data = query.data
  if (!data || typeof data === 'string' || data.dailySales.length === 0) {
    return <SalesEmpty message="선택한 기간의 매출 데이터가 없습니다." />
  }

  const points = data.dailySales.map((point) => ({
    label: dayjs(String(point.salesDate), 'YYYYMMDD').format('D일'),
    salesAmount: point.salesAmount,
  }))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <SalesKpi label="월 총 매출액" value={formatCurrency(data.totalSalesAmount)} />
        <SalesKpi label="월 총 주문 수" value={`${data.totalOrderCount.toLocaleString('ko-KR')}건`} />
        <SalesKpi label="일평균 매출" value={formatCurrency(data.averageDailySalesAmount)} />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium">
          일별 매출 추이
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">단위: 원</span>
        </h4>
        <SalesBarChart points={points} />
      </div>
    </div>
  )
}

function DailySalesPanel({ franchiseId, day }: { franchiseId: number; day: string }) {
  const query = useFranchiseDailySalesQuery(franchiseId, day || undefined)

  if (!day) {
    return <SalesEmpty message="조회 일자를 선택하세요." />
  }
  if (query.isLoading) {
    return <SalesEmpty message="불러오는 중..." />
  }
  if (query.error) {
    return <p className="text-sm text-destructive">{normalizeApiError(query.error).message}</p>
  }
  const data = query.data
  if (!data || typeof data === 'string') {
    return <SalesEmpty message="선택한 기간의 매출 데이터가 없습니다." />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SalesKpi label={`${data.salesDate} 매출액`} value={formatCurrency(data.salesAmount)} />
      <SalesKpi label={`${data.salesDate} 주문 수`} value={`${data.orderCount.toLocaleString('ko-KR')}건`} />
    </div>
  )
}

export function FranchiseSalesOverview({ franchiseId }: { franchiseId: number }) {
  const [unit, setUnit] = useState<SalesUnit>('year')

  const [year, setYear] = useState<number | undefined>(() => dayjs().year())
  const [month, setMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [day, setDay] = useState(() => dayjs().format('YYYY-MM-DD'))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <Tabs value={unit} onValueChange={(value) => setUnit(value as SalesUnit)}>
          <TabsList>
            <TabsTrigger value="year">연</TabsTrigger>
            <TabsTrigger value="month">월</TabsTrigger>
            <TabsTrigger value="day">일</TabsTrigger>
          </TabsList>
        </Tabs>

        {unit === 'year' && (
          <div className={cn('space-y-1')}>
            <Label htmlFor="sales-year">조회 연도</Label>
            <Input
              id="sales-year"
              type="number"
              className="h-9 w-32"
              value={year ?? ''}
              onChange={(e) => {
                const next = e.target.valueAsNumber
                setYear(Number.isNaN(next) ? undefined : next)
              }}
            />
          </div>
        )}
        {unit === 'month' && (
          <div className="space-y-1">
            <Label htmlFor="sales-month">조회 월</Label>
            <Input
              id="sales-month"
              type="month"
              className="h-9 w-44"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        )}
        {unit === 'day' && (
          <div className="space-y-1">
            <Label htmlFor="sales-day">조회 일자</Label>
            <Input
              id="sales-day"
              type="date"
              className="h-9 w-44"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="min-h-[24rem]">
        {unit === 'year' && <YearlySalesPanel franchiseId={franchiseId} year={year} />}
        {unit === 'month' && <MonthlySalesPanel franchiseId={franchiseId} month={month} />}
        {unit === 'day' && <DailySalesPanel franchiseId={franchiseId} day={day} />}
      </div>
    </div>
  )
}
