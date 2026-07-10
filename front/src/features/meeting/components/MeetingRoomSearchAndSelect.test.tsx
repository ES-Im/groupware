import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingRoomSearchAndSelect } from './MeetingRoomSearchAndSelect'

/**
 * MeetingRoomSearchAndSelect(F802, ROADMAP T3.3-a) 회귀 방지 테스트.
 * 검증 대상:
 * - 검색 전 안내 문구, 검색 제출 시 확정 파라미터로 조회.
 * - 카드 선택 시 onRoomSelected(room, confirmedParams) 호출.
 * - 재검색(재제출) 시 이전 선택 해제 신호(onRoomSelected(undefined)) 전달 — stale 회의실 제출 방지.
 * - endAt <= startAt 클라 가드(토스트, API 미호출).
 * - showRoomDetailLink=false면 "상세 보기" 버튼이 렌더되지 않는다.
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

function renderComponent(props: Partial<Parameters<typeof MeetingRoomSearchAndSelect>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MeetingRoomSearchAndSelect {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function search(
  user: ReturnType<typeof userEvent.setup>,
  { date = '2026-07-10', startAt = '10:00', endAt = '11:00', capacity = '4' } = {},
) {
  // 네이티브 date/time input은 userEvent.type의 세그먼트 입력과 궁합이 좋지 않아, 이 저장소의
  // 다른 테스트(attendance UpdateAttendanceDialog.test.tsx setTimeValue)와 동일하게
  // fireEvent.change로 값을 직접 채운다.
  fireEvent.change(screen.getByLabelText('날짜'), { target: { value: date } })
  fireEvent.change(screen.getByLabelText('시작 시각'), { target: { value: startAt } })
  fireEvent.change(screen.getByLabelText('종료 시각'), { target: { value: endAt } })
  fireEvent.change(screen.getByLabelText('최소 수용인원'), { target: { value: capacity } })
  await user.click(screen.getByRole('button', { name: '회의실 검색' }))
}

describe('MeetingRoomSearchAndSelect - 검색 전/후', () => {
  it('검색 전에는 안내 문구만 노출하고 조회하지 않는다', () => {
    renderComponent()

    expect(screen.getByText('검색 조건을 입력하고 검색해 주세요.')).toBeInTheDocument()
  })

  it('검색 제출 시 확정 파라미터로 조회해 카드 목록을 렌더한다', async () => {
    let requestedParams: Record<string, string | null> = {}
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, ({ request }) => {
        const url = new URL(request.url)
        requestedParams = Object.fromEntries(url.searchParams.entries())
        return HttpResponse.json(pageOf([{ meetingRoomId: 3, name: '대회의실', capacity: 10, isAvailable: true }]))
      }),
    )
    const user = userEvent.setup()
    renderComponent()

    await search(user)

    expect(await screen.findByText('대회의실')).toBeInTheDocument()
    expect(requestedParams).toEqual({
      date: '2026-07-10',
      startAt: '10:00',
      endAt: '11:00',
      capacity: '4',
      page: '0',
      size: '10',
    })
  })

  it('endAt이 startAt 이하면 토스트만 띄우고 조회하지 않는다', async () => {
    let requested = false
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, () => {
        requested = true
        return HttpResponse.json(pageOf([]))
      }),
    )
    const user = userEvent.setup()
    renderComponent()

    await search(user, { startAt: '11:00', endAt: '10:00' })

    const { toast } = await import('sonner')
    expect(toast.error).toHaveBeenCalledWith('종료 시각은 시작 시각보다 이후여야 합니다')
    expect(requested).toBe(false)
  })
})

describe('MeetingRoomSearchAndSelect - 카드 선택', () => {
  it('카드 클릭 시 onRoomSelected(room, confirmedParams)가 호출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, () =>
        HttpResponse.json(pageOf([{ meetingRoomId: 3, name: '대회의실', capacity: 10, isAvailable: true }])),
      ),
    )
    const onRoomSelected = vi.fn()
    const user = userEvent.setup()
    renderComponent({ onRoomSelected })

    await search(user)
    await user.click(await screen.findByRole('button', { name: '대회의실' }))

    expect(onRoomSelected).toHaveBeenCalledWith(
      { meetingRoomId: 3, name: '대회의실', capacity: 10, isAvailable: true },
      { date: '2026-07-10', startAt: '10:00', endAt: '11:00' },
    )
  })

  it('재검색(재제출) 시 이전 선택 해제 신호(onRoomSelected(undefined))를 먼저 전달한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, () =>
        HttpResponse.json(pageOf([{ meetingRoomId: 3, name: '대회의실', capacity: 10, isAvailable: true }])),
      ),
    )
    const onRoomSelected = vi.fn()
    const user = userEvent.setup()
    renderComponent({ onRoomSelected })

    await search(user)
    await user.click(await screen.findByRole('button', { name: '대회의실' }))
    expect(onRoomSelected).toHaveBeenLastCalledWith(expect.anything(), expect.anything())

    onRoomSelected.mockClear()
    await search(user, { date: '2026-07-11' })

    expect(onRoomSelected).toHaveBeenCalledWith(undefined)
  })
})

describe('MeetingRoomSearchAndSelect - showRoomDetailLink', () => {
  it('기본값(true)이면 "상세 보기" 버튼이 렌더된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, () =>
        HttpResponse.json(pageOf([{ meetingRoomId: 3, name: '대회의실', capacity: 10, isAvailable: true }])),
      ),
    )
    const user = userEvent.setup()
    renderComponent()

    await search(user)

    expect(await screen.findByRole('button', { name: '상세 보기' })).toBeInTheDocument()
  })

  it('showRoomDetailLink=false면 "상세 보기" 버튼이 렌더되지 않는다(다이얼로그 임베드 컨텍스트)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, () =>
        HttpResponse.json(pageOf([{ meetingRoomId: 3, name: '대회의실', capacity: 10, isAvailable: true }])),
      ),
    )
    const user = userEvent.setup()
    renderComponent({ showRoomDetailLink: false })

    await search(user)

    await waitFor(() => expect(screen.getByText('대회의실')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: '상세 보기' })).not.toBeInTheDocument()
  })
})

describe('MeetingRoomSearchAndSelect - 빈 결과/에러', () => {
  it('조건에 맞는 회의실이 없으면 안내 문구를 노출한다', async () => {
    server.use(http.get(`${BASE_URL}/api/meeting-rooms/available`, () => HttpResponse.json(pageOf([]))))
    const user = userEvent.setup()
    renderComponent()

    await search(user)

    expect(await screen.findByText('조건에 맞는 회의실이 없습니다.')).toBeInTheDocument()
  })

  it('조회 실패 시 에러 문구와 토스트를 노출한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderComponent()

    await search(user)

    expect(await screen.findByText('회의실 목록을 불러오지 못했습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다'))
  })
})
