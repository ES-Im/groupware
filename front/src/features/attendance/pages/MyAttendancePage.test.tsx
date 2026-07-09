import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MyAttendancePage } from './MyAttendancePage'

/**
 * MyAttendancePage(F303·F304, ROADMAP2.md T1.5) 회귀 방지 테스트.
 *
 * 검증 대상:
 * - 정상 렌더: 요약 카드 4개 지표 + 표 행 데이터.
 * - 로딩 상태: 목록 조회 중 "불러오는 중..." 노출.
 * - 에러 상태: handleApiError → toast.error 호출 + "근태 목록을 불러오지 못했습니다." 노출.
 * - 빈 상태: content: [] → AttendanceTable의 "근태 기록이 없습니다." 노출.
 * - 필터(월/상태) 변경 시 두 쿼리에 새 파라미터가 반영되고 page가 0으로 리셋된다.
 *
 * useMyAttendanceMonthlyQuery.test.tsx/useMyAttendanceMonthlySummaryQuery.test.tsx가 이미 확립한
 * MSW 엔드포인트(GET /api/employees/attendances/me/monthly, .../monthly/summary)를 그대로
 * 재사용한다(신규 목 레이어 구축 금지).
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeItem(attendanceId: number, status: string) {
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

const SUMMARY = {
  approvedAttendanceCount: 15,
  pendingAttendanceCount: 3,
  totalAttendanceCount: 18,
  overtimeMinutes: 125,
}

/** resolve를 밖으로 노출해 언제든 응답을 확정지을 수 있는 지연 프라미스 헬퍼(BoardListPage.test.tsx 패턴). */
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
      <MyAttendancePage />
    </QueryClientProvider>,
  )
}

function mockDefault(items: unknown[] = [makeItem(1, 'NORMAL')]) {
  server.use(
    http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, () =>
      HttpResponse.json(makePage(items)),
    ),
    http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
      HttpResponse.json(SUMMARY),
    ),
  )
}

describe('MyAttendancePage (F303/F304) - 정상 렌더', () => {
  it('요약 카드 4개 지표와 표 행 데이터가 실제로 화면에 반영된다', async () => {
    mockDefault([makeItem(1, 'NORMAL')])

    renderPage()

    // 요약 카드 4개 지표.
    expect(await screen.findByText('15')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()

    // 표 행 데이터(일자/상태 배지/출근/퇴근). 상태 필터 <select>에도 동일 라벨("정상")이 있어
    // 표 영역(role="table")으로 범위를 좁혀 조회한다.
    expect(await screen.findByText('2026-07-01')).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getByText('정상')).toBeInTheDocument()
    expect(within(table).getByText('09:00')).toBeInTheDocument()
    expect(within(table).getByText('18:00')).toBeInTheDocument()
  })
})

describe('MyAttendancePage (F303) - 로딩 상태', () => {
  it('목록 조회 중에는 "불러오는 중..."이 노출된다', async () => {
    const listDeferred = deferred<Response>()
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, () => listDeferred.promise),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(SUMMARY),
      ),
    )

    renderPage()

    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument()

    // 정리: 지연된 프라미스를 확정해 unhandled rejection 경고를 남기지 않는다.
    listDeferred.resolve(HttpResponse.json(makePage([])))
  })
})

describe('MyAttendancePage (F303/F304) - 에러 상태', () => {
  it('목록 조회 실패 시 에러 토스트가 노출되고 "근태 목록을 불러오지 못했습니다."가 표시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(SUMMARY),
      ),
    )

    renderPage()

    expect(
      await screen.findByText('근태 목록을 불러오지 못했습니다.'),
    ).toBeInTheDocument()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })

  it('요약 조회 실패 시에도 에러 토스트가 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, () =>
        HttpResponse.json(makePage([])),
      ),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPage()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })

  it('todayAttendanceQuery(오늘 출근/퇴근 판정 전용 쿼리) 조회 실패 시에도 에러 토스트가 노출된다', async () => {
    // listQuery(화면 표시용, size=10 기본값)는 정상 응답시키고, todayAttendanceQuery(size=100·
    // status 없음·page=0 고정 조합)만 500으로 실패시켜 두 쿼리가 분리되어 있음을 전제로,
    // 화면 목록은 정상인데 전용 쿼리만 실패하는 경로에서도 토스트가 뜨는지 확인한다.
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, ({ request }) => {
        const url = new URL(request.url)
        const isTodayAttendanceQuery = url.searchParams.get('size') === '100'

        if (isTodayAttendanceQuery) {
          return HttpResponse.json(
            { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
            { status: 500 },
          )
        }
        return HttpResponse.json(makePage([makeItem(1, 'NORMAL')]))
      }),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(SUMMARY),
      ),
    )

    renderPage()

    // 화면 목록(listQuery)은 정상 응답해 표에 반영된다 — 전용 쿼리만 실패한 상태임을 확인.
    expect(await screen.findByText('2026-07-01')).toBeInTheDocument()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})

