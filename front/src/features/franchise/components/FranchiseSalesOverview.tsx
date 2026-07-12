import { useState } from 'react'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useFranchiseDailySalesQuery } from '../api/useFranchiseDailySalesQuery'
import { useFranchiseMonthlySalesQuery } from '../api/useFranchiseMonthlySalesQuery'
import { useFranchiseYearlySalesQuery } from '../api/useFranchiseYearlySalesQuery'
import { FranchiseMetricCard } from './FranchiseMetricCard'

// salesMonth(yyyyMM)·salesDate(yyyyMMdd)는 숫자라 String() 변환 후 포맷 지정 파싱이 필요하다
// (§계약 실측 메모). 포맷 인자 파싱은 customParseFormat 플러그인이 있어야 동작한다.
dayjs.extend(customParseFormat)

/** 조회 단위. 연/월/일 탭 전환 축(F1624~F1626 각 1:1 대응). */
type SalesUnit = 'year' | 'month' | 'day'

/** 원화 표기(SalesDraftCreatePage 포맷 선례 동형). */
function formatCurrency(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

/** KPI 카드 1장. 도메인 공통 FranchiseMetricCard(아이콘 생략형)로 시각 언어를 통일한다. */
function KpiCard({ label, value }: { label: string; value: string }) {
  return <FranchiseMetricCard title={label} value={value} accent="muted" />
}

/**
 * 매출액 추이 라인 차트(최소 구성). 단일 시리즈라 범례 없이 상위 제목이 시리즈명을 대신하고,
 * 색은 테마 적응형 `var(--primary)` 하나만 쓴다. Tooltip이 호버 값(원화)을 보여준다.
 */
function SalesTrendChart({ points }: { points: Array<{ label: string; salesAmount: number }> }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis
            width={88}
            tick={{ fontSize: 12 }}
            tickLine={false}
            tickFormatter={(value: number) => value.toLocaleString('ko-KR')}
          />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Line
            type="monotone"
            dataKey="salesAmount"
            name="매출액"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * 연 매출 패널(F1624). 월별 매출 추이 차트 + KPI 3종.
 * salesMonth는 yyyyMM 숫자라 String() 변환 후 customParseFormat으로 파싱해 라벨을 만든다.
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
    return <p className="text-sm text-muted-foreground">조회 연도를 입력하세요.</p>
  }
  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }
  if (query.error) {
    return <p className="text-sm text-destructive">{normalizeApiError(query.error).message}</p>
  }
  const data = query.data
  // 매출 없음은 204 빈 바디 → axios data가 빈 문자열(T3.1 실측). 에러가 아닌 빈 상태로 렌더.
  if (!data || typeof data === 'string') {
    return <p className="text-sm text-muted-foreground">선택한 기간의 매출 데이터가 없습니다.</p>
  }

  // 200 성공이지만 포인트가 비어 있는 경우도 데이터 없음으로 취급한다(에러 아님).
  if (data.monthlySales.length === 0) {
    return <p className="text-sm text-muted-foreground">선택한 기간의 매출 데이터가 없습니다.</p>
  }

  const points = data.monthlySales.map((point) => ({
    label: dayjs(String(point.salesMonth), 'YYYYMM').format('YYYY-MM'),
    salesAmount: point.salesAmount,
  }))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="연 총 매출액" value={formatCurrency(data.totalSalesAmount)} />
        <KpiCard label="연 총 주문 수" value={`${data.totalOrderCount.toLocaleString('ko-KR')}건`} />
        <KpiCard label="연 일평균 매출" value={formatCurrency(data.averageSalesAmount)} />
      </div>
      <div>
        <h2 className="mb-2 text-sm font-medium">월별 매출 추이</h2>
        <SalesTrendChart points={points} />
      </div>
    </div>
  )
}

/**
 * 월 매출 패널(F1625). 일별 매출 추이 차트 + KPI 3종.
 * (내부 포인트의) salesDate는 yyyyMMdd 숫자라 String() 변환 후 파싱한다 — 일 매출 단건 응답의
 * salesDate(yyyy-MM-dd 문자열)와 타입이 다르므로 혼동 금지.
 */
