import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { scheduleKeys } from '../model/scheduleKeys'
import { useCancelScheduleMutation } from './useCancelScheduleMutation'

/**
 * useCancelScheduleMutation(F007, ROADMAP(SCHEDULE) T6.1) 실동작 검증.
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
    //todo : 이 단언은 invalidateQueries가 '해당 키로 호출됐는지'(인자 형태)만 검증할 뿐, 실제로 캘린더 쿼리가 무효화되는 '효과'는 검증하지 못한다. 그래서 위 partialMatchKey 미스매치(캘린더 미무효화) 버그가 있어도 테스트는 green으로 통과 → 거짓 안심. 실제 무효화 검증이 필요하면 캘린더 쿼리를 캐시에 심고 isInvalidated/refetch 발생을 확인하는 방식으로 보강 필요
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: scheduleKeys.calendar() })
  })
})
