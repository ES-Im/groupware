import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { MeetingReservationDetail } from '../model/meeting'
import { MeetingReservationUpdateDialog } from './MeetingReservationUpdateDialog'

/**
 * MeetingReservationUpdateDialog(F804, ROADMAP T4.3-b) 회귀 방지 테스트.
 * 핵심 불변식(팀리드 지시):
 * - 다이얼로그가 열릴 때만 detail을 스냅샷한다(라이브 쿼리 변경에 반응하지 않음).
 * - 회의실 변경 취소/재검색 해제 시 날짜/시간까지 함께 원래 값으로 되돌린다.
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

function makeDetail(overrides: Partial<MeetingReservationDetail> = {}): MeetingReservationDetail {
  return {
    meetingId: 10,
    meetingRoomId: 3,
    meetingRoomName: '대회의실',
    reserverId: 7,
    reserverDeptName: '개발팀',
    reserverEmpName: '홍길동',
    title: '주간 회의',
    meetingDate: '2026-07-15',
    startAt: '10:00',
    endAt: '11:00',
    isCanceled: false,
    participantCount: 1,
    participants: [],
    ...overrides,
  }
}

function renderDialog(detail: MeetingReservationDetail, { open = true, onOpenChange = vi.fn() } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MeetingReservationUpdateDialog open={open} onOpenChange={onOpenChange} detail={detail} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { ...utils, onOpenChange, queryClient }
}

/**
 * MeetingRoomSearchAndSelect(T3.3-a 재사용)의 "시작 시각"/"종료 시각" 라벨이 이 다이얼로그 자체의
 * 필드(회의실 변경 토글 전부터 항상 렌더)와 텍스트가 겹쳐 getByLabelText로는 모호하다 — 검색
 * 패널의 input id(meeting-search-*)는 고유하므로 id로 직접 조회한다.
 */
function getSearchInput(id: 'meeting-search-date' | 'meeting-search-start' | 'meeting-search-end' | 'meeting-search-capacity') {
  const el = document.getElementById(id)
  if (!el) throw new Error(`#${id} not found`)
  return el
}

async function searchAndSelectRoom(
  user: ReturnType<typeof userEvent.setup>,
  { date = '2026-07-20', startAt = '13:00', endAt = '14:00', roomName = '소회의실' } = {},
) {
  await user.click(screen.getByRole('button', { name: '회의실 변경' }))
  fireEvent.change(getSearchInput('meeting-search-date'), { target: { value: date } })
  fireEvent.change(getSearchInput('meeting-search-start'), { target: { value: startAt } })
  fireEvent.change(getSearchInput('meeting-search-end'), { target: { value: endAt } })
  fireEvent.change(getSearchInput('meeting-search-capacity'), { target: { value: '1' } })
  await user.click(screen.getByRole('button', { name: '회의실 검색' }))
  await user.click(await screen.findByRole('button', { name: roomName }))
}

describe('MeetingReservationUpdateDialog - 프리필/스냅샷', () => {
  it('열릴 때 현재 예약 값으로 프리필된다', () => {
    renderDialog(makeDetail())

    expect(screen.getByLabelText('회의 제목')).toHaveValue('주간 회의')
    expect(screen.getByLabelText('회의일')).toHaveValue('2026-07-15')
    expect(screen.getByLabelText('시작 시각')).toHaveValue('10:00')
    expect(screen.getByLabelText('종료 시각')).toHaveValue('11:00')
  })

  it('열린 상태를 유지한 채 detail이 바뀌어도(라이브 쿼리 변경) 폼 값은 갱신되지 않는다', () => {
    const { rerender, queryClient } = renderDialog(makeDetail())

    expect(screen.getByLabelText('회의 제목')).toHaveValue('주간 회의')

    // open은 true로 유지한 채 detail만 새 객체로 교체(예: 성공 후 meetingKeys.all invalidate로
    // 인한 리페치를 흉내) — open 전이가 없으므로 reset이 재실행되면 안 된다.
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MeetingReservationUpdateDialog
            open={true}
            onOpenChange={vi.fn()}
            detail={makeDetail({ title: '다른 제목으로 바뀐 최신 서버 상태' })}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByLabelText('회의 제목')).toHaveValue('주간 회의')
  })
})

