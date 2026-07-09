import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { attendanceKeys } from '../model/queryKeys'
import { useCheckOutMutation } from './useCheckOutMutation'

/**
 * useCheckOutMutation(F302·MY_ATTENDANCE_CHECK_OUT, ROADMAP T2.2) 동작 검증.
 *
 * - 성공(204) 시 attendanceKeys.all이 invalidate되어 하위 쿼리(myMonthly)가 재조회되는지
 *   (departmentMutations.invalidate.test.tsx와 동일하게 실제 refetch를 관찰해 블랙박스 검증).
 * - 성공 시 toast.success('퇴근이 기록되었습니다')가 호출되는지.
 * - 실패 시 toast.success는 호출되지 않고, handleApiError 경로를 통해 toast.error가 호출되는지
 *   (LoginForm.test.tsx의 sonner 모킹 패턴).
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

describe('useCheckOutMutation', () => {
  beforeEach(async () => {
    const { toast } = await import('sonner')
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it('성공(204) 시 attendanceKeys.all이 invalidate되어 하위 쿼리가 재조회되고, 성공 토스트가 노출된다', async () => {
    let callCount = 0
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/me/monthly`, () => {
        callCount += 1
        return HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 1,
          number: 0,
          size: 10,
          first: true,
          last: true,
          numberOfElements: 0,
          empty: true,
        })
      }),
      http.patch(`${BASE_URL}/api/employees/attendances/me/check-out`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => ({
        list: useQuery({
          queryKey: attendanceKeys.myMonthly(),
          queryFn: async () =>
            (await fetch(`${BASE_URL}/api/employees/attendances/me/monthly`)).json(),
        }),
        mutation: useCheckOutMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    expect(callCount).toBe(1)

    result.current.mutation.mutate()

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(callCount).toBe(2))

    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('퇴근이 기록되었습니다')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('실패 시 toast.success는 호출되지 않고, handleApiError를 통해 toast.error가 호출된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/employees/attendances/me/check-out`, () =>
        HttpResponse.json(
          {
            code: 'ATTENDANCE_NOT_CHECKED_IN',
            name: 'ATTENDANCE_NOT_CHECKED_IN',
            httpStatus: 400,
            message: '출근 기록이 없어 퇴근할 수 없습니다',
          },
          { status: 400 },
        ),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCheckOutMutation(), { wrapper: Wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isError).toBe(true))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('출근 기록이 없어 퇴근할 수 없습니다'))
    expect(toast.success).not.toHaveBeenCalled()
  })
})
