import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MyAttendancePage } from './MyAttendancePage'

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

    expect(await screen.findByText('15')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()

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

function makeTodayItem(
  attendanceId: number,
  overrides: Partial<{ startAt: string | null; endAt: string | null; status: string }> = {},
) {
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
    mockDefault([makeItem(1, 'NORMAL')])

    renderPage()

    await screen.findByRole('button', { name: '출근' })
    await waitFor(() => expect(screen.getByRole('button', { name: '퇴근' })).toBeDisabled())
    await waitFor(() => expect(screen.getByRole('button', { name: '출근' })).toBeEnabled())
  })

  it('오늘 레코드 중 열린 레코드(startAt 있음·endAt 없음)가 있으면 "출근"은 비활성, "퇴근"만 활성이다', async () => {
    mockDefault([makeTodayItem(1, { startAt: '09:00:00', endAt: null })])

    renderPage()

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
    await waitFor(() => expect(screen.getByRole('button', { name: '출근' })).toBeEnabled())
    const checkInButton = screen.getByRole('button', { name: '출근' })

    await user.click(checkInButton)

    await waitFor(() => expect(checkInCalled).toBe(true))
    await waitFor(() => expect(screen.getByRole('button', { name: '퇴근' })).toBeEnabled())

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  }, 10000)
})

describe('MyAttendancePage (F302) - 퇴근 버튼 클릭', () => {
  it('"퇴근" 버튼 클릭 시 PATCH /api/employees/attendances/me/check-out 요청이 발생하고, 성공 후 목록이 재조회된다', async () => {
    let checkOutCalled = false
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
    await waitFor(() => expect(screen.getByRole('button', { name: '퇴근' })).toBeEnabled())
    const checkOutButton = screen.getByRole('button', { name: '퇴근' })

    await user.click(checkOutButton)

    await waitFor(() => expect(checkOutCalled).toBe(true))
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

    const currentYearMonth = dayjs().format('YYYY-MM')
    expect(listRequests[0].yearMonth).toBe(currentYearMonth)
    expect(listRequests[0].page).toBe('0')
    expect(summaryRequests[0].yearMonth).toBe(currentYearMonth)

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(listRequests.some((r) => r.page === '1')).toBe(true))

    const monthInput = screen.getByLabelText('조회 월')
    await user.clear(monthInput)
    await user.type(monthInput, '2026-05')
    await waitFor(() =>
      expect(
        listRequests.some((r) => r.yearMonth === '2026-05' && (r.page === null || r.page === '0')),
      ).toBe(true),
    )
    await waitFor(() => expect(summaryRequests.some((r) => r.yearMonth === '2026-05')).toBe(true))

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

    listDeferred.resolve(HttpResponse.json(makePage([])))
  })

  it('조회 월이 현재월이 아니어도(listQuery가 과거월을 보고 있어도) todayAttendanceQuery는 항상 현재월을 별도 조회하므로, listQuery가 보여주는 과거월의 오늘 열린 레코드에 속지 않고 "퇴근"은 비활성을 유지한다', async () => {
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
        const isTodayAttendanceQuery = size === '100'

        if (isTodayAttendanceQuery) {
          todayAttendanceRequests.push({ yearMonth: requestedYearMonth, page, size, status })
          return HttpResponse.json(makePage([]))
        }

        if (requestedYearMonth === pastYearMonth) {
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

    await waitFor(() =>
      expect(screen.getByText(dayjs().format('YYYY-MM-DD'))).toBeInTheDocument(),
    )

    expect(screen.getByRole('button', { name: '퇴근' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '출근' })).toBeEnabled()

    expect(todayAttendanceRequests.length).toBeGreaterThan(0)
    for (const req of todayAttendanceRequests) {
      expect(req.yearMonth).toBe(currentYearMonth)
      expect(req.page).toBe('0')
      expect(req.size).toBe('100')
      expect(req.status).toBeNull()
    }
  })
})

describe('MyAttendancePage (F301/F302) - listQuery와 todayAttendanceQuery 데이터 분리', () => {
  it('화면 목록(listQuery)에는 오늘 레코드가 없어 보여도(상태 필터로 걸러짐), 전용 쿼리에 오늘 열린 레코드가 있으면 "퇴근" 버튼이 활성화된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, ({ request }) => {
        const url = new URL(request.url)
        const isTodayAttendanceQuery = url.searchParams.get('size') === '100'

        if (isTodayAttendanceQuery) {
          return HttpResponse.json(
            makePage([makeTodayItem(1, { startAt: '09:00:00', endAt: null })]),
          )
        }
        return HttpResponse.json(makePage([makeItem(1, 'NORMAL')]))
      }),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(SUMMARY),
      ),
    )

    renderPage()

    await screen.findByText('2026-07-01')
    expect(screen.queryByText(dayjs().format('YYYY-MM-DD'))).not.toBeInTheDocument()

    await waitFor(() => expect(screen.getByRole('button', { name: '퇴근' })).toBeEnabled())
    expect(screen.getByRole('button', { name: '출근' })).toBeDisabled()
  })

  it('화면 목록(listQuery)에는 오늘 열린 레코드가 보여도, 전용 쿼리 응답엔 없으면 "퇴근" 버튼은 비활성을 유지한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, ({ request }) => {
        const url = new URL(request.url)
        const isTodayAttendanceQuery = url.searchParams.get('size') === '100'

        if (isTodayAttendanceQuery) {
          return HttpResponse.json(makePage([]))
        }
        return HttpResponse.json(
          makePage([makeTodayItem(1, { startAt: '09:00:00', endAt: null })]),
        )
      }),
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly/summary`, () =>
        HttpResponse.json(SUMMARY),
      ),
    )

    renderPage()

    await screen.findByText(dayjs().format('YYYY-MM-DD'))

    await waitFor(() => expect(screen.getByRole('button', { name: '출근' })).toBeEnabled())
    expect(screen.getByRole('button', { name: '퇴근' })).toBeDisabled()
  })
})