describe('MeetingReservationUpdateDialog - 회의실 변경/되돌림', () => {
  it('회의실 검색으로 새 회의실을 선택하면 meetingDate/startAt/endAt이 확정 검색조건으로 동기화된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, () =>
        HttpResponse.json(pageOf([{ meetingRoomId: 5, name: '소회의실', capacity: 4, isAvailable: true }])),
      ),
    )
    const user = userEvent.setup()
    renderDialog(makeDetail())

    await searchAndSelectRoom(user)

    // 검색 패널(isChangingRoom=true)이 계속 열려 있어 "시작 시각"/"종료 시각" 라벨이 검색 패널과
    // 중복되므로, 다이얼로그 자체 필드는 고유 id로 조회한다.
    expect(screen.getByLabelText('회의일')).toHaveValue('2026-07-20')
    expect(document.getElementById('meeting-update-start')).toHaveValue('13:00')
    expect(document.getElementById('meeting-update-end')).toHaveValue('14:00')
    expect(screen.getByText(/소회의실\(으\)로 변경 예정/)).toBeInTheDocument()
  })

  it('"회의실 변경 취소"를 누르면 선택한 회의실뿐 아니라 날짜/시각도 원래 예약 값으로 되돌아간다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, () =>
        HttpResponse.json(pageOf([{ meetingRoomId: 5, name: '소회의실', capacity: 4, isAvailable: true }])),
      ),
    )
    const user = userEvent.setup()
    renderDialog(makeDetail())

    await searchAndSelectRoom(user)
    await user.click(screen.getByRole('button', { name: '회의실 변경 취소' }))

    expect(screen.getByLabelText('회의일')).toHaveValue('2026-07-15')
    expect(screen.getByLabelText('시작 시각')).toHaveValue('10:00')
    expect(screen.getByLabelText('종료 시각')).toHaveValue('11:00')
    expect(screen.queryByText(/변경 예정/)).not.toBeInTheDocument()
  })

  it('회의실을 선택한 뒤 재검색하면(선택 해제 신호) 날짜/시각도 원래 예약 값으로 되돌아간다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, () =>
        HttpResponse.json(pageOf([{ meetingRoomId: 5, name: '소회의실', capacity: 4, isAvailable: true }])),
      ),
    )
    const user = userEvent.setup()
    renderDialog(makeDetail())

    await searchAndSelectRoom(user)
    expect(screen.getByLabelText('회의일')).toHaveValue('2026-07-20')

    // 같은 검색 패널에서 다시 검색(재제출) — MeetingRoomSearchAndSelect가 onRoomSelected(undefined)를
    // 먼저 전달해 이전 선택을 해제한다.
    fireEvent.change(screen.getByLabelText('날짜'), { target: { value: '2026-07-25' } })
    await user.click(screen.getByRole('button', { name: '회의실 검색' }))

    // 검색 패널(isChangingRoom)이 재검색 이후에도 계속 열려 있어 "시작 시각"/"종료 시각" 라벨이
    // 검색 패널과 다이얼로그 자체 필드에 중복되므로, 다이얼로그 자체 필드는 고유 id로 조회한다.
    await waitFor(() => expect(document.getElementById('meeting-update-date')).toHaveValue('2026-07-15'))
    expect(document.getElementById('meeting-update-start')).toHaveValue('10:00')
    expect(document.getElementById('meeting-update-end')).toHaveValue('11:00')
  })
})

describe('MeetingReservationUpdateDialog - 저장', () => {
  it('변경된 필드만 담아 PATCH하고 성공 토스트 + 닫기', async () => {
    let requestedBody: Record<string, unknown> | undefined
    server.use(
      http.patch(`${BASE_URL}/api/meetings/10/reservation-info`, async ({ request }) => {
        requestedBody = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog(makeDetail())

    await user.clear(screen.getByLabelText('회의 제목'))
    await user.type(screen.getByLabelText('회의 제목'), '변경된 제목')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(requestedBody).toEqual({ title: '변경된 제목' }))
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('예약 정보를 수정했습니다'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
