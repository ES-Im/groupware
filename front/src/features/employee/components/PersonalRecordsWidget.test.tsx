import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { PersonalRecordsWidget } from './PersonalRecordsWidget'

const ATTENDANCE_MONTHLY_URL = `${BASE_URL}/api/employees/attendances/me/monthly`
const ATTENDANCE_SUMMARY_URL = `${BASE_URL}/api/employees/attendances/me/monthly/summary`
const LEAVE_HISTORY_URL = `${BASE_URL}/api/leaves/employees/me/request-history`
const LEAVE_SUMMARY_URL = `${BASE_URL}/api/employees/me/leaves/summary`
const TRIP_HISTORY_URL = `${BASE_URL}/api/business-trips/employees/me/request-history`

function makeAttendancePage(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 100,
    first: true,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

function makeAttendanceSummary(overrides: Partial<Record<string, number>> = {}) {
  return {
    totalAttendanceCount: 0,
    pendingAttendanceCount: 0,
    approvedAttendanceCount: 0,
    overtimeMinutes: 0,
    ...overrides,
  }
}

function makeLeaveSummary(overrides: Partial<Record<string, number>> = {}) {
  return {
    annualBaseGrantDays: 0,
    annualUsedDays: 0,
    specialGrantDays: 0,
    specialUsedDays: 0,
    compensatoryGrantDays: 0,
    compensatoryUsedDays: 0,
    ...overrides,
  }
}

function mockAll() {
  server.use(
    http.get(ATTENDANCE_MONTHLY_URL, () => HttpResponse.json(makeAttendancePage([]))),
    http.get(ATTENDANCE_SUMMARY_URL, () => HttpResponse.json(makeAttendanceSummary())),
    http.get(LEAVE_HISTORY_URL, () => HttpResponse.json([])),
    http.get(LEAVE_SUMMARY_URL, () => HttpResponse.json(makeLeaveSummary())),
    http.get(TRIP_HISTORY_URL, () => HttpResponse.json([])),
  )
}

function renderWidget() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PersonalRecordsWidget />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PersonalRecordsWidget - 근태 탭(기본 탭)', () => {
  it('통계 타일 4개(근태건수/승인대기/처리완료/지각·결근)와 미니 캘린더를 렌더하고, "자세히 보기" 클릭 시 내 근태 오버레이가 열린다', async () => {
    const yearMonth = dayjs().format('YYYY-MM')
    mockAll()
    server.use(
      http.get(ATTENDANCE_SUMMARY_URL, () =>
        HttpResponse.json(makeAttendanceSummary({ totalAttendanceCount: 12, pendingAttendanceCount: 5, approvedAttendanceCount: 10 })),
      ),
      http.get(ATTENDANCE_MONTHLY_URL, () =>
        HttpResponse.json(
          makeAttendancePage([
            { attendanceId: 1, attendanceStatus: 'ABSENT', attendanceDate: `${yearMonth}-05`, startAt: null, endAt: null, isApproved: true, draftId: null },
            { attendanceId: 2, attendanceStatus: 'LATE_EARLY', attendanceDate: `${yearMonth}-06`, startAt: null, endAt: null, isApproved: true, draftId: null },
          ]),
        ),
      ),
    )
    const user = userEvent.setup()
    renderWidget()

    expect(await screen.findByText('12건')).toBeInTheDocument()
    expect(screen.getByText('5건')).toBeInTheDocument()
    expect(screen.getByText('10건')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('지각 · 결근').nextElementSibling).toHaveTextContent('2건'))

    expect(screen.getByText('일')).toBeInTheDocument()
    expect(screen.getByText('결근')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '자세히 보기 →' }))

    expect(await screen.findByRole('button', { name: '출근' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '퇴근' })).toBeInTheDocument()
  })
})

