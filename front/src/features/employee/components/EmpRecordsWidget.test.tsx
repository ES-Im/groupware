import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EmpRecordsWidget } from './EmpRecordsWidget'

const DEPT_ID = 1
const EMP_ID = 7
const ATTENDANCE_URL = `${BASE_URL}/api/employees/attendances/${DEPT_ID}/monthly`
const LEAVE_URL = `${BASE_URL}/api/leaves/departments/${DEPT_ID}/request-history`
const TRIP_URL = `${BASE_URL}/api/business-trips/departments/${DEPT_ID}/request-history`

function makePage(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 100,
    numberOfElements: items.length,
    first: true,
    last: true,
    empty: items.length === 0,
  }
}

function makeMonthlyRow(
  empId: number,
  total: number,
  pending: number,
  approved: number,
  attendanceInfo: unknown[] = [],
) {
  return {
    empInfo: { empId, empNo: `20260700${empId}`, empName: `사원${empId}`, deptName: '본사', positionName: '사원' },
    summary: { totalAttendanceCount: total, pendingAttendanceCount: pending, approvedAttendanceCount: approved, overtimeMinutes: 0 },
    attendanceInfo,
  }
}

function makeLeaveRow(empId: number, draftId: number, approvalStatus: string) {
  return {
    empId,
    empNo: `20260700${empId}`,
    empName: `사원${empId}`,
    historyResponse: {
      draftId,
      leaveType: '연차',
      startAt: '2026-07-01',
      endAt: '2026-07-01',
      requestedLeaveDays: 1,
      approvalStatus,
    },
  }
}

function makeTripRow(empId: number, draftId: number, destination: string, approvalStatus: string) {
  return {
    empId,
    empNo: `20260700${empId}`,
    empName: `사원${empId}`,
    historyResponse: {
      draftId,
      startAt: '2026-07-05',
      endAt: '2026-07-06',
      destination,
      purpose: '출장 업무',
      approvalStatus,
    },
  }
}

function mockAll() {
  server.use(
    http.get(ATTENDANCE_URL, () => HttpResponse.json(makePage([]))),
    http.get(LEAVE_URL, () => HttpResponse.json(makePage([]))),
    http.get(TRIP_URL, () => HttpResponse.json(makePage([]))),
  )
}

function renderWidget() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EmpRecordsWidget empId={EMP_ID} deptId={DEPT_ID} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EmpRecordsWidget - 근태 구역(기본)', () => {
  it('대상 empId 행만 통계로 보여주고, 다른 사원 행은 무시하며 "자세히 보기"는 /attendance/dept로 연결된다', async () => {
    mockAll()
    server.use(
      http.get(ATTENDANCE_URL, () =>
        HttpResponse.json(
          makePage([
            makeMonthlyRow(99, 30, 30, 0, []),
            makeMonthlyRow(EMP_ID, 12, 2, 10, [
              { attendanceId: 1, attendanceStatus: 'NORMAL', attendanceDate: '2026-07-01', startAt: '09:00:00', endAt: '18:00:00', isApproved: true, draftId: null },
            ]),
          ]),
        ),
      ),
    )

    renderWidget()

    expect(await screen.findByText('12건')).toBeInTheDocument()
    expect(screen.getByText('2건')).toBeInTheDocument()
    expect(screen.getByText('10건')).toBeInTheDocument()
    expect(screen.queryByText('30건')).not.toBeInTheDocument()

    const links = screen.getAllByRole('link', { name: '자세히 보기 →' })
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAttribute('href', '/attendance/dept')
    expect(links[1]).toHaveAttribute('href', '/leaves/dept')
    expect(links[2]).toHaveAttribute('href', '/approval/business-trips/dept/history')
  })

  it('대상 empId 행이 없으면 "이번 달 근태 기록이 없습니다."를 보여준다', async () => {
    mockAll()
    server.use(http.get(ATTENDANCE_URL, () => HttpResponse.json(makePage([makeMonthlyRow(99, 5, 1, 4, [])]))))

    renderWidget()

    expect(await screen.findByText('이번 달 근태 기록이 없습니다.')).toBeInTheDocument()
  })
})

