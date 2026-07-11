import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseInquiryListPage } from './FranchiseInquiryListPage'

/**
 * FranchiseInquiryListPage(F1617, ROADMAP(FRANCHISE) T5.1) 회귀 방지 테스트.
 * FranchiseListPage.test.tsx의 헬퍼 패턴(MSW server.use + QueryClient 래퍼 + MemoryRouter
 * 상세 플레이스홀더)을 복제한다.
 *
 * 검증 대상:
 * - 로딩/빈 목록/에러 상태 렌더 + 목록 6컬럼(가맹점명·문의제목·문의일시·답변여부·담당자명·삭제요청) 표시.
 * - 검색어는 300ms 디바운스 후에만 keyword 쿼리 파라미터로 반영 + page 0 리셋.
 * - 답변여부 select 변경 시 isAnswered=true/false 쿼리 파라미터 + page 0 리셋.
 * - 기간(from/to) date input 변경 시 각각 쿼리 파라미터 반영 + page 0 리셋.
 * - 행 클릭 시 `/franchise-inquiries/:inquiryId`로 navigate.
 * - 담당자 필터 버튼 클릭 시 EmployeePicker 다이얼로그가 열린다(선택/적용은 department 도메인
 *   테스트 영역이므로 오픈까지만 검증 — FranchiseListPage.test.tsx와 동일 범위).
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeInquiry(id: number, title: string, overrides?: Record<string, unknown>) {
  return {
    inquiryId: id,
    externalId: `EXT-${id}`,
    franchiseId: 10,
    franchiseName: '테스트강남점',
    inquiryTitle: title,
    inquiryAt: '2026-07-01T10:30:00',
    isAnswered: false,
    assignedManagerId: 7,
    assignedManagerName: '김담당',
    isDeleted: false,
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

function mockInquiriesDefault(items: unknown[] = [makeInquiry(1, '환불 문의')]) {
  server.use(
    http.get(`${BASE_URL}/api/franchise-inquiries`, () => HttpResponse.json(makePage(items))),
  )
}

function DetailPlaceholder() {
  const { inquiryId } = useParams()
  return <div>가맹점 문의 상세 화면 inquiryId={inquiryId}</div>
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/franchise-inquiries']}>
        <Routes>
          <Route path="/franchise-inquiries" element={<FranchiseInquiryListPage />} />
          <Route path="/franchise-inquiries/:inquiryId" element={<DetailPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FranchiseInquiryListPage (F1617) - 목록 렌더/상태', () => {
  it('로딩 문구 후 응답 content의 가맹점명·문의제목·문의일시·답변여부·담당자명·삭제요청이 표에 렌더된다', async () => {
    mockInquiriesDefault([
      makeInquiry(1, '환불 문의'),
      makeInquiry(2, '영업시간 문의', {
        franchiseName: '역삼점',
        isAnswered: true,
        assignedManagerName: '박매니저',
        isDeleted: true,
      }),
    ])

    renderPage()

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()

    const row1 = await screen.findByRole('button', { name: /환불 문의/ })
    expect(within(row1).getByText('테스트강남점')).toBeInTheDocument()
    expect(within(row1).getByText('2026-07-01 10:30')).toBeInTheDocument()
    expect(within(row1).getByText('미답변')).toBeInTheDocument()
    expect(within(row1).getByText('김담당')).toBeInTheDocument()
    expect(within(row1).getByText('-')).toBeInTheDocument()

    const row2 = screen.getByRole('button', { name: /영업시간 문의/ })
    expect(within(row2).getByText('역삼점')).toBeInTheDocument()
    expect(within(row2).getByText('답변완료')).toBeInTheDocument()
    expect(within(row2).getByText('박매니저')).toBeInTheDocument()
    expect(within(row2).getByText('삭제 요청')).toBeInTheDocument()
  })

  it('담당자명(assignedManagerName)이 null이면 "미배정"으로 렌더된다(T5.4, 담당자 미배정 문의)', async () => {
    mockInquiriesDefault([
      makeInquiry(3, '담당자 미배정 문의', { assignedManagerId: null, assignedManagerName: null }),
    ])

    renderPage()

    const row = await screen.findByRole('button', { name: /담당자 미배정 문의/ })
    expect(within(row).getByText('미배정')).toBeInTheDocument()
  })

  it('빈 목록이면 "조회 조건에 해당하는 문의가 없습니다."가 렌더된다', async () => {
    mockInquiriesDefault([])

    renderPage()

    expect(
      await screen.findByText('조회 조건에 해당하는 문의가 없습니다.'),
    ).toBeInTheDocument()
  })

  it('조회 실패 시 에러 문구와 토스트가 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPage()

    expect(await screen.findByText('문의 목록을 불러오지 못했습니다.')).toBeInTheDocument()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})

describe('FranchiseInquiryListPage (F1617) - 검색 디바운스', () => {
  it('검색 입력은 디바운스 후에만 keyword 쿼리 파라미터로 반영되고 page가 0으로 리셋된다', async () => {
    const requests: Array<{ keyword: string | null; page: string | null }> = []

    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        requests.push({
          keyword: url.searchParams.get('keyword'),
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json({
          ...makePage([makeInquiry(1, '환불 문의')], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('환불 문의')
    expect(requests[0].keyword).toBeNull()
    expect(requests[0].page).toBe('0')

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.page === '1')).toBe(true))

    await user.type(screen.getByLabelText('문의 제목 검색'), '환불')

    expect(requests.every((r) => r.keyword !== '환불')).toBe(true)

    await waitFor(() =>
      expect(requests.some((r) => r.keyword === '환불' && r.page === '0')).toBe(true),
    )
  })
})

describe('FranchiseInquiryListPage (F1617) - 답변여부 필터', () => {
  it('"답변완료" 옵션 선택 시 isAnswered=true로 전송되고 page가 0으로 리셋된다', async () => {
    const requests: Array<{ isAnswered: string | null; page: string | null }> = []

    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        requests.push({
          isAnswered: url.searchParams.get('isAnswered'),
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json({
          ...makePage([makeInquiry(1, '환불 문의')], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('환불 문의')
    expect(requests[0].isAnswered).toBeNull()

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.page === '1')).toBe(true))

    await user.selectOptions(
      screen.getByLabelText('답변여부 필터'),
      screen.getByRole('option', { name: '답변완료' }),
    )

    await waitFor(() =>
      expect(requests.some((r) => r.isAnswered === 'true' && r.page === '0')).toBe(true),
    )
  })
})

describe('FranchiseInquiryListPage (F1617) - 기간 필터', () => {
  it('조회 시작일/종료일 입력 시 from/to 쿼리 파라미터로 반영되고 page가 0으로 리셋된다', async () => {
    const requests: Array<{ from: string | null; to: string | null; page: string | null }> = []

    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        requests.push({
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json({
          ...makePage([makeInquiry(1, '환불 문의')], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('환불 문의')

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.page === '1')).toBe(true))

    const fromInput = screen.getByLabelText('조회 시작일')
    await user.type(fromInput, '2026-07-01')

    await waitFor(() =>
      expect(requests.some((r) => r.from === '2026-07-01' && r.page === '0')).toBe(true),
    )

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.page === '1' && r.from === '2026-07-01')).toBe(true))

    const toInput = screen.getByLabelText('조회 종료일')
    await user.type(toInput, '2026-07-31')

    await waitFor(() =>
      expect(
        requests.some((r) => r.from === '2026-07-01' && r.to === '2026-07-31' && r.page === '0'),
      ).toBe(true),
    )
  })
})

describe('FranchiseInquiryListPage (F1617) - 행 클릭 내비게이션', () => {
  it('행 클릭 시 /franchise-inquiries/:inquiryId 상세 페이지로 이동한다', async () => {
    mockInquiriesDefault([makeInquiry(7, '역삼점 문의')])

    const user = userEvent.setup()
    renderPage()

    const row = await screen.findByRole('button', { name: /역삼점 문의/ })
    await user.click(row)

    expect(await screen.findByText('가맹점 문의 상세 화면 inquiryId=7')).toBeInTheDocument()
  })
})

describe('FranchiseInquiryListPage (F1617) - 담당자 필터', () => {
  it('담당자 버튼 클릭 시 EmployeePicker 다이얼로그가 열린다', async () => {
    mockInquiriesDefault()
    // EmployeePicker가 마운트되며 부서 목록(DEPT_LIST)을 추가 호출한다 — 빈 페이지로 응답만 보장.
    server.use(
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(makePage([]))),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('환불 문의')
    await user.click(screen.getByRole('button', { name: '담당자 전체' }))

    expect(await screen.findByText('담당자 필터')).toBeInTheDocument()
  })
})
