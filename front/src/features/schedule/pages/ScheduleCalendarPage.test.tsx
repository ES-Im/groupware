import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { ScheduleCalendarItem } from '../model/schedule'
import type { ScheduleDetailResponse } from '../lib/scheduleTypes'
import { ScheduleCalendarPage } from './ScheduleCalendarPage'

/**
 * ScheduleCalendarPage(F001, ROADMAP(SCHEDULE) T1.4) 회귀 방지 테스트.
 *
 * MyMeetingCalendarPage.test.tsx가 확립한 MSW+QueryClientProvider+MemoryRouter 렌더 패턴을
 * 그대로 재사용한다. GET /api/schedules/calendar에 대한 MSW 핸들러는 기존 schedule 도메인
 * 테스트(useCancelScheduleMutation.test.tsx 등)에 아직 없어 이 파일에서 server.use로 직접 구성한다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeItem(overrides: Partial<ScheduleCalendarItem> = {}): ScheduleCalendarItem {
  return {
    scheduleId: 1,
    scheduleType: 'MANUAL',
    title: '수기 일정',
    // FullCalendar 초기 뷰(dayGridMonth)가 현재월(테스트 실행 시점 실제 시스템 날짜)을 보여주므로,
    // 이벤트가 초기 뷰에 실제로 렌더되도록 오늘 날짜로 고정한다(다른 달로 고정하면 초기 뷰에
    // 렌더되지 않아 findByText가 타임아웃난다).
    scheduleDate: dayjs().format('YYYY-MM-DD'),
    startAt: '10:00:00',
    endAt: '11:00:00',
    isAllDay: false,
    isCanceled: false,
    ...overrides,
  }
}

function detail(overrides: Partial<ScheduleDetailResponse> = {}): ScheduleDetailResponse {
  return {
    scheduleId: 1,
    scheduleType: 'MANUAL',
    ownerId: 100,
    ownerDeptName: '개발팀',
    ownerEmpName: '김철수',
    isEditable: true,
    title: '일정 상세 제목',
    content: '일정 상세 내용',
    scheduleDate: dayjs().format('YYYY-MM-DD'),
    startAt: '10:00:00',
    endAt: '11:00:00',
    isAllDay: false,
    isCanceled: false,
    participantCount: 0,
    participants: [],
    ...overrides,
  }
}

function mockDetail(scheduleId: number, response: ScheduleDetailResponse) {
  server.use(http.get(`${BASE_URL}/api/schedules/${scheduleId}`, () => HttpResponse.json(response)))
}

function pageOf(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 50,
    numberOfElements: items.length,
    first: true,
    last: true,
    empty: items.length === 0,
  }
}

function deptSummary(deptId: number, deptName: string) {
  return {
    deptInfoResponse: { deptId, deptCode: String(deptId).padStart(3, '0'), deptName, isActive: true, parentDeptId: null },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

/**
 * detail() 헬퍼 기본값(isEditable:true, scheduleType:'MANUAL', isCanceled:false)은 T2.3 두 테스트
 * 모두 canManage=true를 만들어, ScheduleDetailDialog의 참여자 추가 섹션(T5.2)이 함께 마운트되며
 * GET /api/departments를 호출한다. 이 파일엔 아직 로컬에서 재현되는 레이스가 없지만, 방치하면
 * 환경에 따라 MSW onUnhandledRequest:'error'가 찍히는 잠재적 flaky 결함이라(선례:
 * ScheduleDetailDialog.test.tsx의 mockDeptPickers) 방어적으로 목을 등록해둔다.
 */
function mockDeptPickers() {
  server.use(
    http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(pageOf([deptSummary(1, '개발팀')]))),
  )
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ScheduleCalendarPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/**
 * ScheduleSidebar가 오늘 날짜 일정을 "오늘 일정" 목록으로도 함께 렌더하기 때문에(makeItem()의
 * scheduleDate 기본값이 항상 오늘), FullCalendar 그리드 쪽 이벤트 타이틀 텍스트가 사이드바와
 * 중복 매치될 수 있다. 캘린더 컨테이너(.schedule-calendar)로 쿼리 범위를 좁혀 중복을 피한다.
 */
function calendarContainer() {
  return document.querySelector('.schedule-calendar') as HTMLElement
}

describe('ScheduleCalendarPage - 정상 렌더', () => {
  it('실 데이터(MSW 응답)가 캘린더 이벤트로 렌더된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/schedules/calendar`, () =>
        HttpResponse.json([makeItem({ scheduleId: 1, title: '수기 일정' })]),
      ),
    )

    renderPage()

    expect(await within(calendarContainer()).findByText('수기 일정')).toBeInTheDocument()
  })
})

