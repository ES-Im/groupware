import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseSalesPage } from './FranchiseSalesPage'

/**
 * FranchiseSalesPage(F1624~F1626, ROADMAP(FRANCHISE) T3.2) 회귀 방지 테스트.
 * FranchiseListPage.test.tsx의 헬퍼 패턴(MSW server.use + QueryClient 래퍼 + MemoryRouter)을
 * 복제하고, 픽스처는 계약 실측(FRANCHISE_SALES_YEARLY/MONTHLY/DAILY·FRANCHISE_DETAIL 스니펫)
 * 필드를 그대로 따른다.
 *
 * 검증 대상:
 * - 가맹점 미선택 시 안내 문구만 렌더 + 매출 API 미호출(탭·KPI 미노출).
 * - `?franchiseId={id}` 프리필: 상세(FRANCHISE_DETAIL) 200 → picker 선택 반영 + 기본 연도(올해)
 *   연 매출 자동 조회 → KPI 3종·"월별 매출 추이" 렌더. 무효 형식(음수/16진/지수)은 프리필 안 함
 *   (상세 미호출). 프리필 상세 404는 not-found 토스트 + 미선택 상태 유지.
 * - 매출 없음 = HTTP 204 빈 바디(T3.1 런타임 실측) → 에러가 아닌 빈 상태 문구 렌더.
 *   200 + monthlySales 빈 배열도 동일 빈 상태.
 * - 연 매출 403(ROLE_003) 에러 응답 → 에러 메시지 렌더(빈 상태 아님).
 * - 탭 전환: 일=KPI 2종(매출액·주문 수)만, 월=KPI 3종 + "일별 매출 추이".
 *
 * ⚠️ 차트 SVG 상세는 단언하지 않는다 — recharts ResponsiveContainer는 jsdom에서 크기 0이라
 * 시리즈가 그려지지 않을 수 있어 제목/KPI 텍스트 위주로 단언한다(과제 지침).
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// recharts v3 ResponsiveContainer는 ResizeObserver로 크기를 관측하는데 jsdom에는 구현이 없다.
// 관측 결과(크기 0)는 차트 미렌더로 이어질 뿐이므로 no-op 스텁으로 충분하다(전역 setup 수정 금지
// 제약에 따라 테스트 파일 로컬로만 주입).
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
}

/** FranchisePicker 기본뷰(useMeQuery)용 me 픽스처(SalesDraftCreatePage.test.tsx 동형). */
function meFixture(empId: number) {
  return {
    empBasicInfo: {
      empId,
      empNo: '000000001',
      name: '홍길동',
      loginId: 'test1234',
      email: 'test1234@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts: [],
  }
}

/** FRANCHISE_LIST content 1건(BusinessStatus 키 대문자 시작 — 계약 실측 그대로). */
function franchiseSummary(id: number, name: string, managerEmpId: number) {
  return {
    id,
    name,
    address: '서울특별시 강남구 테헤란로 1',
    ownerName: '홍길동',
    BusinessStatus: '정상 영업 중',
    managerEmpId,
    managerEmpName: '김담당',
  }
}

/** Spring Data Page 구조(useFranchisesQuery.test.tsx의 makePage 동형). */
function pageOf(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 50,
    first: true,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

/** FRANCHISE_DETAIL 응답 픽스처(BusinessStatus 키 대문자 시작 — 계약 실측 그대로). */
function detailFixture() {
  return {
    id: 1,
    name: '테스트강남점',
    address: '서울특별시 강남구 테헤란로 1',
    ownerName: '홍길동',
    businessNumber: '123-45-67890',
    contactNumber: '02-1234-5678',
    contactEmail: 'gangnam@haruon.com',
    BusinessStatus: '정상 영업 중',
    memo: '',
    managerEmpId: 7,
    managerEmpName: '김담당',
  }
}

/** FRANCHISE_SALES_YEARLY 응답 픽스처(salesMonth는 yyyyMM 숫자 — 계약 실측). */
function yearlySalesFixture(overrides?: Record<string, unknown>) {
  return {
    franchiseId: 1,
    franchiseName: '테스트강남점',
    salesYear: dayjs().year(),
    totalSalesAmount: 12450000,
    totalOrderCount: 1024,
    averageSalesAmount: 34000,
    averageOrderAmount: 12158.2,
    salesMonths: 2,
    monthlySales: [
      { salesMonth: 202605, salesAmount: 5200000, orderCount: 480 },
      { salesMonth: 202606, salesAmount: 7250000, orderCount: 544 },
    ],
    ...overrides,
  }
}

/** FRANCHISE_SALES_DAILY 응답 픽스처(salesDate는 yyyy-MM-dd 문자열 — 계약 실측). */
function dailySalesFixture(salesDate: string) {
  return {
    franchiseId: 1,
    franchiseName: '테스트강남점',
    salesDate,
    salesAmount: 830000,
    orderCount: 42,
  }
}

/** FRANCHISE_SALES_MONTHLY 응답 픽스처(내부 salesDate는 yyyyMMdd 숫자 — 계약 실측). */
function monthlySalesFixture() {
  return {
    franchiseId: 1,
    franchiseName: '테스트강남점',
    salesMonth: Number(dayjs().format('YYYYMM')),
    totalSalesAmount: 9900000,
    totalOrderCount: 88,
    averageOrderAmount: 112500.0,
    averageDailySalesAmount: 330000,
    salesDays: 30,
    dailySales: [
      { salesDate: 20260701, salesAmount: 320000, orderCount: 28 },
      { salesDate: 20260702, salesAmount: 410000, orderCount: 31 },
    ],
  }
}

/** FranchisePicker가 마운트 즉시 조회하는 2종(EMP_MY + FRANCHISE_LIST) 목 등록. */
function mockPicker() {
  server.use(
    http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(7))),
    http.get(`${BASE_URL}/api/franchises`, () =>
      HttpResponse.json(pageOf([franchiseSummary(1, '테스트강남점', 7)])),
    ),
  )
}

