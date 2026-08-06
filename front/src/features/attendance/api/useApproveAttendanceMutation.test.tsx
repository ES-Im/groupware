import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { attendanceKeys } from '../model/queryKeys'
import { useApproveAttendanceMutation } from './useApproveAttendanceMutation'

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

const attendanceId = 10
const targetEmpId = 2

describe('useApproveAttendanceMutation', () => {
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
      http.patch(`${BASE_URL}/api/employees/attendances/${attendanceId}/approval`, () =>
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
        mutation: useApproveAttendanceMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    expect(callCount).toBe(1)

    result.current.mutation.mutate({ attendanceId, targetEmpId })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(callCount).toBe(2))

    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('근태를 승인했습니다')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('실패 시 toast.success는 호출되지 않고, handleApiError를 통해 toast.error가 호출된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/employees/attendances/${attendanceId}/approval`, () =>
        HttpResponse.json(
          {
            code: 'ATTENDANCE_ALREADY_APPROVED',
            name: 'ATTENDANCE_ALREADY_APPROVED',
            httpStatus: 400,
            message: '이미 승인된 근태입니다',
          },
          { status: 400 },
        ),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useApproveAttendanceMutation(), { wrapper: Wrapper })

    result.current.mutate({ attendanceId, targetEmpId })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('이미 승인된 근태입니다'))
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('mutate 호출 시 서버로 전달되는 approvedAt 쿼리 파라미터가 오프셋/Z/밀리초 없는 YYYY-MM-DDTHH:mm:ss 형식이다', async () => {
    let capturedApprovedAt: string | null = null
    let capturedTargetEmpId: string | null = null
    server.use(
      http.patch(
        `${BASE_URL}/api/employees/attendances/${attendanceId}/approval`,
        ({ request }) => {
          const url = new URL(request.url)
          capturedApprovedAt = url.searchParams.get('approvedAt')
          capturedTargetEmpId = url.searchParams.get('targetEmpId')
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useApproveAttendanceMutation(), { wrapper: Wrapper })

    result.current.mutate({ attendanceId, targetEmpId })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(capturedTargetEmpId).toBe(String(targetEmpId))
    expect(capturedApprovedAt).not.toBeNull()
    expect(capturedApprovedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    expect(capturedApprovedAt).not.toMatch(/Z$/)
    expect(capturedApprovedAt).not.toMatch(/\./)
  })
})
