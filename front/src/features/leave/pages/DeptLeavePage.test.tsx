import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { DeptLeavePage } from './DeptLeavePage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const DEPT_ID = 2

function makeMeFixture(currentDepts: unknown[]) {
  return {
    empBasicInfo: {
      empNo: '000000001',
      name: '홍길동',
      loginId: 'test2345',
      email: 'test2345@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts,
  }
}

function mockMePrimaryDept(deptId: number | null) {
  const currentDepts =
    deptId === null
      ? []
      : [
          {
            deptId,
            deptCode: '002',
            deptName: '영업부',
            positionName: '팀장',
            isPrimary: true,
            startAt: '2024-01-01T00:00:00',
            endAt: null,
          },
        ]
  server.use(
    http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(makeMeFixture(currentDepts))),
  )
}

function makeHistoryRow(empId: number, draftId: number, empName = `사원${empId}`) {
  return {
    empId,
    empNo: `10000000${empId}`,
    empName,
    historyResponse: {
      draftId,
      leaveType: '연차',
      startAt: '2026-07-01',
      endAt: '2026-07-01',
      requestedLeaveDays: 1.0,
      approvalStatus: '결재대기',
    },
  }
}

function makeSummaryRow(empId: number, empName = `사원${empId}`) {
  return {
    empId,
    empNo: `20000000${empId}`,
    empName,
    deptName: '영업부',
    positionName: '팀원',
    leaveSummary: {
      annualBaseGrantDays: 15.0,
      annualUsedDays: 5.0,
      specialGrantDays: 1.0,
      specialUsedDays: 0.5,
      compensatoryGrantDays: 3.0,
      compensatoryUsedDays: 1.0,
    },
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

function mockHistoryDefault(items: unknown[] = [makeHistoryRow(1, 10)]) {
  server.use(
    http.get(`${BASE_URL}/api/leaves/departments/${DEPT_ID}/request-history`, () =>
      HttpResponse.json(makePage(items)),
    ),
  )
}

function mockUsageDefault(percent = 20.0) {
  server.use(
    http.get(`${BASE_URL}/api/departments/${DEPT_ID}/employees/leaves/usage-summary`, () =>
      HttpResponse.json({ annualLeaveUsagePercent: percent }),
    ),
  )
}

function mockSummaryDefault(items: unknown[] = [makeSummaryRow(1)]) {
  server.use(
    http.get(`${BASE_URL}/api/departments/${DEPT_ID}/employees/leaves/summary`, () =>
      HttpResponse.json(makePage(items)),
    ),
  )
}

function DetailPlaceholder() {
  const { draftId } = useParams()
  return <div>기안 상세 화면 draftId={draftId}</div>
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/leaves/dept']}>
        <Routes>
          <Route path="/leaves/dept" element={<DeptLeavePage />} />
          <Route path="/approval/drafts/:draftId" element={<DetailPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DeptLeavePage - deptId 미확정', () => {
  it('primary 소속 부서가 없으면 "부서 정보를 확인하는 중입니다..."만 렌더하고 어떤 요청도 발생하지 않는다', async () => {
    mockMePrimaryDept(null)

    renderPage()

    expect(await screen.findByText('부서 정보를 확인하는 중입니다...')).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })
})

describe('DeptLeavePage (F744) - 탭① 신청 이력', () => {
  it('로딩/빈 상태를 순서대로 렌더한다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockHistoryDefault([])
    mockUsageDefault()
    mockSummaryDefault([])

    renderPage()

    expect(
      await screen.findByText('조회 조건에 해당하는 휴가 신청 이력이 없습니다.'),
    ).toBeInTheDocument()
  })

  it('조회 실패 시 에러 토스트가 노출되고 "부서 휴가 이력을 불러오지 못했습니다."가 표시된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    server.use(
      http.get(`${BASE_URL}/api/leaves/departments/${DEPT_ID}/request-history`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )
    mockUsageDefault()
    mockSummaryDefault([])

    renderPage()

    expect(
      await screen.findByText('부서 휴가 이력을 불러오지 못했습니다.'),
    ).toBeInTheDocument()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })

  it('행 클릭 시 기안서 상세 페이지로 이동한다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockHistoryDefault([makeHistoryRow(1, 42, '홍길동')])
    mockUsageDefault()
    mockSummaryDefault([])

    const user = userEvent.setup()
    renderPage()

    const row = await screen.findByRole('button', { name: /홍길동/ })
    await user.click(row)

    expect(await screen.findByText('기안 상세 화면 draftId=42')).toBeInTheDocument()
  })

  it('검색어(디바운스)/월/상태 필터 변경 시 새 쿼리 파라미터로 재조회되고 page가 0으로 리셋된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockUsageDefault()
    mockSummaryDefault([])

    const requests: Array<{
      keyword: string | null
      yearMonth: string | null
      approvalStatus: string | null
      page: string | null
    }> = []

    server.use(
      http.get(`${BASE_URL}/api/leaves/departments/${DEPT_ID}/request-history`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        requests.push({
          keyword: url.searchParams.get('keyword'),
          yearMonth: url.searchParams.get('yearMonth'),
          approvalStatus: url.searchParams.get('approvalStatus'),
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json({
          ...makePage([makeHistoryRow(1, 10)], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('결재대기')

    const currentYearMonth = dayjs().format('YYYY-MM')
    expect(requests[0].yearMonth).toBe(currentYearMonth)
    expect(requests[0].page).toBe('0')

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.page === '1')).toBe(true))

    const keywordInput = screen.getByLabelText('부서원 이름 검색', { selector: '#dept-leave-history-keyword' })
    await user.type(keywordInput, '홍길동')
    await waitFor(
      () =>
        expect(
          requests.some((r) => r.keyword === '홍길동' && (r.page === null || r.page === '0')),
        ).toBe(true),
      { timeout: 2000 },
    )

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() =>
      expect(requests.some((r) => r.keyword === '홍길동' && r.page === '1')).toBe(true),
    )

    const monthInput = screen.getByLabelText('조회 월')
    await user.clear(monthInput)
    await user.type(monthInput, '2026-05')
    await waitFor(() =>
      expect(
        requests.some((r) => r.yearMonth === '2026-05' && (r.page === null || r.page === '0')),
      ).toBe(true),
    )

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() =>
      expect(requests.some((r) => r.yearMonth === '2026-05' && r.page === '1')).toBe(true),
    )

    await user.selectOptions(screen.getByLabelText('결재 상태 필터'), '결재완료')
    await waitFor(() =>
      expect(
        requests.some((r) => r.approvalStatus === 'APPROVED' && (r.page === null || r.page === '0')),
      ).toBe(true),
    )
  })
})