describe('MyAttendancePage (F303) - 빈 상태', () => {
  it('목록이 빈 배열이면 "근태 기록이 없습니다."가 노출된다', async () => {
    mockDefault([])

    renderPage()

    expect(await screen.findByText('근태 기록이 없습니다.')).toBeInTheDocument()
  })
})

/**
 * makeItem은 attendanceDate를 '2026-07-01'로 고정하므로 "오늘" 판정(deriveTodayAttendanceButtonState)
 * 테스트에는 그대로 쓸 수 없다 — 실제 현재 날짜(dayjs().format('YYYY-MM-DD'))로 attendanceDate를
 * 덮어써야 하므로 이 describe 전용 헬퍼를 별도로 둔다(기존 makeItem/makePage는 그대로 재사용).
 */
function makeTodayItem(
  attendanceId: number,
  overrides: Partial<{ startAt: string | null; endAt: string | null; status: string }> = {},
) {
  // overrides.endAt에 명시적으로 null을 넘기는 케이스(열린 레코드)가 있어 `??`(nullish 병합)를
  // 쓰면 null도 "미지정"으로 취급돼 기본값으로 되돌아가 버린다 — 스프레드로 overrides에 있는
  // 키만 그대로 덮어써 null이 의도대로 보존되게 한다.
  return {
    attendanceId,
    attendanceStatus: 'NORMAL',
    attendanceDate: dayjs().format('YYYY-MM-DD'),
    startAt: '09:00:00',
    endAt: '18:00:00',
    isApproved: true,
    draftId: null,
    ...(overrides.status !== undefined ? { attendanceStatus: overrides.status } : {}),
    ...('startAt' in overrides ? { startAt: overrides.startAt } : {}),
    ...('endAt' in overrides ? { endAt: overrides.endAt } : {}),
  }
}

describe('MyAttendancePage (F301/F302) - 출근/퇴근 버튼 활성 상태', () => {
  it('오늘 레코드가 없으면 "출근" 버튼은 활성, "퇴근" 버튼은 비활성이다', async () => {
    // 오늘이 아닌 날짜(makeItem 고정값 2026-07-01)만 있는 목록 — deriveTodayAttendanceButtonState는
    // 오늘 레코드 없음으로 판정해야 한다.
    mockDefault([makeItem(1, 'NORMAL')])

    renderPage()

    // 초기 렌더 시점(listQuery.data === undefined, listQuery.isSuccess === false)에는 게이팅
    // (isTodayButtonEligible)에 의해 canCheckIn/canCheckOut이 항상 false로 시작한다 — 실제 목록
    // 데이터(오늘 레코드 없음)가 반영되어 isSuccess가 true가 된 뒤의 안정 상태를 waitFor로 확인한다.
    await screen.findByRole('button', { name: '출근' })
    await waitFor(() => expect(screen.getByRole('button', { name: '퇴근' })).toBeDisabled())
    await waitFor(() => expect(screen.getByRole('button', { name: '출근' })).toBeEnabled())
  })

  it('오늘 레코드 중 열린 레코드(startAt 있음·endAt 없음)가 있으면 "출근"은 비활성, "퇴근"만 활성이다', async () => {
    mockDefault([makeTodayItem(1, { startAt: '09:00:00', endAt: null })])

    renderPage()

    // 초기 렌더(listQuery.isSuccess === false)에는 게이팅에 의해 canCheckIn/canCheckOut이 모두
    // false로 시작해 "퇴근"도 비활성으로 렌더된다 — 데이터 반영(isSuccess=true) 후 상태로
    // waitFor한다(findByRole은 엘리먼트 유무만 기다릴 뿐 disabled 속성 안정화까지 기다리지 않는다).
    await waitFor(() => expect(screen.getByRole('button', { name: '출근' })).toBeDisabled())
    await waitFor(() => expect(screen.getByRole('button', { name: '퇴근' })).toBeEnabled())
  })

  it('오늘 레코드는 있으나 열린 레코드가 없으면 "출근"/"퇴근" 둘 다 비활성이다', async () => {
    mockDefault([makeTodayItem(1, { startAt: '09:00:00', endAt: '18:00:00' })])

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: '출근' })).toBeDisabled())
    expect(screen.getByRole('button', { name: '퇴근' })).toBeDisabled()
  })
})

