import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingReservationManagementPage } from './MeetingReservationManagementPage'

/**
 * MeetingReservationManagementPage(F810, ROADMAP(MEETING-ROOMS) T5.2) 회귀 방지 테스트.
 *
 * DeptLeavePage.test.tsx/BoardListPage.test.tsx의 헬퍼 패턴을 그대로 복제한다(신규 목 레이어
 * 구축 금지). 검증 대상:
 * - 로딩/에러/빈 상태 렌더.
 * - yearMonth(즉시 반영)/keyword(300ms 디바운스)/meetingRoomId(300ms 디바운스) 필터 변경 시
 *   새 쿼리 파라미터로 재조회되고 page가 0으로 리셋된다.
 * - 행 클릭 시 P3 상세(`/meetings/:meetingId`)로 navigate한다.
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeItem(meetingId: number, title: string, reserverEmpName = '홍길동') {
  return {
    meetingId,
    meetingRoomId: 1,
    meetingRoomName: '대회의실',
    reserverId: 2,
    reserverDeptName: '기획팀',
    reserverEmpName,
    title,
    meetingDate: '2026-07-10',
    startAt: '10:00',
    endAt: '11:00',
    isCanceled: false,
    participantCount: 3,
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

function mockManagementDefault(items: unknown[] = [makeItem(1, '주간 회의')]) {
  server.use(http.get(`${BASE_URL}/api/meetings`, () => HttpResponse.json(makePage(items))))
}

function makeDetail(meetingId: number) {
  return {
    meetingId,
    meetingRoomId: 1,
    meetingRoomName: '대회의실',
    reserverId: 2,
    reserverDeptName: '기획팀',
    reserverEmpName: '김철수',
    title: '전략 회의',
    meetingDate: '2026-07-10',
    startAt: '10:00',
    endAt: '11:00',
    isCanceled: false,
    participantCount: 3,
    participants: [{ empId: 101, deptName: '기획팀', empName: '박영수' }],
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

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/meetings/management']}>
        <Routes>
          <Route path="/meetings/management" element={<MeetingReservationManagementPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MeetingReservationManagementPage (F810) - 로딩/에러/빈 상태', () => {
  it('빈 목록이면 "조회 조건에 해당하는 예약이 없습니다."가 렌더된다', async () => {
    mockManagementDefault([])

    renderPage()

    expect(
      await screen.findByText('조회 조건에 해당하는 예약이 없습니다.'),
    ).toBeInTheDocument()
  })

  it('조회 실패 시 에러 문구와 토스트가 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPage()

    expect(await screen.findByText('예약 목록을 불러오지 못했습니다.')).toBeInTheDocument()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})

describe('MeetingReservationManagementPage (F810) - 행 클릭 → 인라인 상세 패널', () => {
  it('행 클릭 시 상세 페이지로 이동하지 않고 하단에 인라인 상세 패널이 표시된다(FACILITY 조회 전용)', async () => {
    mockManagementDefault([makeItem(42, '전략 회의', '김철수')])
    server.use(
      http.get(`${BASE_URL}/api/meetings/42`, () => HttpResponse.json(makeDetail(42))),
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(999))),
    )

    const user = userEvent.setup()
    renderPage()

    const row = await screen.findByRole('button', { name: /김철수/ })
    await user.click(row)

    // 하단 인라인 패널에 상세(예약자)가 표시되고, 남의 예약이라 관리 액션은 노출되지 않는다.
    expect(await screen.findByText('기획팀 · 김철수')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '회의 정보 수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '참가자 교체' })).not.toBeInTheDocument()
  })
})

describe('MeetingReservationManagementPage (F810) - 필터 3종', () => {
  it('yearMonth는 즉시 반영, keyword/meetingRoomId는 디바운스 후 반영되며 모두 page를 0으로 리셋한다', async () => {
    const requests: Array<{
      yearMonth: string | null
      keyword: string | null
      meetingRoomId: string | null
      page: string | null
    }> = []

    server.use(
      http.get(`${BASE_URL}/api/meetings`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        requests.push({
          yearMonth: url.searchParams.get('yearMonth'),
          keyword: url.searchParams.get('keyword'),
          meetingRoomId: url.searchParams.get('meetingRoomId'),
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json({
          ...makePage([makeItem(1, '주간 회의')], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('주간 회의')

    const currentYearMonth = dayjs().format('YYYY-MM')
    expect(requests[0].yearMonth).toBe(currentYearMonth)
    expect(requests[0].page).toBe('0')

    // 페이지를 1로 이동한 뒤 yearMonth를 바꾸면 즉시 반영 + page 0 리셋.
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.page === '1')).toBe(true))

    const monthInput = screen.getByLabelText('조회 월')
    await user.clear(monthInput)
    await user.type(monthInput, '2026-05')
    await waitFor(() =>
      expect(
        requests.some((r) => r.yearMonth === '2026-05' && (r.page === null || r.page === '0')),
      ).toBe(true),
    )

    // keyword는 300ms 디바운스 후에만 반영 + page 0 리셋.
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() =>
      expect(requests.some((r) => r.yearMonth === '2026-05' && r.page === '1')).toBe(true),
    )

    const keywordInput = screen.getByLabelText('제목/예약자 검색')
    await user.type(keywordInput, '전략')
    await waitFor(
      () =>
        expect(
          requests.some((r) => r.keyword === '전략' && (r.page === null || r.page === '0')),
        ).toBe(true),
      { timeout: 2000 },
    )

    // meetingRoomId는 keyword와 동일하게 300ms 디바운스 후에만 반영 + page 0 리셋.
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() =>
      expect(requests.some((r) => r.keyword === '전략' && r.page === '1')).toBe(true),
    )

    const roomIdInput = screen.getByLabelText('회의실 ID')
    await user.type(roomIdInput, '5')
    await waitFor(
      () =>
        expect(
          requests.some((r) => r.meetingRoomId === '5' && (r.page === null || r.page === '0')),
        ).toBe(true),
      { timeout: 2000 },
    )
  })
})