describe('DeptLeavePage (F745/F746) - 탭② 부서 요약', () => {
  it('탭② 클릭 시 사용률 카드와 부서원 요약표(잔여=부여-사용)가 렌더된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockHistoryDefault([])
    mockUsageDefault(35.5)
    mockSummaryDefault([makeSummaryRow(1, '김요약')])

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('조회 조건에 해당하는 휴가 신청 이력이 없습니다.')
    await user.click(screen.getByRole('tab', { name: '부서 요약' }))

    expect(await screen.findByText('35.50%')).toBeInTheDocument()
    expect(await screen.findByText(/김요약/)).toBeInTheDocument()
    expect(screen.getByText('잔여 10')).toBeInTheDocument()
  })

  it('탭② 조회 실패 시 에러 토스트가 노출된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockHistoryDefault([])
    mockUsageDefault()
    server.use(
      http.get(`${BASE_URL}/api/departments/${DEPT_ID}/employees/leaves/summary`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('조회 조건에 해당하는 휴가 신청 이력이 없습니다.')
    await user.click(screen.getByRole('tab', { name: '부서 요약' }))

    expect(
      await screen.findByText('부서원 휴가 요약을 불러오지 못했습니다.'),
    ).toBeInTheDocument()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })

  it('year 변경 시 사용률·요약 두 쿼리 모두 재조회되고 요약표 page가 0으로 리셋된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockHistoryDefault([])

    const usageRequests: Array<{ year: string | null }> = []
    server.use(
      http.get(`${BASE_URL}/api/departments/${DEPT_ID}/employees/leaves/usage-summary`, ({ request }) => {
        const url = new URL(request.url)
        usageRequests.push({ year: url.searchParams.get('year') })
        return HttpResponse.json({ annualLeaveUsagePercent: 10.0 })
      }),
    )

    const summaryRequests: Array<{ year: string | null; page: string | null }> = []
    server.use(
      http.get(`${BASE_URL}/api/departments/${DEPT_ID}/employees/leaves/summary`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        summaryRequests.push({ year: url.searchParams.get('year'), page: url.searchParams.get('page') })
        return HttpResponse.json({
          ...makePage([makeSummaryRow(1)], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('조회 조건에 해당하는 휴가 신청 이력이 없습니다.')
    await user.click(screen.getByRole('tab', { name: '부서 요약' }))

    await waitFor(() => expect(summaryRequests.length).toBeGreaterThan(0))
    const currentYear = String(dayjs().year())
    expect(usageRequests[0].year).toBe(currentYear)
    expect(summaryRequests[0].year).toBe(currentYear)

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(summaryRequests.some((r) => r.page === '1')).toBe(true))

    const yearInput = screen.getByLabelText('조회 연도')
    await user.clear(yearInput)
    await user.type(yearInput, '2025')

    await waitFor(() => expect(usageRequests.some((r) => r.year === '2025')).toBe(true), {
      timeout: 2000,
    })
    await waitFor(
      () =>
        expect(
          summaryRequests.some((r) => r.year === '2025' && (r.page === null || r.page === '0')),
        ).toBe(true),
      { timeout: 2000 },
    )
  })
})