describe('EmpRecordsWidget - 연차 구역', () => {
  it('대상 empId 행만 필터해 건수/대기/완료를 집계한다(3구역 동시 렌더, 탭 전환 없음)', async () => {
    mockAll()
    server.use(
      http.get(LEAVE_URL, () =>
        HttpResponse.json(
          makePage([
            makeLeaveRow(99, 100, '결재대기'),
            makeLeaveRow(EMP_ID, 1, '결재대기'),
            makeLeaveRow(EMP_ID, 2, '결재진행중'),
            makeLeaveRow(EMP_ID, 3, '결재완료'),
          ]),
        ),
      ),
    )
    renderWidget()

    await waitFor(() => expect(screen.getByText('3건')).toBeInTheDocument())
    expect(screen.getByText('2건')).toBeInTheDocument()
    expect(screen.getByText('1건')).toBeInTheDocument()
  })

  it('대상 empId 행이 없으면 건수/대기/완료가 모두 0건으로 표시된다(최근 목록이 사라져 별도 안내 문구는 없음)', async () => {
    mockAll()
    server.use(
      http.get(ATTENDANCE_URL, () => HttpResponse.json(makePage([makeMonthlyRow(EMP_ID, 5, 1, 4, [])]))),
      http.get(LEAVE_URL, () => HttpResponse.json(makePage([makeLeaveRow(99, 1, '결재대기')]))),
      http.get(TRIP_URL, () =>
        HttpResponse.json(
          makePage([makeTripRow(EMP_ID, 1, '부산', '결재대기'), makeTripRow(EMP_ID, 2, '광주', '결재완료')]),
        ),
      ),
    )
    renderWidget()

    await waitFor(() => expect(screen.getAllByText('0건')).toHaveLength(3))
  })
})

describe('EmpRecordsWidget - 출장 구역', () => {
  it('대상 empId 행만 필터해 통계를 집계한다(3구역 동시 렌더, 탭 전환 없음)', async () => {
    mockAll()
    server.use(
      http.get(TRIP_URL, () =>
        HttpResponse.json(
          makePage([
            makeTripRow(99, 200, '서울', '결재대기'),
            makeTripRow(EMP_ID, 10, '부산', '결재대기'),
            makeTripRow(EMP_ID, 11, '제주', '결재진행중'),
            makeTripRow(EMP_ID, 12, '광주', '결재완료'),
          ]),
        ),
      ),
    )
    renderWidget()

    await waitFor(() => expect(screen.getByText('3건')).toBeInTheDocument())
    expect(screen.getByText('2건')).toBeInTheDocument()
    expect(screen.getByText('1건')).toBeInTheDocument()
  })
})

describe('EmpRecordsWidget - 월 변경', () => {
  it('이전/다음 달 버튼 및 월 입력 변경 시 3개 탭 쿼리의 yearMonth 파라미터가 함께 갱신된다', async () => {
    mockAll()
    const requestedYearMonths: string[] = []
    server.use(
      http.get(ATTENDANCE_URL, ({ request }) => {
        const url = new URL(request.url)
        requestedYearMonths.push(url.searchParams.get('yearMonth') ?? '')
        return HttpResponse.json(makePage([]))
      }),
    )
    const user = userEvent.setup()
    const { container } = renderWidget()

    const currentYearMonth = dayjs().format('YYYY-MM')
    await waitFor(() => expect(requestedYearMonths).toContain(currentYearMonth))

    await user.click(screen.getByRole('button', { name: '이전 달' }))
    const prevYearMonth = dayjs(currentYearMonth).subtract(1, 'month').format('YYYY-MM')
    await waitFor(() => expect(requestedYearMonths).toContain(prevYearMonth))

    const monthInput = container.querySelector('input[type="month"]') as HTMLInputElement
    fireEvent.change(monthInput, { target: { value: '2026-05' } })
    await waitFor(() => expect(requestedYearMonths).toContain('2026-05'))
  })

  it('네이티브 month 입력의 클리어로 값이 비워져도 크래시하지 않고 직전 유효 값을 유지한다', async () => {
    mockAll()
    const { container } = renderWidget()

    const currentYearMonth = dayjs().format('YYYY-MM')
    const monthInput = container.querySelector('input[type="month"]') as HTMLInputElement
    await waitFor(() => expect(monthInput.value).toBe(currentYearMonth))

    fireEvent.change(monthInput, { target: { value: '' } })

    await waitFor(() => expect(monthInput.value).toBe(currentYearMonth))
  })
})

describe('EmpRecordsWidget - 로딩 상태', () => {
  it('근태 조회 중에는 "불러오는 중..."이 노출된다', async () => {
    let resolveResponse: ((value: Response) => void) | undefined
    const gate = new Promise<Response>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.get(ATTENDANCE_URL, () => gate),
      http.get(LEAVE_URL, () => HttpResponse.json(makePage([]))),
      http.get(TRIP_URL, () => HttpResponse.json(makePage([]))),
    )

    renderWidget()

    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument()

    resolveResponse?.(HttpResponse.json(makePage([])))
  })
})
