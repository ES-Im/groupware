import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { meetingKeys } from '../model/meetingKeys'
import { useUpdateMeetingReservationMutation } from './useUpdateMeetingReservationMutation'

/**
 * useUpdateMeetingReservationMutation(F804, ROADMAP T4.2) 실동작 검증.
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

describe('useUpdateMeetingReservationMutation', () => {
  it('성공 시 PATCH를 호출하고 meetingKeys.all을 invalidate한다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/meetings/10/reservation-info`, () => new HttpResponse(null, { status: 204 })),
    )

    const { invalidateSpy, Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateMeetingReservationMutation(), { wrapper: Wrapper })

    result.current.mutate({ meetingId: 10, payload: { title: '변경된 제목' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: meetingKeys.all })
  })
})