describe('PersonalRecordsWidget - 휴가·출장 탭', () => {
  it('잔여 휴가 게이지(연차/특별/포상)를 렌더하고, "자세히" 클릭 시 내 휴가 오버레이가 열린다', async () => {
    mockAll()
    server.use(
      http.get(LEAVE_SUMMARY_URL, () =>
        HttpResponse.json(
          makeLeaveSummary({
            annualBaseGrantDays: 15,
            annualUsedDays: 3,
            specialGrantDays: 2,
            specialUsedDays: 0,
            compensatoryGrantDays: 1,
            compensatoryUsedDays: 1,
          }),
        ),
      ),
    )
    const user = userEvent.setup()
    renderWidget()

    await user.click(screen.getByRole('tab', { name: '휴가 · 출장' }))

    await waitFor(() => expect(screen.getByText('12 / 15')).toBeInTheDocument())
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    expect(screen.getByText('0 / 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '자세히 →' }))

    expect(await screen.findByRole('button', { name: '휴가 신청' })).toBeInTheDocument()
  })

  it('연차·출장 신청 이력을 시작일 내림차순으로 병합해 보여주고, "출장 이력" 클릭 시 내 출장 이력 오버레이가 열린다', async () => {
    mockAll()
    server.use(
      http.get(LEAVE_HISTORY_URL, () =>
        HttpResponse.json([
          { draftId: 1, leaveType: '연차', startAt: '2026-07-01', endAt: '2026-07-01', requestedLeaveDays: 1, approvalStatus: '결재대기' },
        ]),
      ),
      http.get(TRIP_HISTORY_URL, () =>
        HttpResponse.json([
          { draftId: 10, startAt: '2026-07-10', endAt: '2026-07-11', destination: '부산', purpose: '가맹점 실사', approvalStatus: '반려' },
        ]),
      ),
    )
    const user = userEvent.setup()
    renderWidget()

    await user.click(screen.getByRole('tab', { name: '휴가 · 출장' }))

    const items = await screen.findAllByRole('listitem')
    expect(items[0]).toHaveTextContent('부산')
    expect(items[0]).toHaveTextContent('반려')
    expect(items[1]).toHaveTextContent('연차')
    expect(items[1]).toHaveTextContent('결재대기')

    await user.click(screen.getByRole('button', { name: '출장 이력 →' }))

    expect(await screen.findAllByText('부산')).not.toHaveLength(0)
  })

  it('신청 내역이 없으면 안내 문구를 보여준다', async () => {
    mockAll()
    const user = userEvent.setup()
    renderWidget()

    await user.click(screen.getByRole('tab', { name: '휴가 · 출장' }))

    expect(await screen.findByText(/신청 내역이 없습니다\./)).toBeInTheDocument()
  })
})

describe('PersonalRecordsWidget - 월 변경', () => {
  it('이전/다음 달 버튼 및 월 입력 변경 시 yearMonth 쿼리 파라미터가 갱신된다', async () => {
    mockAll()
    const requestedYearMonths: string[] = []
    server.use(
      http.get(ATTENDANCE_SUMMARY_URL, ({ request }) => {
        const url = new URL(request.url)
        requestedYearMonths.push(url.searchParams.get('yearMonth') ?? '')
        return HttpResponse.json(makeAttendanceSummary())
      }),
    )
    const user = userEvent.setup()
    const { container } = renderWidget()

    const currentYearMonth = dayjs().format('YYYY-MM')
    await waitFor(() => expect(requestedYearMonths).toContain(currentYearMonth))

    await user.click(screen.getByRole('button', { name: '이전 달' }))
    const prevYearMonth = dayjs(currentYearMonth).subtract(1, 'month').format('YYYY-MM')
    await waitFor(() => expect(requestedYearMonths).toContain(prevYearMonth))

    await user.click(screen.getByRole('button', { name: '다음 달' }))
    await user.click(screen.getByRole('button', { name: '다음 달' }))
    const nextYearMonth = dayjs(currentYearMonth).add(1, 'month').format('YYYY-MM')
    await waitFor(() => expect(requestedYearMonths).toContain(nextYearMonth))

    const monthInput = container.querySelector('input[type="month"]') as HTMLInputElement
    fireEvent.change(monthInput, { target: { value: '2026-05' } })
    await waitFor(() => expect(requestedYearMonths).toContain('2026-05'))
  })

  it('네이티브 month 입력의 클리어 버튼으로 값이 비워져도(이전 조회 월을 유지하며) 크래시하지 않는다', async () => {
    mockAll()
    const requestedYearMonths: string[] = []
    server.use(
      http.get(ATTENDANCE_SUMMARY_URL, ({ request }) => {
        const url = new URL(request.url)
        requestedYearMonths.push(url.searchParams.get('yearMonth') ?? '')
        return HttpResponse.json(makeAttendanceSummary())
      }),
    )
    const { container } = renderWidget()

    const currentYearMonth = dayjs().format('YYYY-MM')
    await waitFor(() => expect(requestedYearMonths).toContain(currentYearMonth))

    const monthInput = container.querySelector('input[type="month"]') as HTMLInputElement
    fireEvent.change(monthInput, { target: { value: '' } })

    await waitFor(() => expect(monthInput.value).toBe(currentYearMonth))
    expect(requestedYearMonths).not.toContain('')
  })
})

describe('PersonalRecordsWidget - 로딩 상태', () => {
  it('근태 요약 조회 중에는 "불러오는 중..."이 노출된다', async () => {
    let resolveResponse: ((value: Response) => void) | undefined
    const gate = new Promise<Response>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.get(ATTENDANCE_MONTHLY_URL, () => HttpResponse.json(makeAttendancePage([]))),
      http.get(ATTENDANCE_SUMMARY_URL, () => gate),
      http.get(LEAVE_HISTORY_URL, () => HttpResponse.json([])),
      http.get(LEAVE_SUMMARY_URL, () => HttpResponse.json(makeLeaveSummary())),
      http.get(TRIP_HISTORY_URL, () => HttpResponse.json([])),
    )

    renderWidget()

    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument()

    resolveResponse?.(HttpResponse.json(makeAttendanceSummary()))
  })
})
