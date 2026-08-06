import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { DeptAttendancePage } from './DeptAttendancePage'

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

function makeAttendanceItem(attendanceId: number, status = 'NORMAL') {
  return {
    attendanceId,
    attendanceStatus: status,
    attendanceDate: '2026-07-01',
    startAt: '09:00:00',
    endAt: '18:00:00',
    isApproved: true,
    draftId: null,
  }
}

function makeRow(empId: number) {
  return {
    empInfo: {
      empId,
      empNo: `10000000${empId}`,
      empName: `사원${empId}`,
      deptName: '영업부',
      positionName: '팀원',
    },
    summary: {
      approvedAttendanceCount: 1,
      pendingAttendanceCount: 0,
      totalAttendanceCount: 1,
      overtimeMinutes: 30,
    },
    attendanceInfo: [makeAttendanceItem(1)],
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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <DeptAttendancePage />
    </QueryClientProvider>,
  )
}

function mockMonthlyDefault(items: unknown[] = [makeRow(1)]) {
  server.use(
    http.get(`${BASE_URL}/api/employees/attendances/${DEPT_ID}/monthly`, () =>
      HttpResponse.json(makePage(items)),
    ),
  )
}

function makePendingRow(empId: number, empName = `대기사원${empId}`) {
  return {
    empInfo: {
      empId,
      empNo: `20000000${empId}`,
      empName,
      deptName: '영업부',
      positionName: '팀원',
    },
    attendanceInfo: makeAttendanceItem(200 + empId, 'LATE_EARLY'),
  }
}

function mockPendingDefault(items: unknown[] = [makePendingRow(1)]) {
  server.use(
    http.get(`${BASE_URL}/api/employees/attendances/${DEPT_ID}/monthly/pending`, () =>
      HttpResponse.json(makePage(items)),
    ),
  )
}

describe('DeptAttendancePage (F305) - deptId 미확정', () => {
  it('primary 소속 부서가 없으면 "부서 정보를 확인하는 중입니다..."만 렌더하고 monthly 요청은 발생하지 않는다', async () => {
    mockMePrimaryDept(null)

    renderPage()

    expect(
      await screen.findByText('부서 정보를 확인하는 중입니다...'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('부서원 이름 검색')).not.toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })
})

describe('DeptAttendancePage (F305) - 로딩/에러/빈 상태', () => {
  it('목록 조회 중에는 "불러오는 중..."이 노출된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    const listDeferred = deferred<Response>()
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/${DEPT_ID}/monthly`, () => listDeferred.promise),
    )

    renderPage()

    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument()

    listDeferred.resolve(HttpResponse.json(makePage([])))
  })

  it('목록 조회 실패 시 에러 토스트가 노출되고 "부서 근태 목록을 불러오지 못했습니다."가 표시된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/${DEPT_ID}/monthly`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPage()

    expect(
      await screen.findByText('부서 근태 목록을 불러오지 못했습니다.'),
    ).toBeInTheDocument()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })

  it('목록이 빈 배열이면 "부서원 근태 기록이 없습니다."가 노출된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockMonthlyDefault([])

    renderPage()

    expect(await screen.findByText('부서원 근태 기록이 없습니다.')).toBeInTheDocument()
  })
})