describe('MyAttendancePage (F301) - 출근 버튼 클릭', () => {
  it('"출근" 버튼 클릭 시 POST /api/employees/attendances/me/check-in 요청이 발생하고, 성공 후 목록이 재조회된다', async () => {
    let checkInCalled = false
    // monthlyCallCount(호출 횟수) 기반 분기는 이제 같은 엔드포인트가 listQuery/
    // todayAttendanceQuery 두 쿼리에서 렌더당 최소 2번씩 불려 "2번째 호출부터"라는 가정이
    // mount 시점에 이미 깨진다(listQuery가 1번째, todayAttendanceQuery가 2번째 호출이 되어
    // 사용자가 클릭하기도 전에 "열린 레코드"가 반영돼버린다) — 실제 체크인 여부를 나타내는
    // 플래그로 바꿔 두 쿼리가 항상 같은 논리적 사실(체크인 여부)을 보게 한다.
    let hasCheckedIn = false

    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, () => {
        if (hasCheckedIn) {
          return HttpResponse.json(makePage([makeTodayItem(1, { startAt: '09:00:00', endAt: null })]))
        }
        return HttpResponse.json(makePage([]))
      }),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(SUMMARY),
      ),
      http.post(`${BASE_URL}/api/employees/attendances/me/check-in`, () => {
        checkInCalled = true
        hasCheckedIn = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('button', { name: '출근' })
    // findByRole은 엘리먼트 존재만 기다릴 뿐 disabled 속성이 안정화(listQuery.isSuccess=true)될
    // 때까지 기다리지 않으므로 waitFor로 활성 상태를 별도 확인한다.
    await waitFor(() => expect(screen.getByRole('button', { name: '출근' })).toBeEnabled())
    const checkInButton = screen.getByRole('button', { name: '출근' })

    await user.click(checkInButton)

    await waitFor(() => expect(checkInCalled).toBe(true))
    // invalidate로 monthly가 재조회되어 새 응답(열린 레코드)이 반영되면 "퇴근" 버튼이 활성화된다.
    await waitFor(() => expect(screen.getByRole('button', { name: '퇴근' })).toBeEnabled())

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  }, 10000)
})

describe('MyAttendancePage (F302) - 퇴근 버튼 클릭', () => {
  it('"퇴근" 버튼 클릭 시 PATCH /api/employees/attendances/me/check-out 요청이 발생하고, 성공 후 목록이 재조회된다', async () => {
    let checkOutCalled = false
    // 체크인 클릭 테스트와 동일한 이유로 호출 횟수 대신 실제 체크아웃 여부 플래그로 분기한다
    // (같은 엔드포인트가 listQuery/todayAttendanceQuery 두 쿼리에서 동시에 불려 호출 횟수
    // 기준 "2번째부터"가 mount 시점에 이미 어긋난다).
    let hasCheckedOut = false

    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, () => {
        if (hasCheckedOut) {
          return HttpResponse.json(
            makePage([makeTodayItem(1, { startAt: '09:00:00', endAt: '18:00:00' })]),
          )
        }
        return HttpResponse.json(makePage([makeTodayItem(1, { startAt: '09:00:00', endAt: null })]))
      }),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(SUMMARY),
      ),
      http.patch(`${BASE_URL}/api/employees/attendances/me/check-out`, () => {
        checkOutCalled = true
        hasCheckedOut = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('button', { name: '퇴근' })
    // 초기 렌더(listQuery.data === undefined)에는 canCheckOut=false 폴백이라 버튼이 비활성으로
    // 시작한다 — 목록 데이터(열린 레코드) 반영 후 활성화될 때까지 waitFor한다.
    await waitFor(() => expect(screen.getByRole('button', { name: '퇴근' })).toBeEnabled())
    const checkOutButton = screen.getByRole('button', { name: '퇴근' })

    await user.click(checkOutButton)

    await waitFor(() => expect(checkOutCalled).toBe(true))
    // invalidate로 monthly가 재조회되어 새 응답(닫힌 레코드)이 반영되면 "퇴근" 버튼이 다시 비활성화된다.
    await waitFor(() => expect(screen.getByRole('button', { name: '퇴근' })).toBeDisabled())

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  }, 10000)
})

