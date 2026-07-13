import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingReservationCreatePage } from './MeetingReservationCreatePage'

// 신청 일시는 "현재 이후"라야 스키마 검증을 통과하므로, 하드코딩 대신 항상 미래인 날짜를 쓴다
// (과거 고정일이 지나면 실패하던 회귀 방지).
const FUTURE_DATE = dayjs().add(3, 'day').format('YYYY-MM-DD')

/**
 * MeetingReservationCreatePage(F802+F803, ROADMAP T3.3-b, P2) 회귀 방지 테스트.
 *
 * MeetingRoomSearchAndSelect(T3.3-a)가 이미 개별 테스트에서 검증되었으므로, 여기서는 조립 페이지의
 * 책임(회의실 선택 → meetingDate/startAt/endAt 동기화, zod 사전검증, capacity 초과 경고,
 * reserverId 미확정 fail-closed, 성공 시 payload 조합 + navigate)만 확인한다.
 * EmployeeSelectField(참여자)가 department 도메인 useDepartmentsQuery/useDepartmentMembersQuery를
 * 함께 조회하므로 GET /api/departments, /api/departments/:id/members 목이 필요하다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function pageOf(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: items.length,
    first: true,
    last: true,
    empty: items.length === 0,
  }
}

function meFixture(empId: number) {
  return {
    empBasicInfo: {
      empId,
      empNo: '000000001',
      name: '홍길동',
      loginId: 'test1234',
      email: 'test1234@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts: [],
  }
}

function deptSummary(deptId: number, deptName: string) {
  return {
    deptInfoResponse: {
      deptId,
      deptCode: String(deptId).padStart(3, '0'),
      deptName,
      isActive: true,
      parentDeptId: null,
    },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

/** GET /api/employees/me, /api/departments, /api/departments/1/members, /api/meeting-rooms/available를 등록한다. */
function mockBaseline({ reserverEmpId = 7 }: { reserverEmpId?: number } = {}) {
  server.use(
    http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(reserverEmpId))),
    http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(pageOf([deptSummary(1, '개발팀')]))),
    http.get(`${BASE_URL}/api/departments/1/members`, () =>
      HttpResponse.json(
        pageOf([
          { empId: 101, empNo: 'E101', empName: '김철수', extensionNo: null, email: 'kim@haruon.com', position: '사원' },
        ]),
      ),
    ),
    http.get(`${BASE_URL}/api/meeting-rooms/available`, () =>
      HttpResponse.json(pageOf([{ meetingRoomId: 3, name: '대회의실', capacity: 1, isAvailable: true }])),
    ),
    // 회의실 선택 시 좌측 카드가 회의실 정보(상세)와 첨부 이미지(파일 목록)를 조회한다.
    http.get(`${BASE_URL}/api/meeting-rooms/3`, () =>
      HttpResponse.json({ meetingRoomId: 3, name: '대회의실', description: '3층 대회의실', capacity: 1, isAvailable: true }),
    ),
    http.get(`${BASE_URL}/api/meeting-rooms/3/files`, () => HttpResponse.json([])),
  )
}

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/meetings/new']}>
        <Routes>
          <Route
            path="/meetings/new"
            element={
              <>
                <MeetingReservationCreatePage />
                <LocationDisplay />
              </>
            }
          />
          <Route path="/meetings" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function selectRoom(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText('날짜'), { target: { value: FUTURE_DATE } })
  fireEvent.change(screen.getByLabelText('시작 시각'), { target: { value: '10:00' } })
  fireEvent.change(screen.getByLabelText('종료 시각'), { target: { value: '11:00' } })
  fireEvent.change(screen.getByLabelText('최소 수용인원'), { target: { value: '1' } })
  await user.click(screen.getByRole('button', { name: '회의실 검색' }))
  await user.click(await screen.findByRole('button', { name: '대회의실' }))
}

describe('MeetingReservationCreatePage - 회의실 선택 전', () => {
  it('회의실을 선택하기 전에는 안내 문구만 노출한다', () => {
    mockBaseline()
    renderPage()

    expect(screen.getByText('회의실을 선택하면 예약 정보를 입력할 수 있습니다.')).toBeInTheDocument()
  })
})

describe('MeetingReservationCreatePage - 회의실 선택 시 날짜/시각 동기화', () => {
  it('선택된 검색 조건(meetingDate/startAt/endAt)이 예약 폼 입력값으로 프리필된다(편집 가능)', async () => {
    mockBaseline()
    const user = userEvent.setup()
    renderPage()

    await selectRoom(user)

    expect(await screen.findByLabelText('신청 날짜')).toHaveValue(FUTURE_DATE)
    expect(screen.getByLabelText('예약 시작 시각')).toHaveValue('10:00')
    expect(screen.getByLabelText('예약 종료 시각')).toHaveValue('11:00')
  })
})

