import { useState } from 'react'
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

// salesMonth(yyyyMM)·salesDate(yyyyMMdd)는 숫자라 String() 변환 후 포맷 지정 파싱이 필요하다
// (§계약 실측 메모). 포맷 인자 파싱은 customParseFormat 플러그인이 있어야 동작한다.
dayjs.extend(customParseFormat)

/** 조회 단위. 연/월/일 탭 전환 축(F1624~F1626 각 1:1 대응). */
type SalesUnit = 'year' | 'month' | 'day'

/** 원화 표기(SalesDraftCreatePage 포맷 선례 동형). */
function formatCurrency(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

/**
 * 매출 KPI 1건(목업 `.sale-kpi` — 라벨 + 큰 수치 + 보조 delta). shadcn 토큰만 쓰므로 상승/하락
 * 색 구분 대신 부호(+/-)로 방향을 나타낸다(성공/경고 토큰 부재 — FranchiseMetricCard 정책 동일).
 */
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

/**
 * 매출액 막대 차트(목업 매출 현황 막대). 단일 시리즈라 범례 없이 상위 제목이 시리즈명을 대신하고,
 * 색은 테마 적응형 `var(--primary)`. highlightLabel과 일치하는 막대만 진하게, 나머지는 흐리게 칠해
 * "최근 구간" 강조(목업 `.bars .bar.on`)를 재현한다. Tooltip이 호버 값(원화)을 보여준다.
 */
function SalesBarChart({
  points,
  highlightLabel,
}: {
  points: Array<{ label: string; salesAmount: number }>
  highlightLabel?: string
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
          <Bar dataKey="salesAmount" name="매출액" radius={[4, 4, 0, 0]}>
            {points.map((point) => (
              <Cell
                key={point.label}
                fill="var(--primary)"
                fillOpacity={
                  highlightLabel === undefined || point.label === highlightLabel ? 1 : 0.25
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** 매출 없음/로딩/에러 공통 빈 상태 문구. */
function SalesEmpty({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>
}

/**
 * 연 매출 패널(F1624). 목업 매출 현황의 기본 뷰 — 12개월 막대 + KPI(최근 월·전월·연 누적 YTD).
 * salesMonth는 yyyyMM 숫자라 String() 변환 후 customParseFormat으로 파싱해 라벨을 만든다.
 * "최근 월/전월"은 monthlySales를 오름차순 정렬해 마지막/그 이전 포인트로 파생한다(연도별로
 * 실제 존재하는 월 기준 — 하드코딩 없이 데이터에서 도출).
 */
function YearlySalesPanel({
  franchiseId,
  year,
}: {
  franchiseId: number
  year: number | undefined
}) {
  const query = useFranchiseYearlySalesQuery(franchiseId, year)

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
  // 매출 없음은 204 빈 바디 → axios data가 빈 문자열(T3.1 실측). 에러가 아닌 빈 상태로 렌더.
  if (!data || typeof data === 'string' || data.monthlySales.length === 0) {
    return <SalesEmpty message="선택한 기간의 매출 데이터가 없습니다." />
  }

  const sorted = [...data.monthlySales].sort((a, b) => a.salesMonth - b.salesMonth)
  const points = sorted.map((point) => ({
    label: dayjs(String(point.salesMonth), 'YYYYMM').format('M월'),
    salesAmount: point.salesAmount,
  }))
  const recent = sorted[sorted.length - 1]
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : undefined
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
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">단위: 원</span>
        </h4>
        <SalesBarChart points={points} highlightLabel={points[points.length - 1]?.label} />
      </div>
    </div>
  )
}

/**
 * 월 매출 패널(F1625). 일별 매출 막대 + KPI 3종.
 * (내부 포인트의) salesDate는 yyyyMMdd 숫자라 String() 변환 후 파싱한다 — 일 매출 단건 응답의
 * salesDate(yyyy-MM-dd 문자열)와 타입이 다르므로 혼동 금지.
 */
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

/**
 * 일 매출 패널(F1626). 단건 응답이라 차트 없이 KPI 카드 2종(매출액·주문 수)만 렌더한다.
 * salesDate는 이미 `yyyy-MM-dd` **문자열**이라 연/월 패널의 숫자 파싱(String()+customParseFormat)이
 * 필요 없다(§계약 실측 메모 — 타입 오용 방지).
 */
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

/**
 * 가맹점 매출 요약(연/월/일 탭 전환, F1624~F1626). 가맹점 상세 페이지(P2)에 임베드된다.
 * 목업 "매출 현황" 카드 — 세그먼트 + 막대 차트 + KPI. franchiseId만 주어지면 자체 상태(단위·기간)로
 * 독립 동작한다(기본 연 단위 = 당해 12개월 막대 + 최근 월/전월/YTD).
 */
export function FranchiseSalesOverview({ franchiseId }: { franchiseId: number }) {
  const [unit, setUnit] = useState<SalesUnit>('year')

  // 단위별 기간 입력 상태. 기본값은 오늘 기준(dayjs). 연은 <input type="number">가 비워질 수
  // 있어 undefined 허용, 월/일은 <input type="month"|"date">가 빈 문자열을 내므로 string 유지.
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

      {unit === 'year' && <YearlySalesPanel franchiseId={franchiseId} year={year} />}
      {unit === 'month' && <MonthlySalesPanel franchiseId={franchiseId} month={month} />}
      {unit === 'day' && <DailySalesPanel franchiseId={franchiseId} day={day} />}
    </div>
  )
}