describe('ScheduleCalendarPage - scheduleType 필터', () => {
  it('"개인 일정" 체크박스 해제 시 MEETING 이벤트만 표시되고 MANUAL 이벤트는 숨겨진다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/schedules/calendar`, () =>
        HttpResponse.json([
          makeItem({ scheduleId: 1, scheduleType: 'MANUAL', title: '수기 일정 A' }),
          makeItem({ scheduleId: 2, scheduleType: 'MEETING', title: '주간 회의' }),
        ]),
      ),
    )

    const user = userEvent.setup()
    renderPage()
    const calendar = calendarContainer()

    // 필터링 전: 두 이벤트 모두 렌더된다(모든 유형이 기본 체크 상태).
    expect(await within(calendar).findByText('수기 일정 A')).toBeInTheDocument()
    expect(await within(calendar).findByText('주간 회의')).toBeInTheDocument()

    // 다중선택 체크박스 모델이라 "MEETING만 표시"를 얻으려면 MANUAL 체크를 해제한다.
    await user.click(screen.getByRole('checkbox', { name: '개인 일정' }))

    expect(await within(calendar).findByText('주간 회의')).toBeInTheDocument()
    expect(within(calendar).queryByText('수기 일정 A')).not.toBeInTheDocument()
  })
})

describe('ScheduleCalendarPage - 에러 상태', () => {
  it('조회 실패 시 handleApiError를 통해 에러 토스트가 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/schedules/calendar`, () =>
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
})

describe('ScheduleCalendarPage - 이벤트 클릭 → 상세 다이얼로그(ROADMAP(SCHEDULE) T2.3)', () => {
  it('이벤트 클릭 시 ScheduleDetailDialog가 클릭한 이벤트의 scheduleId로 열린다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/schedules/calendar`, () =>
        HttpResponse.json([makeItem({ scheduleId: 1, title: '수기 일정 A' })]),
      ),
    )
    mockDetail(1, detail({ scheduleId: 1, title: '일정 A 상세', content: '일정 A 상세 내용' }))
    mockDeptPickers()

    renderPage()

    const eventEl = await within(calendarContainer()).findByText('수기 일정 A')
    fireEvent.click(eventEl)

    expect(await screen.findByText('일정 A 상세')).toBeInTheDocument()
    expect(screen.getByText('일정 A 상세 내용')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('다른 이벤트를 연달아 클릭하면 다이얼로그 내용이 새 scheduleId 상세로 갱신된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/schedules/calendar`, () =>
        HttpResponse.json([
          makeItem({ scheduleId: 1, title: '수기 일정 A', startAt: '09:00:00', endAt: '10:00:00' }),
          makeItem({ scheduleId: 2, title: '수기 일정 B', startAt: '11:00:00', endAt: '12:00:00' }),
        ]),
      ),
    )
    mockDetail(1, detail({ scheduleId: 1, title: '일정 A 상세' }))
    mockDetail(2, detail({ scheduleId: 2, title: '일정 B 상세' }))
    mockDeptPickers()

    renderPage()

    const calendar = calendarContainer()
    const eventA = await within(calendar).findByText('수기 일정 A')
    const eventB = await within(calendar).findByText('수기 일정 B')

    fireEvent.click(eventA)
    expect(await screen.findByText('일정 A 상세')).toBeInTheDocument()

    fireEvent.click(eventB)
    expect(await screen.findByText('일정 B 상세')).toBeInTheDocument()
    expect(screen.queryByText('일정 A 상세')).not.toBeInTheDocument()
  })
})

describe('ScheduleCalendarPage - 일정 등록 다이얼로그(ROADMAP(SCHEDULE) T3.4)', () => {
  // ScheduleCreateDialog 자체의 zod 검증/서버 에러/제출 중 가드 등 세부 경로는
  // ScheduleCreateDialog.test.tsx(T3.3)가 이미 검증했으므로, 여기서는 페이지가 [일정 등록]
  // 버튼 클릭으로 open state를 올바르게 소유·전달하는지(오픈/정상 제출 후 닫힘)만 검증한다.
  it('"일정 등록" 버튼 클릭 시 등록 다이얼로그가 열린다', async () => {
    server.use(http.get(`${BASE_URL}/api/schedules/calendar`, () => HttpResponse.json([])))

    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '새 일정 등록' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('일정 등록')).toBeInTheDocument()
    expect(screen.getByLabelText(/제목/)).toBeInTheDocument()
  })

  it('폼을 채워 등록 제출에 성공하면 다이얼로그가 닫히고 성공 토스트가 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/schedules/calendar`, () => HttpResponse.json([])),
      http.post(`${BASE_URL}/api/schedules`, () =>
        HttpResponse.json({ sourceKey: 'schedule-1' }, { status: 201 }),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '새 일정 등록' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/제목/), '신규 일정')
    await user.type(screen.getByLabelText(/내용/), '신규 일정 내용')
    const startInput = document.getElementById('schedule-create-start') as HTMLInputElement
    const endInput = document.getElementById('schedule-create-end') as HTMLInputElement
    await user.type(startInput, '2026-07-15T10:00')
    await user.type(endInput, '2026-07-15T11:00')

    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('일정이 등록되었습니다')
  })
})
