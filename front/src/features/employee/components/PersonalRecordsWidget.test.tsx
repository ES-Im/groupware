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

/**
 * PersonalRecordsWidget(MyInfoPage 전용, adapt-ui 리디자인) 검증.
 *
 * 근태/연차/출장 3개 도메인의 "내 이력" 쿼리 훅을 재사용하는 위젯이라, 각 탭의 데이터 소스
 * 엔드포인트(MY_ATTENDANCE_MONTHLY(+SUMMARY)/MY_LEAVE_REQUEST_HISTORY/MY_BUSINESS_TRIP_REQUEST_HISTORY)를
 * MyAttendancePage.test.tsx/useMyLeaveHistoryQuery.test.tsx 등 기존 슬라이스가 이미 확립한 MSW
 * 엔드포인트 그대로 재사용한다.
 */

const ATTENDANCE_MONTHLY_URL = `${BASE_URL}/api/employees/attendances/me/monthly`
const ATTENDANCE_SUMMARY_URL = `${BASE_URL}/api/employees/attendances/me/monthly/summary`
const LEAVE_HISTORY_URL = `${BASE_URL}/api/leaves/employees/me/request-history`
const TRIP_HISTORY_URL = `${BASE_URL}/api/business-trips/employees/me/request-history`

function makeAttendancePage(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 5,
    first: true,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

function mockAll() {
  server.use(
    http.get(ATTENDANCE_MONTHLY_URL, () => HttpResponse.json(makeAttendancePage([]))),
    http.get(ATTENDANCE_SUMMARY_URL, () =>
      HttpResponse.json({
        totalAttendanceCount: 0,
        pendingAttendanceCount: 0,
        approvedAttendanceCount: 0,
        overtimeMinutes: 0,
      }),
    ),
    http.get(LEAVE_HISTORY_URL, () => HttpResponse.json([])),
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

describe('PersonalRecordsWidget - 근태 탭(기본)', () => {
  it('근태 요약(건수/승인대기/처리완료)과 목록 데이터를 렌더하고 "자세히 보기"는 /attendance/me로 연결된다', async () => {
    mockAll()
    server.use(
      http.get(ATTENDANCE_MONTHLY_URL, () =>
        HttpResponse.json(
          makeAttendancePage([
            {
              attendanceId: 1,
              attendanceStatus: 'NORMAL',
              attendanceDate: '2026-07-01',
              startAt: '09:00:00',
              endAt: '18:00:00',
              isApproved: true,
              draftId: null,
            },
          ]),
        ),
      ),
      http.get(ATTENDANCE_SUMMARY_URL, () =>
        HttpResponse.json({
          totalAttendanceCount: 12,
          pendingAttendanceCount: 2,
          approvedAttendanceCount: 10,
          overtimeMinutes: 30,
        }),
      ),
    )

    renderWidget()

    expect(await screen.findByText('12건')).toBeInTheDocument()
    expect(screen.getByText('2건')).toBeInTheDocument()
    expect(screen.getByText('10건')).toBeInTheDocument()
    expect(screen.getByText(/2026-07-01/)).toBeInTheDocument()

    const links = screen.getAllByRole('link', { name: '자세히 보기 →' })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/attendance/me')
  })

  it('attendanceStatus가 null이면(출근만 하고 아직 마감 전) "진행 중" outline 배지로 렌더된다', async () => {
    mockAll()
    server.use(
      http.get(ATTENDANCE_MONTHLY_URL, () =>
        HttpResponse.json(
          makeAttendancePage([
            {
              attendanceId: 2,
              attendanceStatus: null,
              attendanceDate: '2026-07-11',
              startAt: '09:00:00',
              endAt: null,
              isApproved: false,
              draftId: null,
            },
          ]),
        ),
      ),
    )

    renderWidget()

    const matches = await screen.findAllByText('진행 중')
    expect(matches).toHaveLength(1)
    const badge = matches.find((el) => el.getAttribute('data-slot') === 'badge')
    expect(badge).toHaveAttribute('data-variant', 'outline')
  })
})

describe('PersonalRecordsWidget - 연차 탭', () => {
  it('탭 전환 시 연차 이력을 조회하고, WAITING·IN_PROGRESS는 대기·나머지는 완료로 집계되며 "자세히 보기"는 /leaves/me로 연결된다', async () => {
    mockAll()
    server.use(
      http.get(LEAVE_HISTORY_URL, () =>
        HttpResponse.json([
          { draftId: 1, leaveType: '연차', startAt: '2026-07-01', endAt: '2026-07-01', requestedLeaveDays: 1, approvalStatus: '결재대기' },
          { draftId: 2, leaveType: '연차', startAt: '2026-07-02', endAt: '2026-07-02', requestedLeaveDays: 1, approvalStatus: '결재진행중' },
          { draftId: 3, leaveType: '반차', startAt: '2026-07-03', endAt: '2026-07-03', requestedLeaveDays: 0.5, approvalStatus: '결재완료' },
          { draftId: 4, leaveType: '연차', startAt: '2026-07-04', endAt: '2026-07-04', requestedLeaveDays: 1, approvalStatus: '반려' },
          { draftId: 5, leaveType: '연차', startAt: '2026-07-05', endAt: '2026-07-05', requestedLeaveDays: 1, approvalStatus: '미상신' },
        ]),
      ),
    )
    const user = userEvent.setup()
    renderWidget()

    await user.click(screen.getByRole('tab', { name: '연차' }))

    // 연차 건수 5, 승인 대기(결재대기+결재진행중) 2, 처리 완료(결재완료+반려+미상신) 3.
    await waitFor(() => expect(screen.getByText('5건')).toBeInTheDocument())
    expect(screen.getByText('2건')).toBeInTheDocument()
    expect(screen.getByText('3건')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: '자세히 보기 →' })
    expect(link).toHaveAttribute('href', '/leaves/me')
  })
})

describe('PersonalRecordsWidget - 출장 탭', () => {
  it('탭 전환 시 출장 이력을 조회하고, "자세히 보기"는 /approval/business-trips/me/history로 연결된다', async () => {
    mockAll()
    server.use(
      http.get(TRIP_HISTORY_URL, () =>
        HttpResponse.json([
          { draftId: 10, startAt: '2026-07-05', endAt: '2026-07-06', destination: '부산', purpose: '출장 업무', approvalStatus: '결재대기' },
        ]),
      ),
    )
    const user = userEvent.setup()
    renderWidget()

    await user.click(screen.getByRole('tab', { name: '출장' }))

    expect(await screen.findByText('부산')).toBeInTheDocument()
    expect(screen.getByText('출장 업무', { exact: false })).toBeInTheDocument()

    const link = screen.getByRole('link', { name: '자세히 보기 →' })
    expect(link).toHaveAttribute('href', '/approval/business-trips/me/history')
  })
})

describe('PersonalRecordsWidget - 월 변경', () => {
  it('이전/다음 달 버튼 및 월 입력 변경 시 yearMonth 쿼리 파라미터가 갱신된다', async () => {
    mockAll()
    const requestedYearMonths: string[] = []
    server.use(
      http.get(ATTENDANCE_MONTHLY_URL, ({ request }) => {
        const url = new URL(request.url)
        requestedYearMonths.push(url.searchParams.get('yearMonth') ?? '')
        return HttpResponse.json(makeAttendancePage([]))
      }),
      http.get(ATTENDANCE_SUMMARY_URL, () =>
        HttpResponse.json({
          totalAttendanceCount: 0,
          pendingAttendanceCount: 0,
          approvedAttendanceCount: 0,
          overtimeMinutes: 0,
        }),
      ),
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

    // jsdom의 input[type=month]는 실제 브라우저처럼 세그먼트 단위로 키 입력을 누적하지 않아
    // user.clear()+user.type()으로 문자 하나씩 타이핑하면 중간에 잠깐 ''가 되어(clear 직후)
    // 이후 타이핑이 씹히는 결과가 나올 수 있다(handleYearMonthChange가 ''를 무시하는 가드와 충돌).
    // 실제 사용자가 네이티브 month 피커로 "2026-05"를 한 번에 확정하는 것과 동등하게
    // fireEvent.change로 최종 값만 한 번에 반영한다.
    const monthInput = container.querySelector('input[type="month"]') as HTMLInputElement
    fireEvent.change(monthInput, { target: { value: '2026-05' } })
    await waitFor(() => expect(requestedYearMonths).toContain('2026-05'))
  })

  it('네이티브 month 입력의 클리어 버튼으로 값이 비워져도(이전 조회 월을 유지하며) 크래시하지 않는다', async () => {
    mockAll()
    const requestedYearMonths: string[] = []
    server.use(
      http.get(ATTENDANCE_MONTHLY_URL, ({ request }) => {
        const url = new URL(request.url)
        requestedYearMonths.push(url.searchParams.get('yearMonth') ?? '')
        return HttpResponse.json(makeAttendancePage([]))
      }),
    )
    const { container } = renderWidget()

    const currentYearMonth = dayjs().format('YYYY-MM')
    await waitFor(() => expect(requestedYearMonths).toContain(currentYearMonth))

    const monthInput = container.querySelector('input[type="month"]') as HTMLInputElement
    fireEvent.change(monthInput, { target: { value: '' } })

    // yearMonth=''로 재조회가 나가지 않고(가드가 무시), 직전 유효 값이 그대로 유지된다.
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
      http.get(TRIP_HISTORY_URL, () => HttpResponse.json([])),
    )

    renderWidget()

    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument()

    resolveResponse?.(
      HttpResponse.json({
        totalAttendanceCount: 0,
        pendingAttendanceCount: 0,
        approvedAttendanceCount: 0,
        overtimeMinutes: 0,
      }),
    )
  })
})