describe('MyAttendancePage (F303/F304) - 필터 변경/페이지 리셋', () => {
  it('월/상태 필터 변경 시 새 파라미터로 두 쿼리가 재조회되고 page가 0으로 리셋된다', async () => {
    const listRequests: Array<{ yearMonth: string | null; status: string | null; page: string | null }> = []
    const summaryRequests: Array<{ yearMonth: string | null }> = []

    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, ({ request }) => {
        const url = new URL(request.url)
        listRequests.push({
          yearMonth: url.searchParams.get('yearMonth'),
          status: url.searchParams.get('status'),
          page: url.searchParams.get('page'),
        })
        // totalPages 2를 줘 "다음" 버튼으로 page=1 이동이 가능하게 한다.
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        return HttpResponse.json({
          ...makePage([makeItem(1, 'NORMAL')], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, ({ request }) => {
        const url = new URL(request.url)
        summaryRequests.push({ yearMonth: url.searchParams.get('yearMonth') })
        return HttpResponse.json(SUMMARY)
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('2026-07-01')

    // 초기 요청: MyAttendancePage의 기본값 dayjs().format('YYYY-MM')이 만드는 "실제 현재월"과
    // 비교한다(하드코딩 리터럴 대신 동적 계산 — 형제 훅 테스트처럼 yearMonth를 명시적으로 넘기면
    // "미입력 시 기본값=현재월" 동작 자체가 검증 대상에서 사라지므로 이 방식을 택한다).
    // page는 usePageState의 초기값 0을 그대로 들고 있어 getMyAttendanceMonthly가
    // "page=0"을 쿼리스트링에 실제로 실어 보낸다(page != null이면 항상 전송 — "미지정"이 아니다).
    const currentYearMonth = dayjs().format('YYYY-MM')
    expect(listRequests[0].yearMonth).toBe(currentYearMonth)
    expect(listRequests[0].page).toBe('0')
    expect(summaryRequests[0].yearMonth).toBe(currentYearMonth)

    // "다음 페이지" 클릭으로 page=1 이동(PaginationControls 컴팩트 페이저의 aria-label,
    // BoardListPage.test.tsx와 동일 컨벤션).
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(listRequests.some((r) => r.page === '1')).toBe(true))

    // 월 필터 변경 → yearMonth 갱신 + page 0으로 리셋.
    const monthInput = screen.getByLabelText('조회 월')
    await user.clear(monthInput)
    await user.type(monthInput, '2026-05')
    await waitFor(() =>
      expect(
        listRequests.some((r) => r.yearMonth === '2026-05' && (r.page === null || r.page === '0')),
      ).toBe(true),
    )
    await waitFor(() => expect(summaryRequests.some((r) => r.yearMonth === '2026-05')).toBe(true))

    // 다시 "다음 페이지"로 page=1 이동 후, 상태 필터 변경 시에도 page가 0으로 리셋되는지 확인.
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() =>
      expect(listRequests.some((r) => r.yearMonth === '2026-05' && r.page === '1')).toBe(true),
    )

    await user.selectOptions(screen.getByLabelText('근태 상태 필터'), '결근')
    await waitFor(() =>
      expect(
        listRequests.some(
          (r) => r.status === 'ABSENT' && (r.page === null || r.page === '0'),
        ),
      ).toBe(true),
    )
  })
})

describe('MyAttendancePage (F301/F302) - 출근/퇴근 버튼 게이팅(로딩·월 필터 불일치)', () => {
  it('목록 조회 중(listQuery.isSuccess === false)에는 "출근"/"퇴근" 버튼이 모두 비활성이다', async () => {
    const listDeferred = deferred<Response>()
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, () => listDeferred.promise),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(SUMMARY),
      ),
    )

    renderPage()

    const checkInButton = await screen.findByRole('button', { name: '출근' })
    const checkOutButton = screen.getByRole('button', { name: '퇴근' })
    expect(checkInButton).toBeDisabled()
    expect(checkOutButton).toBeDisabled()

    // 정리: 지연된 프라미스를 확정해 unhandled rejection 경고를 남기지 않는다.
    listDeferred.resolve(HttpResponse.json(makePage([])))
  })

  it('조회 월이 현재월이 아니어도(listQuery가 과거월을 보고 있어도) todayAttendanceQuery는 항상 현재월을 별도 조회하므로, listQuery가 보여주는 과거월의 오늘 열린 레코드에 속지 않고 "퇴근"은 비활성을 유지한다', async () => {
    // 리팩터 이전(구조 변경 전) 버전: listQuery 자체를 파생에 썼기 때문에 "월 필터가
    // 현재월과 다르면 버튼을 강제로 비활성 처리"하는 별도 게이팅(isTodayButtonEligible)이
    // 필요했다. 지금은 todayAttendanceQuery가 파라미터 고정(현재월·status 없음·page=0·
    // size=100)으로 완전히 분리되어 있어 그런 필터 기반 게이팅 자체가 사라졌다 — 대신
    // "listQuery가 어떤 월/필터를 보여주고 있든 todayAttendanceQuery의 응답만 신뢰한다"는
    // 것이 검증 대상이다. 이 테스트는 listQuery(과거월)에는 일부러 오늘 열린 레코드를 심고,
    // todayAttendanceQuery(현재월 고정)에는 실제로 오늘 기록이 없는 것으로 응답해 "퇴근"이
    // listQuery의 leaked 데이터에 속지 않고 비활성을 유지하는지 확인한다. "출근"은 오히려
    // 실제로 오늘 기록이 없으므로(전용 쿼리가 빈 배열) 활성이 되는 것이 맞다
    // (deriveTodayAttendanceButtonState 규칙 1 — 오늘 레코드 없음 → 출근 활성).
    const pastYearMonth = dayjs().subtract(1, 'month').format('YYYY-MM')
    const currentYearMonth = dayjs().format('YYYY-MM')
    const todayAttendanceRequests: Array<{
      yearMonth: string | null
      page: string | null
      size: string | null
      status: string | null
    }> = []

    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, ({ request }) => {
        const url = new URL(request.url)
        const requestedYearMonth = url.searchParams.get('yearMonth')
        const size = url.searchParams.get('size')
        const status = url.searchParams.get('status')
        const page = url.searchParams.get('page')
        // todayAttendanceQuery는 size=100·status 없음·page=0 조합으로 고정 호출된다
        // (MyAttendancePage.tsx의 파라미터 고정 — listQuery는 usePageState 기본값 size=10).
        const isTodayAttendanceQuery = size === '100'

        if (isTodayAttendanceQuery) {
          todayAttendanceRequests.push({ yearMonth: requestedYearMonth, page, size, status })
          // 전용 쿼리는 실제로 오늘 출근 기록이 없는 것으로 응답한다.
          return HttpResponse.json(makePage([]))
        }

        if (requestedYearMonth === pastYearMonth) {
          // listQuery(화면 표시용)의 과거월 응답에만 "오늘 날짜"의 열린 레코드를 일부러
          // 심는다 — 화면 목록이 과거월을 보여주는 동안에도 전용 쿼리가 이를 무시하는지
          // 검증하기 위한 장치다.
          return HttpResponse.json(
            makePage([makeTodayItem(1, { startAt: '09:00:00', endAt: null })]),
          )
        }
        return HttpResponse.json(makePage([]))
      }),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(SUMMARY),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('button', { name: '출근' })

    const monthInput = screen.getByLabelText('조회 월')
    await user.clear(monthInput)
    await user.type(monthInput, pastYearMonth)

    // 과거월 목록(오늘 열린 레코드 포함)이 실제로 화면에 반영(listQuery 로드 완료)되었는지
    // 표 데이터로 먼저 확인한다.
    await waitFor(() =>
      expect(screen.getByText(dayjs().format('YYYY-MM-DD'))).toBeInTheDocument(),
    )

    // 화면 목록엔 오늘 레코드가 보이지만, 전용 쿼리 응답엔 없으므로 "퇴근"은 여전히 비활성.
    expect(screen.getByRole('button', { name: '퇴근' })).toBeDisabled()
    // 전용 쿼리 기준으로는 실제로 오늘 기록이 없으므로 "출근"은 활성이 맞다.
    expect(screen.getByRole('button', { name: '출근' })).toBeEnabled()

    // 전용 쿼리(todayAttendanceQuery)가 실제로 화면 필터와 무관하게 고정 파라미터로
    // 나갔는지 명시적으로 검증한다.
    expect(todayAttendanceRequests.length).toBeGreaterThan(0)
    for (const req of todayAttendanceRequests) {
      expect(req.yearMonth).toBe(currentYearMonth)
      expect(req.page).toBe('0')
      expect(req.size).toBe('100')
      expect(req.status).toBeNull()
    }
  })
})