/** 프리필용 FRANCHISE_DETAIL(id=1) 200 목 등록. */
function mockDetail() {
  server.use(
    http.get(`${BASE_URL}/api/franchises/1`, () => HttpResponse.json(detailFixture())),
  )
}

function renderPage(initialEntry = '/franchise-sales') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/franchise-sales" element={<FranchiseSalesPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** 프리필 선택 반영의 관측점: picker 선택 칩의 해제 버튼(aria-label)이 나타날 때까지 대기. */
async function waitForSelectedChip() {
  return screen.findByRole('button', { name: '테스트강남점 선택 해제' })
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('FranchiseSalesPage (T3.2) - 가맹점 미선택', () => {
  it('안내 문구만 렌더되고 매출 API를 호출하지 않는다(탭·KPI 미노출)', async () => {
    mockPicker()
    // 페이지가 잘못 매출을 호출하면 여기서 잡힌다(onUnhandledRequest:error 보강용 카운터).
    let salesCallCount = 0
    server.use(
      http.get(`${BASE_URL}/api/franchises/:franchiseId/sales/*`, () => {
        salesCallCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()

    expect(
      screen.getByText('가맹점을 선택하면 매출을 조회할 수 있습니다.'),
    ).toBeInTheDocument()

    // picker 목록 로딩 완료 시점까지 기다린 뒤에도 매출 호출·탭·KPI가 없어야 한다.
    await screen.findByRole('button', { name: /테스트강남점/ })
    expect(salesCallCount).toBe(0)
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByText('연 총 매출액')).not.toBeInTheDocument()
  })
})

describe('FranchiseSalesPage (T3.2) - ?franchiseId 프리필', () => {
  it('detail 200이면 picker 선택이 반영되고 올해 연 매출을 자동 조회해 KPI 3종·"월별 매출 추이"를 렌더한다', async () => {
    mockPicker()
    mockDetail()
    let requestedYear: string | undefined
    server.use(
      http.get(`${BASE_URL}/api/franchises/1/sales/years/:year`, ({ params }) => {
        requestedYear = params.year as string
        return HttpResponse.json(yearlySalesFixture())
      }),
    )

    renderPage('/franchise-sales?franchiseId=1')

    // 프리필 반영: 선택 칩 + 미선택 안내 문구 소멸.
    await waitForSelectedChip()
    expect(
      screen.queryByText('가맹점을 선택하면 매출을 조회할 수 있습니다.'),
    ).not.toBeInTheDocument()

    // 기본 탭은 연 — 올해 연도로 자동 조회된다.
    expect(await screen.findByText('연 총 매출액')).toBeInTheDocument()
    expect(requestedYear).toBe(String(dayjs().year()))

    // KPI 3종 수치(응답 픽스처 → ko-KR 포맷).
    expect(screen.getByText('12,450,000원')).toBeInTheDocument()
    expect(screen.getByText('연 총 주문 수')).toBeInTheDocument()
    expect(screen.getByText('1,024건')).toBeInTheDocument()
    expect(screen.getByText('연 일평균 매출')).toBeInTheDocument()
    expect(screen.getByText('34,000원')).toBeInTheDocument()

    // 차트는 제목까지만 단언(jsdom에서 SVG 상세는 크기 0으로 비결정적 — 과제 지침).
    expect(screen.getByText('월별 매출 추이')).toBeInTheDocument()
  })

  it.each(['-5', '0x10', '1e3'])(
    '무효 형식 franchiseId(%s)는 프리필하지 않아 상세 조회 없이 미선택 안내가 유지된다',
    async (invalidId) => {
      mockPicker()
      let detailCallCount = 0
      server.use(
        http.get(`${BASE_URL}/api/franchises/:franchiseId`, () => {
          detailCallCount += 1
          return HttpResponse.json(detailFixture())
        }),
      )

      renderPage(`/franchise-sales?franchiseId=${invalidId}`)

      // picker 목록 로딩까지 기다려 상세 조회가 실제로 발생하지 않았음을 확정한다.
      await screen.findByRole('button', { name: /테스트강남점/ })
      expect(detailCallCount).toBe(0)
      expect(
        screen.getByText('가맹점을 선택하면 매출을 조회할 수 있습니다.'),
      ).toBeInTheDocument()

      const { toast } = await import('sonner')
      expect(toast.error).not.toHaveBeenCalled()
    },
  )

  it('프리필 상세 조회가 404면 not-found 토스트를 띄우고 미선택 상태(수동 선택 가능)를 유지한다', async () => {
    mockPicker()
    server.use(
      http.get(`${BASE_URL}/api/franchises/1`, () =>
        HttpResponse.json(
          {
            code: 'FRANCHISE_NOT_FOUND',
            name: 'FRANCHISE_NOT_FOUND',
            httpStatus: 404,
            message: '가맹점을 찾을 수 없습니다',
          },
          { status: 404 },
        ),
      ),
    )

    renderPage('/franchise-sales?franchiseId=1')

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('매출을 조회할 가맹점을 찾을 수 없습니다.'),
    )

    // 전용 실패 화면 없이 미선택 안내 + 검색 입력(수동 선택 경로)이 유지된다.
    expect(
      screen.getByText('가맹점을 선택하면 매출을 조회할 수 있습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('가맹점 검색')).toBeInTheDocument()
  })
})

describe('FranchiseSalesPage (T3.2) - 연 매출 상태 분기', () => {
  it('204 빈 바디면 에러·토스트가 아닌 "선택한 기간의 매출 데이터가 없습니다."를 렌더한다', async () => {
    mockPicker()
    mockDetail()
    server.use(
      http.get(`${BASE_URL}/api/franchises/1/sales/years/:year`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    renderPage('/franchise-sales?franchiseId=1')

    await waitForSelectedChip()
    expect(
      await screen.findByText('선택한 기간의 매출 데이터가 없습니다.'),
    ).toBeInTheDocument()

    // 에러 경로가 아니다: 에러 문구·토스트·KPI 모두 없어야 한다.
    expect(screen.queryByText('요청 처리 중 오류가 발생했습니다')).not.toBeInTheDocument()
    expect(screen.queryByText('연 총 매출액')).not.toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('200이지만 monthlySales가 빈 배열이면 동일한 빈 상태를 렌더한다', async () => {
    mockPicker()
    mockDetail()
    server.use(
      http.get(`${BASE_URL}/api/franchises/1/sales/years/:year`, () =>
        HttpResponse.json(
          yearlySalesFixture({
            totalSalesAmount: 0,
            totalOrderCount: 0,
            averageSalesAmount: 0,
            averageOrderAmount: 0,
            salesMonths: 0,
            monthlySales: [],
          }),
        ),
      ),
    )

    renderPage('/franchise-sales?franchiseId=1')

    await waitForSelectedChip()
    expect(
      await screen.findByText('선택한 기간의 매출 데이터가 없습니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('연 총 매출액')).not.toBeInTheDocument()
    expect(screen.queryByText('월별 매출 추이')).not.toBeInTheDocument()
  })

  it('403(ROLE_003) 에러 응답이면 에러 메시지를 렌더한다(빈 상태 아님)', async () => {
    mockPicker()
    mockDetail()
    server.use(
      http.get(`${BASE_URL}/api/franchises/1/sales/years/:year`, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 403, message: '권한이 없습니다' },
          { status: 403 },
        ),
      ),
    )

    renderPage('/franchise-sales?franchiseId=1')

    await waitForSelectedChip()
    expect(await screen.findByText('권한이 없습니다')).toBeInTheDocument()
    expect(
      screen.queryByText('선택한 기간의 매출 데이터가 없습니다.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('연 총 매출액')).not.toBeInTheDocument()
  })
})

describe('FranchiseSalesPage (T3.2) - 탭 전환', () => {
  it('일 탭 전환 시 오늘 날짜로 일 매출을 조회해 매출액·주문 수 KPI 2종만 렌더한다(차트 없음)', async () => {
    const today = dayjs().format('YYYY-MM-DD')
    mockPicker()
    mockDetail()
    let requestedDate: string | undefined
    server.use(
      http.get(`${BASE_URL}/api/franchises/1/sales/years/:year`, () =>
        HttpResponse.json(yearlySalesFixture()),
      ),
      http.get(`${BASE_URL}/api/franchises/1/sales/dates/:date`, ({ params }) => {
        requestedDate = params.date as string
        return HttpResponse.json(dailySalesFixture(today))
      }),
    )

    const user = userEvent.setup()
    renderPage('/franchise-sales?franchiseId=1')

    // 연 탭 데이터 도착까지 기다린 뒤 일 탭으로 전환한다.
    await screen.findByText('연 총 매출액')
    await user.click(screen.getByRole('tab', { name: '일' }))

    // 일 매출 KPI 2종(라벨은 응답 salesDate 문자열 그대로).
    expect(await screen.findByText(`${today} 매출액`)).toBeInTheDocument()
    expect(screen.getByText('830,000원')).toBeInTheDocument()
    expect(screen.getByText(`${today} 주문 수`)).toBeInTheDocument()
    expect(screen.getByText('42건')).toBeInTheDocument()
    expect(requestedDate).toBe(today)

    // 일 탭은 차트가 없고, 연 패널(월별 매출 추이)은 언마운트된다.
    expect(screen.queryByText('월별 매출 추이')).not.toBeInTheDocument()
    expect(screen.queryByText('일별 매출 추이')).not.toBeInTheDocument()
    expect(screen.queryByText('연 총 매출액')).not.toBeInTheDocument()
  })

  it('월 탭 전환 시 이번 달로 월 매출을 조회해 KPI 3종과 "일별 매출 추이"를 렌더한다', async () => {
    const thisMonth = dayjs().format('YYYY-MM')
    mockPicker()
    mockDetail()
    let requestedMonth: string | undefined
    server.use(
      http.get(`${BASE_URL}/api/franchises/1/sales/years/:year`, () =>
        HttpResponse.json(yearlySalesFixture()),
      ),
      http.get(`${BASE_URL}/api/franchises/1/sales/months/:month`, ({ params }) => {
        requestedMonth = params.month as string
        return HttpResponse.json(monthlySalesFixture())
      }),
    )

    const user = userEvent.setup()
    renderPage('/franchise-sales?franchiseId=1')

    await screen.findByText('연 총 매출액')
    await user.click(screen.getByRole('tab', { name: '월' }))

    expect(await screen.findByText('월 총 매출액')).toBeInTheDocument()
    expect(screen.getByText('9,900,000원')).toBeInTheDocument()
    expect(screen.getByText('월 총 주문 수')).toBeInTheDocument()
    expect(screen.getByText('88건')).toBeInTheDocument()
    expect(screen.getByText('일평균 매출')).toBeInTheDocument()
    expect(screen.getByText('330,000원')).toBeInTheDocument()
    expect(requestedMonth).toBe(thisMonth)

    expect(screen.getByText('일별 매출 추이')).toBeInTheDocument()
    expect(screen.queryByText('월별 매출 추이')).not.toBeInTheDocument()
  })
})
