import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingRoomDetailPage } from './MeetingRoomDetailPage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderDetail(meetingRoomId: string | number = 3) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/meeting-rooms/${meetingRoomId}`]}>
        <Routes>
          <Route path="/meeting-rooms/:meetingRoomId" element={<MeetingRoomDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MeetingRoomDetailPage - 정상 렌더', () => {
  it('3개 블록을 모두 조립해 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/3`, () =>
        HttpResponse.json({ meetingRoomId: 3, name: '대회의실', description: '설명', capacity: 10, isAvailable: true }),
      ),
      http.get(`${BASE_URL}/api/meeting-rooms/3/files`, () => HttpResponse.json([])),
      http.get(`${BASE_URL}/api/meeting-rooms/3/reservations/calendar`, () => HttpResponse.json([])),
    )

    renderDetail(3)

    expect(await screen.findByText('대회의실')).toBeInTheDocument()
    expect(screen.getByText('등록된 안내 이미지가 없습니다.')).toBeInTheDocument()
    expect(document.querySelector('.fc')).toBeInTheDocument()
  })
})

describe('MeetingRoomDetailPage - 라우트 파라미터 가드', () => {
  it('meetingRoomId가 순수 10진 양의 정수가 아니면(예: 음수/16진수 표기) 조회를 시도하지 않고 즉시 not-found를 렌더한다', () => {
    renderDetail('-1')

    expect(screen.getByText('회의실을 찾을 수 없습니다.')).toBeInTheDocument()
  })

  it('meetingRoomId가 0이면 유효하지 않은 것으로 처리해 not-found를 렌더한다', () => {
    renderDetail('0')

    expect(screen.getByText('회의실을 찾을 수 없습니다.')).toBeInTheDocument()
  })
})