function MonthlySalesPanel({ franchiseId, month }: { franchiseId: number; month: string }) {
  const query = useFranchiseMonthlySalesQuery(franchiseId, month || undefined)

  if (!month) {
    return <p className="text-sm text-muted-foreground">조회 월을 선택하세요.</p>
  }
  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }
  if (query.error) {
    return <p className="text-sm text-destructive">{normalizeApiError(query.error).message}</p>
  }
  const data = query.data
  // 매출 없음은 204 빈 바디 → axios data가 빈 문자열(T3.1 실측). 에러가 아닌 빈 상태로 렌더.
  if (!data || typeof data === 'string') {
    return <p className="text-sm text-muted-foreground">선택한 기간의 매출 데이터가 없습니다.</p>
  }

  // 200 성공이지만 포인트가 비어 있는 경우도 데이터 없음으로 취급한다(에러 아님).
  if (data.dailySales.length === 0) {
    return <p className="text-sm text-muted-foreground">선택한 기간의 매출 데이터가 없습니다.</p>
  }

  const points = data.dailySales.map((point) => ({
    label: dayjs(String(point.salesDate), 'YYYYMMDD').format('MM-DD'),
    salesAmount: point.salesAmount,
  }))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="월 총 매출액" value={formatCurrency(data.totalSalesAmount)} />
        <KpiCard label="월 총 주문 수" value={`${data.totalOrderCount.toLocaleString('ko-KR')}건`} />
        <KpiCard label="일평균 매출" value={formatCurrency(data.averageDailySalesAmount)} />
      </div>
      <div>
        <h2 className="mb-2 text-sm font-medium">일별 매출 추이</h2>
        <SalesTrendChart points={points} />
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
    return <p className="text-sm text-muted-foreground">조회 일자를 선택하세요.</p>
  }
  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }
  if (query.error) {
    return <p className="text-sm text-destructive">{normalizeApiError(query.error).message}</p>
  }
  const data = query.data
  // 매출 없음은 204 빈 바디 → axios data가 빈 문자열(T3.1 실측). 에러가 아닌 빈 상태로 렌더.
  if (!data || typeof data === 'string') {
    return <p className="text-sm text-muted-foreground">선택한 기간의 매출 데이터가 없습니다.</p>
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label={`${data.salesDate} 매출액`} value={formatCurrency(data.salesAmount)} />
        <KpiCard
          label={`${data.salesDate} 주문 수`}
          value={`${data.orderCount.toLocaleString('ko-KR')}건`}
        />
      </div>
    </div>
  )
}

/**
 * 가맹점 매출 요약(연/월/일 탭 전환, F1624~F1626). 매출 조회 페이지(P3, FranchiseSalesPage)와
 * 가맹점 상세 페이지(P2, FranchiseDetailPage) 양쪽에서 공용 소비한다(원본은 P3 전용 구현이었으나
 * 상세 페이지 임베드를 위해 공용 컴포넌트로 승격) — franchiseId만 주어지면 자체 상태(단위·기간)로
 * 독립 동작한다.
 */
export function FranchiseSalesOverview({ franchiseId }: { franchiseId: number }) {
  const [unit, setUnit] = useState<SalesUnit>('year')

  // 단위별 기간 입력 상태. 기본값은 오늘 기준(dayjs). 연은 <input type="number">가 비워질 수
  // 있어 undefined 허용, 월/일은 <input type="month"|"date">가 빈 문자열을 내므로 string 유지.
  const [year, setYear] = useState<number | undefined>(() => dayjs().year())
  const [month, setMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [day, setDay] = useState(() => dayjs().format('YYYY-MM-DD'))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <Tabs value={unit} onValueChange={(value) => setUnit(value as SalesUnit)}>
          <TabsList>
            <TabsTrigger value="year">연</TabsTrigger>
            <TabsTrigger value="month">월</TabsTrigger>
            <TabsTrigger value="day">일</TabsTrigger>
          </TabsList>
        </Tabs>

        {unit === 'year' && (
          <div className="space-y-1">
            <Label htmlFor="sales-year">조회 연도</Label>
            <Input
              id="sales-year"
              type="number"
              className="w-32"
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
              className="w-44"
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
              className="w-44"
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