/**
 * listQuery(화면 표시용 목록)와 todayAttendanceQuery(오늘 출근/퇴근 판정 전용)가 서로 다른
 * 데이터를 반환할 수 있는 두 방향을 각각 검증한다 — 같은 엔드포인트를 서로 다른 쿼리스트링
 * 조합(size=100·status 없음·page=0 vs 사용자가 조작하는 조합)으로 두 번 호출하므로,
 * MSW 핸들러가 이 둘을 구분하지 못하면 우연히 통과하거나 잘못된 시나리오를 검증하게 된다.
 * size==='100'이면 todayAttendanceQuery, 그 외(기본 size=10)면 listQuery로 간주해 분기한다.
 */
describe('MyAttendancePage (F301/F302) - listQuery와 todayAttendanceQuery 데이터 분리', () => {
  it('화면 목록(listQuery)에는 오늘 레코드가 없어 보여도(상태 필터로 걸러짐), 전용 쿼리에 오늘 열린 레코드가 있으면 "퇴근" 버튼이 활성화된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, ({ request }) => {
        const url = new URL(request.url)
        const isTodayAttendanceQuery = url.searchParams.get('size') === '100'

        if (isTodayAttendanceQuery) {
          // 전용 쿼리: 오늘 열린 레코드(체크인만 하고 아직 체크아웃 안 함)가 실제로 있다.
          return HttpResponse.json(
            makePage([makeTodayItem(1, { startAt: '09:00:00', endAt: null })]),
          )
        }
        // listQuery(화면 표시용): 오늘과 무관한 다른 날짜 레코드만 있어, 표에는 오늘 레코드가
        // 전혀 보이지 않는다(예: 사용자가 상태 필터를 걸어 오늘 레코드가 화면에서 제외된 상황을
        // 단순화해, 응답 자체에 오늘 레코드를 아예 넣지 않는 방식으로 재현한다).
        return HttpResponse.json(makePage([makeItem(1, 'NORMAL')]))
      }),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(SUMMARY),
      ),
    )

    renderPage()

    // 화면 표(listQuery 응답)에는 오늘 날짜가 없다 — makeItem 고정값(2026-07-01)만 보인다.
    await screen.findByText('2026-07-01')
    expect(screen.queryByText(dayjs().format('YYYY-MM-DD'))).not.toBeInTheDocument()

    // 그럼에도 전용 쿼리(todayAttendanceQuery)가 오늘 열린 레코드를 담고 있으므로 "퇴근"은
    // 활성화되어야 한다 — 화면에 보이는 목록과 무관하게 전용 쿼리만으로 정확히 판정된다.
    await waitFor(() => expect(screen.getByRole('button', { name: '퇴근' })).toBeEnabled())
    expect(screen.getByRole('button', { name: '출근' })).toBeDisabled()
  })

  it('화면 목록(listQuery)에는 오늘 열린 레코드가 보여도, 전용 쿼리 응답엔 없으면 "퇴근" 버튼은 비활성을 유지한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, ({ request }) => {
        const url = new URL(request.url)
        const isTodayAttendanceQuery = url.searchParams.get('size') === '100'

        if (isTodayAttendanceQuery) {
          // 전용 쿼리: 실제로는 오늘 기록이 없다.
          return HttpResponse.json(makePage([]))
        }
        // listQuery(화면 표시용): 오늘 열린 레코드가 보인다 — 하지만 이 값은 판정에 쓰이지
        // 않아야 한다.
        return HttpResponse.json(
          makePage([makeTodayItem(1, { startAt: '09:00:00', endAt: null })]),
        )
      }),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(SUMMARY),
      ),
    )

    renderPage()

    // 화면 표(listQuery 응답)에는 오늘 날짜가 보인다.
    await screen.findByText(dayjs().format('YYYY-MM-DD'))

    // 전용 쿼리 기준으로는 오늘 기록이 없으므로 "출근"이 활성, "퇴근"은 비활성을 유지해야 한다
    // (listQuery가 보여주는 열린 레코드에 속으면 안 된다).
    await waitFor(() => expect(screen.getByRole('button', { name: '출근' })).toBeEnabled())
    expect(screen.getByRole('button', { name: '퇴근' })).toBeDisabled()
  })
})
