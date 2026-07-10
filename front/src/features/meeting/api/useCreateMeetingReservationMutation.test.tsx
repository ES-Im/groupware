import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { meetingKeys } from '../model/meetingKeys'
import { useCreateMeetingReservationMutation } from './useCreateMeetingReservationMutation'

/**
 * useCreateMeetingReservationMutation(F803, ROADMAP T3.2) 실동작 검증.
 * 성공 시 meetingKeys.all(전체)을 invalidate하는지 확인한다 — 생성된 예약이 내 예약 캘린더/
 * 회의실 예약 캘린더/예약 관리 목록 중 어디에 반영될지 개별적으로 알 수 없기 때문이다.
 */
function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  return {
    invalidateSpy,
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}

describe('useCreateMeetingReservationMutation', () => {
  it('성공 시 POST /api/meetings를 호출하고 meetingKeys.all을 invalidate한다', async () => {
    server.use(http.post(`${BASE_URL}/api/meetings`, () => new HttpResponse(null, { status: 201 })))

    const { invalidateSpy, Wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateMeetingReservationMutation(), { wrapper: Wrapper })

    result.current.mutate({
      meetingRoomId: 3,
      reserverId: 7,
      title: '주간 회의',
      meetingDate: '2026-07-10',
      startAt: '10:00',
      endAt: '11:00',
      participantIds: [101],
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: meetingKeys.all })
  })
})
