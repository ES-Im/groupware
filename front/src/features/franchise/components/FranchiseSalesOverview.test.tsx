import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseSalesOverview } from './FranchiseSalesOverview'

function renderOverview(franchiseId = 1) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <FranchiseSalesOverview franchiseId={franchiseId} />
    </QueryClientProvider>,
  )
}

describe('FranchiseSalesOverview - 연 매출(기본 탭)', () => {
  it('연 응답의 월별 매출에서 최근 월·전월·연 누적(YTD) KPI를 파생해 렌더한다', async () => {
    const year = dayjs().year()
    server.use(
      http.get(`${BASE_URL}/api/franchises/1/sales/years/:year`, () =>
        HttpResponse.json({
          franchiseId: 1,
          franchiseName: '강남점',
          salesYear: year,
          totalSalesAmount: 268000000,
          totalOrderCount: 5000,
          averageSalesAmount: 1000000,
          averageOrderAmount: 20000,
          salesMonths: 2,
          monthlySales: [
            { salesMonth: Number(`${year}07`), salesAmount: 42800000, orderCount: 900 },
            { salesMonth: Number(`${year}06`), salesAmount: 40000000, orderCount: 800 },
          ],
        }),
      ),
    )

    renderOverview()

    expect(await screen.findByText(`${year}-07 매출`)).toBeInTheDocument()
    expect(screen.getByText('42,800,000원')).toBeInTheDocument()
    expect(screen.getByText('전월 매출')).toBeInTheDocument()
    expect(screen.getByText('40,000,000원')).toBeInTheDocument()
    expect(screen.getByText('연 누적 (YTD)')).toBeInTheDocument()
    expect(screen.getByText('268,000,000원')).toBeInTheDocument()
  })

  it('월별 매출이 비어 있으면 빈 상태 문구를 렌더한다(에러 아님)', async () => {
    const year = dayjs().year()
    server.use(
      http.get(`${BASE_URL}/api/franchises/1/sales/years/:year`, () =>
        HttpResponse.json({
          franchiseId: 1,
          franchiseName: '강남점',
          salesYear: year,
          totalSalesAmount: 0,
          totalOrderCount: 0,
          averageSalesAmount: 0,
          averageOrderAmount: 0,
          salesMonths: 0,
          monthlySales: [],
        }),
      ),
    )

    renderOverview()

    expect(await screen.findByText('선택한 기간의 매출 데이터가 없습니다.')).toBeInTheDocument()
  })
})