describe('MeetingReservationCreatePage - zod 사전검증', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('제목/참여자를 비운 채 제출하면 인라인 에러를 보여주고 API를 호출하지 않는다', async () => {
    mockBaseline()
    let createCalled = false
    server.use(
      http.post(`${BASE_URL}/api/meetings`, () => {
        createCalled = true
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await selectRoom(user)
    await user.click(screen.getByRole('button', { name: '예약' }))

    const alerts = await screen.findAllByRole('alert')
    const alertTexts = alerts.map((el) => el.textContent)
    expect(alertTexts).toContain('회의 제목을 입력해주세요')
    expect(alertTexts).toContain('참여자를 최소 1명 선택해주세요')
    expect(createCalled).toBe(false)
  })
})

describe('MeetingReservationCreatePage - 수용 인원 초과 경고', () => {
  it('참여자 수가 선택 회의실 capacity를 초과하면 경고만 표시하고 제출을 막지 않는다', async () => {
    mockBaseline()
    server.use(
      http.get(`${BASE_URL}/api/departments/1/members`, () =>
        HttpResponse.json(
          pageOf([
            { empId: 101, empNo: 'E101', empName: '김철수', extensionNo: null, email: 'kim@haruon.com', position: '사원' },
            { empId: 102, empNo: 'E102', empName: '이영희', extensionNo: null, email: 'lee@haruon.com', position: '대리' },
          ]),
        ),
      ),
      http.post(`${BASE_URL}/api/meetings`, () => new HttpResponse(null, { status: 201 })),
    )
    const user = userEvent.setup()
    renderPage()

    await selectRoom(user) // capacity=1인 대회의실 선택

    await user.click(screen.getByRole('button', { name: '참여자 추가' }))
    await user.click(await screen.findByRole('button', { name: '개발팀' }))
    await user.click(await screen.findByRole('button', { name: /김철수/ }))
    await user.click(await screen.findByRole('button', { name: /이영희/ }))
    await user.click(screen.getByRole('button', { name: '완료' }))

    expect(screen.getByText('참여자 수(2명)가 회의실 수용 인원(1명)을 초과했습니다.')).toBeInTheDocument()
  })
})

describe('MeetingReservationCreatePage - reserverId 미확정 fail-closed', () => {
  it('본인 정보(me) 조회가 실패해 reserverId가 확정되지 않으면 회의실을 선택해도 "예약" 버튼이 비활성이다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(pageOf([deptSummary(1, '개발팀')]))),
      http.get(`${BASE_URL}/api/departments/1/members`, () => HttpResponse.json(pageOf([]))),
      http.get(`${BASE_URL}/api/meeting-rooms/available`, () =>
        HttpResponse.json(pageOf([{ meetingRoomId: 3, name: '대회의실', capacity: 1, isAvailable: true }])),
      ),
      http.get(`${BASE_URL}/api/meeting-rooms/3`, () =>
        HttpResponse.json({ meetingRoomId: 3, name: '대회의실', description: '3층 대회의실', capacity: 1, isAvailable: true }),
      ),
      http.get(`${BASE_URL}/api/meeting-rooms/3/files`, () => HttpResponse.json([])),
    )
    const user = userEvent.setup()
    renderPage()

    await selectRoom(user)

    expect(screen.getByRole('button', { name: '예약' })).toBeDisabled()
  })
})

describe('MeetingReservationCreatePage - 정상 입력 해피패스', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('성공 시 meetingRoomId+reserverId를 포함한 payload로 POST하고 /meetings로 navigate + 성공 토스트', async () => {
    mockBaseline({ reserverEmpId: 7 })
    let registeredBody: Record<string, unknown> | undefined
    server.use(
      http.post(`${BASE_URL}/api/meetings`, async ({ request }) => {
        registeredBody = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await selectRoom(user)
    await user.type(screen.getByLabelText(/^회의 제목/), '주간 회의')
    await user.click(screen.getByRole('button', { name: '참여자 추가' }))
    await user.click(await screen.findByRole('button', { name: '개발팀' }))
    await user.click(await screen.findByRole('button', { name: /김철수/ }))
    await user.click(screen.getByRole('button', { name: '완료' }))

    await user.click(screen.getByRole('button', { name: '예약' }))

    await waitFor(() =>
      expect(registeredBody).toEqual({
        meetingRoomId: 3,
        reserverId: 7,
        title: '주간 회의',
        meetingDate: FUTURE_DATE,
        startAt: '10:00',
        endAt: '11:00',
        participantIds: [101],
      }),
    )

    expect(await screen.findByTestId('location')).toHaveTextContent('/meetings')
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('회의를 예약했습니다')
  })
})
