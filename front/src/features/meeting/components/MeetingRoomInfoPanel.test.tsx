import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingRoomInfoPanel } from './MeetingRoomInfoPanel'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderPanel(meetingRoomId = 3) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MeetingRoomInfoPanel meetingRoomId={meetingRoomId} />
    </QueryClientProvider>,
  )
}

describe('MeetingRoomInfoPanel - 정상 렌더', () => {
  it('회의실 이름/설명/수용 인원/활성 배지를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3`, () =>
        HttpResponse.json({ meetingRoomId: 3, name: '대회의실', description: '층별 최대 회의실', capacity: 10, isAvailable: true }),
      ),
    )

    renderPanel()

    expect(await screen.findByText('대회의실')).toBeInTheDocument()
    expect(screen.getByText('층별 최대 회의실')).toBeInTheDocument()
    expect(screen.getByText('수용 인원 10명')).toBeInTheDocument()
    expect(screen.getByText('사용 가능')).toBeInTheDocument()
  })

  it('isAvailable=false면 "비활성" 배지를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3`, () =>
        HttpResponse.json({ meetingRoomId: 3, name: '대회의실', description: '설명', capacity: 10, isAvailable: false }),
      ),
    )

    renderPanel()

    expect(await screen.findByText('비활성')).toBeInTheDocument()
  })
})

describe('MeetingRoomInfoPanel - not-found', () => {
  it('404 응답 시 전용 문구를 노출하고 토스트는 띄우지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/999`, () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '회의실을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )

    renderPanel(999)

    expect(await screen.findByText('회의실을 찾을 수 없습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })
})

describe('MeetingRoomInfoPanel - 그 외 에러', () => {
  it('500 응답 시 에러 문구와 토스트를 함께 노출한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPanel()

    expect(await screen.findByText('회의실 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다')
  })
})
