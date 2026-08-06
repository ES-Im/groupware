import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { attendanceKeys } from '../model/queryKeys'
import { useUpdateAttendanceMutation } from './useUpdateAttendanceMutation'

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

const attendanceId = 42
const validPayload = {
  targetEmpId: 7,
  startAt: '09:00:00',
  endAt: '',
  editReason: '지각 정정',
  editedAt: '2026-07-08T10:00:00',
}

describe('useUpdateAttendanceMutation', () => {
  beforeEach(async () => {
    const { toast } = await import('sonner')
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it('성공(204) 시 [...attendanceKeys.all, "dept"] 접두 쿼리가 invalidate되어 재조회되고, 성공 토스트가 노출된다', async () => {
    let callCount = 0
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/1/monthly`, () => {
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
      http.patch(`${BASE_URL}/api/employees/attendances/${attendanceId}`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => ({
        list: useQuery({
          queryKey: attendanceKeys.deptMonthly(1),
          queryFn: async () =>
            (await fetch(`${BASE_URL}/api/employees/attendances/1/monthly`)).json(),
        }),
        mutation: useUpdateAttendanceMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    expect(callCount).toBe(1)

    result.current.mutation.mutate({ attendanceId, payload: validPayload })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(callCount).toBe(2))

    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('근태 정보를 수정했습니다')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('실패 시 toast.success는 호출되지 않고, handleApiError를 통해 toast.error가 호출된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/employees/attendances/${attendanceId}`, () =>
        HttpResponse.json(
          {
            code: 'ATTENDANCE_ALREADY_APPROVED',
            name: 'ATTENDANCE_ALREADY_APPROVED',
            httpStatus: 400,
            message: '이미 승인된 근태는 수정할 수 없습니다',
          },
          { status: 400 },
        ),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateAttendanceMutation(), { wrapper: Wrapper })

    result.current.mutate({ attendanceId, payload: validPayload })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('이미 승인된 근태는 수정할 수 없습니다'),
    )
    expect(toast.success).not.toHaveBeenCalled()
  })
})
