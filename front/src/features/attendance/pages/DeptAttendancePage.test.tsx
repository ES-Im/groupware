import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { DeptAttendancePage } from './DeptAttendancePage'

/**
 * DeptAttendancePage(F305, ROADMAP2 T3.4-a) 회귀 방지 테스트.
 *
 * 검증 대상:
 * - deptId 미확정(primary 소속 없음) 시 대기 안내만 렌더하고 monthly 요청이 발생하지 않는다.
 * - deptId 확정 후 로딩/에러/빈 상태 렌더.
 * - 검색어(디바운스)/월/상태 필터 변경 시 쿼리 파라미터가 갱신되고 page가 0으로 리셋된다.
 *
 * MyAttendancePage.test.tsx(F303/F304)와 usePrimaryDeptId.test.tsx의 헬퍼 패턴을 그대로
 * 복제한다(신규 목 레이어 구축 금지). deptId 미확정 케이스는 BoardDetailPage.test.tsx의
 * "enabled:false라 어떤 핸들러도 등록하지 않는다 — onUnhandledRequest:'error'가 잡아준다" 패턴을 따른다.
 */

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

/** deptId===null이면 isPrimary 소속이 없는 것으로, 아니면 해당 deptId를 primary로 목킹한다. */
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

/** resolve를 밖으로 노출해 언제든 응답을 확정지을 수 있는 지연 프라미스 헬퍼(MyAttendancePage.test.tsx 패턴). */
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

/** F306(DEPT_ATTENDANCE_PENDING) content[] 원소 1건. attendanceInfo가 단건 객체인 점이 makeRow와 다르다. */
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
    // deptId가 undefined인 동안 useDeptAttendanceMonthlyQuery는 enabled:false로 대기하므로
    // 어떤 monthly 핸들러도 등록하지 않는다(onUnhandledRequest:'error'가 실수로 호출됐다면 잡아준다).
    mockMePrimaryDept(null)

    renderPage()

    expect(
      await screen.findByText('부서 정보를 확인하는 중입니다...'),
    ).toBeInTheDocument()
    // 필터 툴바/탭이 렌더되지 않아야 한다.
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

    // 정리: 지연된 프라미스를 확정해 unhandled rejection 경고를 남기지 않는다.
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
        // totalPages 2를 줘 "다음" 버튼으로 page=1 이동이 가능하게 한다.
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

    // 초기 요청: yearMonth 기본값(현재월) + page=0(usePageState 초기값).
    const currentYearMonth = dayjs().format('YYYY-MM')
    expect(requests[0].yearMonth).toBe(currentYearMonth)
    expect(requests[0].page).toBe('0')

    // "다음 페이지" 클릭으로 page=1 이동.
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.page === '1')).toBe(true))

    // 검색어 입력(300ms 디바운스 후 확정) → keyword 갱신 + page 0으로 리셋.
    const keywordInput = screen.getByLabelText('부서원 이름 검색')
    await user.type(keywordInput, '홍길동')
    await waitFor(
      () =>
        expect(
          requests.some((r) => r.keyword === '홍길동' && (r.page === null || r.page === '0')),
        ).toBe(true),
      { timeout: 2000 },
    )

    // 다시 "다음 페이지"로 page=1 이동 후, 월 필터 변경 시에도 page가 0으로 리셋되는지 확인.
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

    // 다시 "다음 페이지"로 page=1 이동 후, 상태 필터 변경 시에도 page가 0으로 리셋되는지 확인.
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

    // 초기 활성 탭(월별 근태)이 먼저 로드된다.
    await screen.findByText('부서원 근태 기록이 없습니다.')

    await user.click(screen.getByRole('tab', { name: '승인 대기' }))

    expect(await screen.findByText('김대기')).toBeInTheDocument()
    expect(screen.getByText('지각/조퇴')).toBeInTheDocument()
    // PaginationControls unit="건" 렌더 확인(범위 요약 문구에 '건'이 포함된다).
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

    // 탭①: 검색어 입력(디바운스 확정) + 다음 페이지 이동.
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

    // 탭②로 전환(탭①의 DOM은 언마운트되지만 부모 컴포넌트 state는 유지되어야 한다).
    await user.click(screen.getByRole('tab', { name: '승인 대기' }))
    expect(await screen.findByText('대기사원9')).toBeInTheDocument()

    // 다시 탭①로 복귀 — 검색어 입력값이 초기화되지 않고 그대로 남아있어야 한다.
    await user.click(screen.getByRole('tab', { name: '월별 근태' }))
    const keywordInputAfter = await screen.findByLabelText('부서원 이름 검색')
    expect(keywordInputAfter).toHaveValue('홍길동')

    // 재마운트 시 쿼리도 유지된 page=1로 재요청된다(0으로 리셋되지 않음).
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

    // 탭②로 전환 후 다음 페이지 이동.
    await user.click(screen.getByRole('tab', { name: '승인 대기' }))
    await screen.findByText('대기사원1')
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(pendingRequests.some((r) => r.page === '1')).toBe(true))
    await screen.findByText('대기사원2')

    // 탭①로 전환했다가 다시 탭②로 복귀.
    await user.click(screen.getByRole('tab', { name: '월별 근태' }))
    await screen.findByText('사원1')
    await user.click(screen.getByRole('tab', { name: '승인 대기' }))

    // page=1 상태가 유지되므로(0으로 리셋됐다면 대기사원1이 보였을 것) 캐시든 재조회든 대기사원2가 다시 렌더된다.
    expect(await screen.findByText('대기사원2')).toBeInTheDocument()
    expect(screen.queryByText('대기사원1')).not.toBeInTheDocument()
  })
})

describe('DeptAttendancePage (F307) - 근태 수정 다이얼로그 배선(T4.3)', () => {
  it('탭①의 [수정] 버튼 클릭 시 다이얼로그가 열리고 대상 근태 시각이 채워진다', async () => {
    mockMePrimaryDept(DEPT_ID)
    const editableItem = { ...makeAttendanceItem(77), isApproved: false, startAt: '07:30:00', endAt: null }
    mockMonthlyDefault([{ ...makeRow(1), attendanceInfo: [editableItem] }])
    mockPendingDefault([])

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('사원1')
    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByRole('dialog', { name: '근태 수정' })).toBeInTheDocument()
    expect(screen.getByLabelText('시작 시각')).toHaveValue('07:30:00')
    expect(screen.getByLabelText('종료 시각')).toHaveValue('')
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
    await user.click(screen.getByRole('button', { name: '수정' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getByRole('tab', { name: '승인 대기' }))
    await screen.findByText('박대기')
    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('시작 시각')).toHaveValue('10:00:00')
    // 다이얼로그가 여러 개 중복 마운트되지 않고 항상 단일 인스턴스만 존재한다.
    expect(screen.queryAllByRole('dialog')).toHaveLength(1)
  })
})
