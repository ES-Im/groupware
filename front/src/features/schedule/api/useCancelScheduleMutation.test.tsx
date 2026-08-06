import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { scheduleKeys } from '../model/scheduleKeys'
import { useCancelScheduleMutation } from './useCancelScheduleMutation'

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

describe('useCancelScheduleMutation', () => {
  it('성공 시 PATCH를 호출하고 scheduleKeys.detail/calendar를 invalidate한다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/schedules/10/cancellation`, () => new HttpResponse(null, { status: 204 })),
    )

    const { invalidateSpy, Wrapper } = createWrapper()
    const { result } = renderHook(() => useCancelScheduleMutation(), { wrapper: Wrapper })

    result.current.mutate({ scheduleId: 10, scope: 'SERIES' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: scheduleKeys.detail(10) })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: scheduleKeys.calendar() })
  })
})
