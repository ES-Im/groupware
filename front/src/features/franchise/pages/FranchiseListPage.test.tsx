import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseListPage } from './FranchiseListPage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeFranchise(id: number, name: string, overrides?: Record<string, unknown>) {
  return {
    id,
    name,
    address: '서울특별시 강남구 테헤란로 1',
    ownerName: '홍길동',
    BusinessStatus: '정상 영업 중',
    managerEmpId: 7,
    managerEmpName: '김담당',
    ...overrides,
  }
}

function makePage(items: unknown[], page = 0) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: page,
    size: 10,
    first: page === 0,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

function mockFranchisesDefault(items: unknown[] = [makeFranchise(1, '테스트강남점')]) {
  server.use(
    http.get(`${BASE_URL}/api/franchises`, () => HttpResponse.json(makePage(items))),
  )
}

function DetailPlaceholder() {
  const { franchiseId } = useParams()
  return <div>가맹점 상세 화면 franchiseId={franchiseId}</div>
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/franchises']}>
        <Routes>
          <Route path="/franchises" element={<FranchiseListPage />} />
          <Route path="/franchises/:franchiseId" element={<DetailPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FranchiseListPage (F1601) - 목록 렌더/상태', () => {
  it('로딩 문구 후 응답 content의 가맹점명·주소·대표자명·영업상태 표시명·담당자명이 표에 렌더된다', async () => {
    mockFranchisesDefault([
      makeFranchise(1, '테스트강남점'),
      makeFranchise(2, '역삼점', {
        address: '서울특별시 서초구 서초대로 2',
        ownerName: '이대표',
        BusinessStatus: '일시 영업 중단',
        managerEmpId: 9,
        managerEmpName: '박매니저',
      }),
    ])

    renderPage()

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()

    const row1 = await screen.findByRole('button', { name: /테스트강남점/ })
    expect(within(row1).getByText('서울특별시 강남구 테헤란로 1')).toBeInTheDocument()
    expect(within(row1).getByText('홍길동')).toBeInTheDocument()
    expect(within(row1).getByText('정상 영업 중')).toBeInTheDocument()
    expect(within(row1).getByText('김담당')).toBeInTheDocument()

    const row2 = screen.getByRole('button', { name: /역삼점/ })
    expect(within(row2).getByText('일시 영업 중단')).toBeInTheDocument()
    expect(within(row2).getByText('박매니저')).toBeInTheDocument()
  })

  it('빈 목록이면 "조회 조건에 해당하는 가맹점이 없습니다."가 렌더된다', async () => {
    mockFranchisesDefault([])

    renderPage()

    expect(
      await screen.findByText('조회 조건에 해당하는 가맹점이 없습니다.'),
    ).toBeInTheDocument()
  })

  it('조회 실패 시 에러 문구와 토스트가 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchises`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPage()

    expect(await screen.findByText('가맹점 목록을 불러오지 못했습니다.')).toBeInTheDocument()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})

describe('FranchiseListPage (F1601) - 검색 디바운스', () => {
  it('검색 입력은 디바운스 후에만 keyword 쿼리 파라미터로 반영되고 page가 0으로 리셋된다', async () => {
    const requests: Array<{ keyword: string | null; page: string | null }> = []

    server.use(
      http.get(`${BASE_URL}/api/franchises`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        requests.push({
          keyword: url.searchParams.get('keyword'),
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json({
          ...makePage([makeFranchise(1, '테스트강남점')], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('테스트강남점')
    expect(requests[0].keyword).toBeNull()
    expect(requests[0].page).toBe('0')

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.page === '1')).toBe(true))

    await user.type(screen.getByLabelText('가맹점 검색'), '강남')

    expect(requests.every((r) => r.keyword !== '강남')).toBe(true)

    await waitFor(() =>
      expect(requests.some((r) => r.keyword === '강남' && r.page === '0')).toBe(true),
    )
  })
})

describe('FranchiseListPage (F1601) - 영업상태 필터', () => {
  it('"정상 영업 중" 옵션 선택 시 status=OPEN enum 코드로 전송되고 page가 0으로 리셋된다', async () => {
    const requests: Array<{ status: string | null; page: string | null }> = []

    server.use(
      http.get(`${BASE_URL}/api/franchises`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        requests.push({
          status: url.searchParams.get('status'),
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json({
          ...makePage([makeFranchise(1, '테스트강남점')], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('테스트강남점')
    expect(requests[0].status).toBeNull()

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.page === '1')).toBe(true))

    await user.selectOptions(
      screen.getByLabelText('영업상태 필터'),
      screen.getByRole('option', { name: '정상 영업 중' }),
    )

    await waitFor(() =>
      expect(requests.some((r) => r.status === 'OPEN' && r.page === '0')).toBe(true),
    )
  })
})

describe('FranchiseListPage (F1601) - 행 클릭 내비게이션', () => {
  it('행 클릭 시 /franchises/:franchiseId 상세 페이지로 이동한다', async () => {
    mockFranchisesDefault([makeFranchise(7, '역삼점')])

    const user = userEvent.setup()
    renderPage()

    const row = await screen.findByRole('button', { name: /역삼점/ })
    await user.click(row)

    expect(await screen.findByText('가맹점 상세 화면 franchiseId=7')).toBeInTheDocument()
  })
})

describe('FranchiseListPage (F1601) - 담당자 필터', () => {
  it('담당자 버튼 클릭 시 EmployeePicker 다이얼로그가 열린다', async () => {
    mockFranchisesDefault()
    server.use(
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(makePage([]))),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('테스트강남점')
    await user.click(screen.getByRole('button', { name: '담당자 전체' }))

    expect(await screen.findByText('담당자 필터')).toBeInTheDocument()
  })
})
