import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingReservationDetailPanel } from './MeetingReservationDetailPanel'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

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

function makeDetail(overrides: Record<string, unknown> = {}) {
  return {
    meetingId: 10,
    meetingRoomId: 3,
    meetingRoomName: '대회의실',
    reserverId: 7,
    reserverDeptName: '개발팀',
    reserverEmpName: '홍길동',
    title: '주간 회의',
    meetingDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    startAt: '10:00:00',
    endAt: '11:00:00',
    isCanceled: false,
    participantCount: 1,
    participants: [{ empId: 101, deptName: '개발팀', empName: '김철수' }],
    ...overrides,
  }
}

function renderPanel(meetingId: number | undefined) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MeetingReservationDetailPanel meetingId={meetingId} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MeetingReservationDetailPanel', () => {
  it('meetingId가 없으면 안내 플레이스홀더를 렌더한다', () => {
    renderPanel(undefined)
    expect(screen.getByText('위 목록에서 예약을 선택하면 상세가 표시됩니다.')).toBeInTheDocument()
  })

  it('예약자 본인 + 미래 예약이면 회의정보 수정/예약 취소/참가자 교체 액션이 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/10`, () => HttpResponse.json(makeDetail({ reserverId: 7 }))),
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(7))),
    )

    renderPanel(10)

    expect(await screen.findByRole('button', { name: '회의 정보 수정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '예약 취소' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '참가자 교체' })).toBeInTheDocument()
  })

  it('예약자 본인이 아니면(FACILITY 조회 전용) 관리 액션이 노출되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings/10`, () => HttpResponse.json(makeDetail({ reserverId: 7 }))),
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(999))),
    )

    renderPanel(10)

    expect(await screen.findByText('개발팀 · 홍길동')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '회의 정보 수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '참가자 교체' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '예약 취소' })).not.toBeInTheDocument()
  })
})
