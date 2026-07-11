import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { DeptAttendanceBoardWidget } from './DeptAttendanceBoardWidget'

/**
 * DeptAttendanceBoardWidget(DepartmentDetailView 전용, adapt-ui 신규) 검증.
 * `/me`의 PersonalRecordsWidget과 동형 구조라 PersonalRecordsWidget.test.tsx의 탭 전환·월 변경
 * 케이스를 그대로 복제한다. 대상 엔드포인트는 DEPT_ATTENDANCE_MONTHLY/DEPT_ATTENDANCE_PENDING.
 */

const MONTHLY_URL = `${BASE_URL}/api/employees/attendances/1/monthly`
const PENDING_URL = `${BASE_URL}/api/employees/attendances/1/monthly/pending`

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

function makeMonthlyRow(empId: number, empName: string, total: number, pending: number, approved: number) {
  return {
    empInfo: { empId, empNo: `20260700${empId}`, empName, deptName: '본사', positionName: '사원' },
    summary: { totalAttendanceCount: total, pendingAttendanceCount: pending, approvedAttendanceCount: approved, overtimeMinutes: 0 },
    attendanceInfo: [],
  }
}

function makePendingRow(empId: number, empName: string, attendanceId: number, attendanceDate: string) {
  return {
    empInfo: { empId, empNo: `20260700${empId}`, empName, deptName: '본사', positionName: '사원' },
    attendanceInfo: {
      attendanceId,
      attendanceStatus: 'NORMAL',
      attendanceDate,
      startAt: '09:00:00',
      endAt: '18:00:00',
      isApproved: false,
      draftId: null,
    },
  }
}

function mockAll() {
  server.use(
    http.get(MONTHLY_URL, () => HttpResponse.json(makePage([]))),
    http.get(PENDING_URL, () => HttpResponse.json(makePage([]))),
  )
}

function renderWidget() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DeptAttendanceBoardWidget deptId={1} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DeptAttendanceBoardWidget - 월별 근태 탭(기본)', () => {
  it('부서원 합산 통계와 최근 목록을 렌더하고 "자세히 보기"는 /attendance/dept로 연결된다', async () => {
    mockAll()
    server.use(
      http.get(MONTHLY_URL, () =>
        HttpResponse.json(
          makePage([makeMonthlyRow(1, '홍길동', 12, 2, 10), makeMonthlyRow(2, '김철수', 8, 0, 8)]),
        ),
      ),
    )

    renderWidget()

    expect(await screen.findByText('20건')).toBeInTheDocument()
    expect(screen.getByText('2건')).toBeInTheDocument()
    expect(screen.getByText('18건')).toBeInTheDocument()
    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('김철수')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: '자세히 보기 →' })
    expect(link).toHaveAttribute('href', '/attendance/dept')
  })

  it('최근 목록이 없으면 빈 상태 문구를 보여준다', async () => {
    mockAll()

    renderWidget()

    expect(await screen.findByText('이번 달 근태 기록이 없습니다.')).toBeInTheDocument()
  })
})

describe('DeptAttendanceBoardWidget - 승인 대기 탭', () => {
  it('탭 전환 시 부서 승인 대기 목록을 조회하고 totalElements를 통계로 보여준다', async () => {
    mockAll()
    server.use(
      http.get(PENDING_URL, () =>
        HttpResponse.json({
          ...makePage([makePendingRow(1, '홍길동', 100, '2026-07-05')]),
          totalElements: 3,
        }),
      ),
    )
    const user = userEvent.setup()
    renderWidget()

    await user.click(screen.getByRole('tab', { name: '승인 대기' }))

    await waitFor(() => expect(screen.getByText('3건')).toBeInTheDocument())
    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('2026-07-05')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: '자세히 보기 →' })
    expect(link).toHaveAttribute('href', '/attendance/dept')
  })

  it('승인 대기 목록이 없으면 빈 상태 문구를 보여준다', async () => {
    mockAll()
    const user = userEvent.setup()
    renderWidget()

    await user.click(screen.getByRole('tab', { name: '승인 대기' }))

    expect(await screen.findByText('승인 대기 중인 근태가 없습니다.')).toBeInTheDocument()
  })
})

describe('DeptAttendanceBoardWidget - 월 변경', () => {
  it('이전/다음 달 버튼 클릭 시 yearMonth 쿼리 파라미터가 갱신된다', async () => {
    mockAll()
    const requestedYearMonths: string[] = []
    server.use(
      http.get(MONTHLY_URL, ({ request }) => {
        const url = new URL(request.url)
        requestedYearMonths.push(url.searchParams.get('yearMonth') ?? '')
        return HttpResponse.json(makePage([]))
      }),
    )
    const user = userEvent.setup()
    renderWidget()

    const currentYearMonth = dayjs().format('YYYY-MM')
    await waitFor(() => expect(requestedYearMonths).toContain(currentYearMonth))

    await user.click(screen.getByRole('button', { name: '이전 달' }))
    const prevYearMonth = dayjs(currentYearMonth).subtract(1, 'month').format('YYYY-MM')
    await waitFor(() => expect(requestedYearMonths).toContain(prevYearMonth))
  })

  it('네이티브 month 입력이 빈 값으로 바뀌어도 크래시하지 않고 이전 값을 유지한다', async () => {
    mockAll()
    const { container } = renderWidget()

    const currentYearMonth = dayjs().format('YYYY-MM')
    const monthInput = container.querySelector('input[type="month"]') as HTMLInputElement
    await waitFor(() => expect(monthInput.value).toBe(currentYearMonth))

    fireEvent.change(monthInput, { target: { value: '' } })

    await waitFor(() => expect(monthInput.value).toBe(currentYearMonth))
  })
})

describe('DeptAttendanceBoardWidget - 로딩 상태', () => {
  it('월별 근태 조회 중에는 "불러오는 중..."이 노출된다', async () => {
    let resolveResponse: ((value: Response) => void) | undefined
    const gate = new Promise<Response>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.get(MONTHLY_URL, () => gate),
      http.get(PENDING_URL, () => HttpResponse.json(makePage([]))),
    )

    renderWidget()

    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument()

    resolveResponse?.(HttpResponse.json(makePage([])))
  })
})
