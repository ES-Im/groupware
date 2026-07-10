import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingRoomManagementPage } from './MeetingRoomManagementPage'

/**
 * MeetingRoomManagementPage(F811+F812+F814, ROADMAP(MEETING-ROOMS) T6.3) 회귀 방지 테스트.
 * MeetingReservationManagementPage.test.tsx/DeptLeavePage.test.tsx의 헬퍼 패턴을 복제한다.
 *
 * 검증 대상:
 * - 로딩/에러/빈 상태 렌더.
 * - 활성상태/향후예약 tri-state select는 boolean이 false도 유효값이라 선택 즉시 반영(디바운스
 *   불필요) + page 0 리셋.
 * - 행 클릭 시 P7 상세(`/meeting-rooms/management/:meetingRoomId`)로 navigate.
 * - 행 내 활성/비활성 토글 버튼 클릭은 stopPropagation으로 행 내비게이션을 트리거하지 않는다.
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeItem(meetingRoomId: number, name: string, isAvailable = true) {
  return { meetingRoomId, name, capacity: 8, isAvailable }
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

function mockRoomManagementDefault(items: unknown[] = [makeItem(1, '대회의실')]) {
  server.use(
    http.get(`${BASE_URL}/api/meeting-rooms/management`, () => HttpResponse.json(makePage(items))),
  )
}

function DetailPlaceholder() {
  const { meetingRoomId } = useParams()
  return <div>회의실 관리 상세 화면 meetingRoomId={meetingRoomId}</div>
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/meeting-rooms/management']}>
        <Routes>
          <Route path="/meeting-rooms/management" element={<MeetingRoomManagementPage />} />
          <Route path="/meeting-rooms/management/:meetingRoomId" element={<DetailPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MeetingRoomManagementPage (F811) - 로딩/에러/빈 상태', () => {
  it('빈 목록이면 "조회 조건에 해당하는 회의실이 없습니다."가 렌더된다', async () => {
    mockRoomManagementDefault([])

    renderPage()

    expect(
      await screen.findByText('조회 조건에 해당하는 회의실이 없습니다.'),
    ).toBeInTheDocument()
  })

  it('조회 실패 시 에러 문구와 토스트가 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/management`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPage()

    expect(await screen.findByText('회의실 목록을 불러오지 못했습니다.')).toBeInTheDocument()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})

describe('MeetingRoomManagementPage (F811) - 행 클릭 내비게이션', () => {
  it('행 클릭 시 /meeting-rooms/management/:meetingRoomId 상세 페이지로 이동한다', async () => {
    mockRoomManagementDefault([makeItem(7, '소회의실')])

    const user = userEvent.setup()
    renderPage()

    const row = await screen.findByRole('button', { name: /소회의실/ })
    await user.click(row)

    expect(await screen.findByText('회의실 관리 상세 화면 meetingRoomId=7')).toBeInTheDocument()
  })

  it('행 내 활성/비활성 토글 버튼 클릭은 stopPropagation으로 행 내비게이션을 트리거하지 않는다', async () => {
    mockRoomManagementDefault([makeItem(7, '소회의실', true)])

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('소회의실')
    await user.click(screen.getByRole('button', { name: '비활성화' }))

    // AlertDialog 확인창은 떠야 하지만, 상세 페이지로는 이동하지 않아야 한다.
    expect(await screen.findByText('회의실을 비활성화하시겠습니까?')).toBeInTheDocument()
    expect(screen.queryByText('회의실 관리 상세 화면 meetingRoomId=7')).not.toBeInTheDocument()
  })
})

describe('MeetingRoomManagementPage (F811) - 필터 2종(tri-state, 즉시 반영)', () => {
  it('활성상태/향후예약 필터를 선택하면 즉시 반영되고 page가 0으로 리셋된다', async () => {
    const requests: Array<{
      available: string | null
      bookedInFuture: string | null
      page: string | null
    }> = []

    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/management`, ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') === '1' ? 1 : 0
        requests.push({
          available: url.searchParams.get('available'),
          bookedInFuture: url.searchParams.get('bookedInFuture'),
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json({
          ...makePage([makeItem(1, '대회의실')], page),
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('대회의실')
    expect(requests[0].available).toBeNull()
    expect(requests[0].bookedInFuture).toBeNull()
    expect(requests[0].page).toBe('0')

    // page를 1로 이동한 뒤 활성상태 필터를 바꾸면 즉시 반영 + page 0 리셋.
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.page === '1')).toBe(true))

    await user.selectOptions(screen.getByLabelText('활성상태 필터'), '비활성')
    await waitFor(() =>
      expect(
        requests.some((r) => r.available === 'false' && (r.page === null || r.page === '0')),
      ).toBe(true),
    )

    // 향후예약 필터도 동일하게 즉시 반영 + page 0 리셋.
    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() =>
      expect(requests.some((r) => r.available === 'false' && r.page === '1')).toBe(true),
    )

    await user.selectOptions(screen.getByLabelText('향후예약 필터'), '향후예약 있음')
    await waitFor(() =>
      expect(
        requests.some(
          (r) =>
            r.available === 'false' &&
            r.bookedInFuture === 'true' &&
            (r.page === null || r.page === '0'),
        ),
      ).toBe(true),
    )
  })
})