describe('DeptAttendancePage (F305) - 필터 변경/페이지 리셋', () => {
  it('검색어(디바운스)/월/상태 필터 변경 시 새 쿼리 파라미터로 재조회되고 page가 0으로 리셋된다', async () => {
    mockMePrimaryDept(DEPT_ID)

    const requests: Array<{
      keyword: string | null
      yearMonth: string | null
      status: string | null
      page: string | null
    }> = []

    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/${DEPT_ID}/monthly`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        requests.push({
          keyword: url.searchParams.get('keyword'),
          yearMonth: url.searchParams.get('yearMonth'),
          status: url.searchParams.get('status'),
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json({
          ...makePage([makeRow(1)], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('사원1')

    const currentYearMonth = dayjs().format('YYYY-MM')
    expect(requests[0].yearMonth).toBe(currentYearMonth)
    expect(requests[0].page).toBe('0')

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.page === '1')).toBe(true))

    const keywordInput = screen.getByLabelText('부서원 이름 검색')
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

    await user.selectOptions(screen.getByLabelText('근태 상태 필터'), '결근')
    await waitFor(() =>
      expect(
        requests.some((r) => r.status === 'ABSENT' && (r.page === null || r.page === '0')),
      ).toBe(true),
    )
  })
})

describe('DeptAttendancePage (F306) - 승인 대기 탭', () => {
  it('탭② 클릭 시 승인 대기 목록+페이징이 정상 렌더된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockMonthlyDefault([])
    mockPendingDefault([makePendingRow(1, '김대기')])

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('부서원 근태 기록이 없습니다.')

    await user.click(screen.getByRole('tab', { name: '승인 대기' }))

    expect(await screen.findByText('김대기')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('지각/조퇴')).toBeInTheDocument()
    expect(screen.getByText((_, element) => element?.textContent === '1-1 / 1건')).toBeInTheDocument()
  })

  it('탭② 조회 실패 시 에러 토스트가 노출되고 "승인 대기 목록을 불러오지 못했습니다."가 표시된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockMonthlyDefault([])
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/${DEPT_ID}/monthly/pending`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('부서원 근태 기록이 없습니다.')
    await user.click(screen.getByRole('tab', { name: '승인 대기' }))

    expect(
      await screen.findByText('승인 대기 목록을 불러오지 못했습니다.'),
    ).toBeInTheDocument()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})

describe('DeptAttendancePage (F305/F306) - 탭①/탭② 상태 분리(usePageState 별도 인스턴스)', () => {
  it('탭①에서 검색어/페이지를 변경한 뒤 탭②로 전환했다 돌아와도 탭①의 검색어 입력값과 조회 페이지가 유지된다', async () => {
    mockMePrimaryDept(DEPT_ID)

    const monthlyRequests: Array<{ keyword: string | null; page: string | null }> = []
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/${DEPT_ID}/monthly`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        monthlyRequests.push({
          keyword: url.searchParams.get('keyword'),
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json({
          ...makePage([makeRow(1)], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )
    mockPendingDefault([makePendingRow(9, '대기사원9')])

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('사원1')

    const keywordInput = screen.getByLabelText('부서원 이름 검색')
    await user.type(keywordInput, '홍길동')
    await waitFor(
      () => expect(monthlyRequests.some((r) => r.keyword === '홍길동')).toBe(true),
      { timeout: 2000 },
    )
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() =>
      expect(monthlyRequests.some((r) => r.keyword === '홍길동' && r.page === '1')).toBe(true),
    )

    await user.click(screen.getByRole('tab', { name: '승인 대기' }))
    expect(await screen.findByText('대기사원9')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '월별 근태' }))
    const keywordInputAfter = await screen.findByLabelText('부서원 이름 검색')
    expect(keywordInputAfter).toHaveValue('홍길동')

    await waitFor(() =>
      expect(monthlyRequests.some((r) => r.keyword === '홍길동' && r.page === '1')).toBe(true),
    )
  })

  it('탭②에서 페이지를 이동한 뒤 탭①로 전환했다 돌아와도 탭②의 조회 페이지가 유지된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockMonthlyDefault([makeRow(1)])

    const pendingRequests: Array<{ page: string | null }> = []
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/${DEPT_ID}/monthly/pending`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        pendingRequests.push({ page: url.searchParams.get('page') })
        return HttpResponse.json({
          ...makePage([makePendingRow(page === 1 ? 2 : 1)], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('사원1')

    await user.click(screen.getByRole('tab', { name: '승인 대기' }))
    await screen.findByText('대기사원1')
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(pendingRequests.some((r) => r.page === '1')).toBe(true))
    await screen.findByText('대기사원2')

    await user.click(screen.getByRole('tab', { name: '월별 근태' }))
    await screen.findByText('사원1')
    await user.click(screen.getByRole('tab', { name: '승인 대기' }))

    expect(await screen.findByText('대기사원2')).toBeInTheDocument()
    expect(screen.queryByText('대기사원1')).not.toBeInTheDocument()
  })

  it('탭②에서 상태 필터를 바꾸면 status가 서버 쿼리에 전달되고 조회 페이지가 0으로 리셋된다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockMonthlyDefault([makeRow(1)])

    const pendingRequests: Array<{ status: string | null; page: string | null }> = []
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/${DEPT_ID}/monthly/pending`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        pendingRequests.push({
          status: url.searchParams.get('status'),
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json({
          ...makePage([makePendingRow(page === 1 ? 2 : 1)], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('사원1')
    await user.click(screen.getByRole('tab', { name: '승인 대기' }))
    await screen.findByText('대기사원1')

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await screen.findByText('대기사원2')

    await user.selectOptions(screen.getByLabelText('근태 상태 필터'), '지각/조퇴')

    await waitFor(() =>
      expect(pendingRequests.some((r) => r.status === 'LATE_EARLY' && r.page === '0')).toBe(true),
    )
    expect(await screen.findByText('대기사원1')).toBeInTheDocument()
  })
})

describe('DeptAttendancePage (F307) - 근태 수정 다이얼로그 배선(T4.3)', () => {
  it('탭①에서 사원 선택 후 캘린더의 미승인 이벤트 클릭 시 다이얼로그가 열리고 대상 근태 시각이 채워진다', async () => {
    mockMePrimaryDept(DEPT_ID)
    const editableItem = { ...makeAttendanceItem(77), isApproved: false, startAt: '07:30:00', endAt: null }
    mockMonthlyDefault([{ ...makeRow(1), attendanceInfo: [editableItem] }])
    mockPendingDefault([])

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('사원1')
    await user.click(screen.getByText('사원1'))

    const calendar = document.querySelector('.attendance-calendar') as HTMLElement
    const eventEl = await within(calendar).findByText('정상')
    fireEvent.click(eventEl)

    expect(await screen.findByRole('dialog', { name: '근태 수정' })).toBeInTheDocument()
    expect(screen.getByLabelText('시작 시각')).toHaveValue('07:30:00')
    expect(screen.getByLabelText('종료 시각')).toHaveValue('')
  })

  it('승인된(isApproved===true) 캘린더 이벤트를 클릭해도 다이얼로그가 열리지 않는다', async () => {
    mockMePrimaryDept(DEPT_ID)
    const approvedItem = { ...makeAttendanceItem(77), isApproved: true }
    mockMonthlyDefault([{ ...makeRow(1), attendanceInfo: [approvedItem] }])
    mockPendingDefault([])

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('사원1')
    await user.click(screen.getByText('사원1'))

    const calendar = document.querySelector('.attendance-calendar') as HTMLElement
    const eventEl = await within(calendar).findByText('정상')
    fireEvent.click(eventEl)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('탭②의 [수정] 버튼 클릭 시 다이얼로그가 열리고 대상 근태 시각이 채워진다', async () => {
    mockMePrimaryDept(DEPT_ID)
    mockMonthlyDefault([])
    const editablePending = makePendingRow(5, '박대기')
    editablePending.attendanceInfo = {
      ...editablePending.attendanceInfo,
      isApproved: false,
      startAt: '10:00:00',
      endAt: '19:00:00',
    }
    mockPendingDefault([editablePending])

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('부서원 근태 기록이 없습니다.')
    await user.click(screen.getByRole('tab', { name: '승인 대기' }))
    await screen.findByText('박대기')

    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByRole('dialog', { name: '근태 수정' })).toBeInTheDocument()
    expect(screen.getByLabelText('시작 시각')).toHaveValue('10:00:00')
    expect(screen.getByLabelText('종료 시각')).toHaveValue('19:00:00')
  })

  it('다이얼로그를 닫은 뒤 다른 탭에서 열어도 동일한 단일 인스턴스가 재사용된다(중복 마운트 없음)', async () => {
    mockMePrimaryDept(DEPT_ID)
    const monthlyItem = { ...makeAttendanceItem(77), isApproved: false, startAt: '07:30:00', endAt: null }
    mockMonthlyDefault([{ ...makeRow(1), attendanceInfo: [monthlyItem] }])
    const pendingRow = makePendingRow(5, '박대기')
    pendingRow.attendanceInfo = {
      ...pendingRow.attendanceInfo,
      isApproved: false,
      startAt: '10:00:00',
      endAt: '19:00:00',
    }
    mockPendingDefault([pendingRow])

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('사원1')
    await user.click(screen.getByText('사원1'))
    const calendar = document.querySelector('.attendance-calendar') as HTMLElement
    const eventEl = await within(calendar).findByText('정상')
    fireEvent.click(eventEl)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getByRole('tab', { name: '승인 대기' }))
    await screen.findByText('박대기')
    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('시작 시각')).toHaveValue('10:00:00')
    expect(screen.queryAllByRole('dialog')).toHaveLength(1)
  })
})
