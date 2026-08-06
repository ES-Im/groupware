import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { leaveKeys } from '../model/leaveKeys'
import { useMyLeaveHistoryQuery } from './useMyLeaveHistoryQuery'

function makeEntry(draftId: number, leaveType: string) {
  return {
    draftId,
    leaveType,
    startAt: '2026-04-10',
    endAt: '2026-04-10',
    requestedLeaveDays: 1.0,
    approvalStatus: '결재대기',
  }
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}

describe('useMyLeaveHistoryQuery', () => {
  it('leaveKeys.myHistory(params)로 캐시되고, 배열 응답이 그대로 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/leaves/employees/me/request-history`, () =>
        HttpResponse.json([makeEntry(10, '연차')]),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const params = { yearMonth: '2026-04' }
    const { result } = renderHook(() => useMyLeaveHistoryQuery(params), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].leaveType).toBe('연차')

    const cached = queryClient.getQueryData(leaveKeys.myHistory(params))
    expect(cached).toEqual(result.current.data)
  })

  it('approvalStatus 변경 시 keepPreviousData로 이전 목록을 유지해 isLoading이 다시 true가 되지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/leaves/employees/me/request-history`, ({ request }) => {
        const url = new URL(request.url)
        const approvalStatus = url.searchParams.get('approvalStatus')
        if (approvalStatus === 'APPROVED') {
          return HttpResponse.json([makeEntry(2, '반차')])
        }
        return HttpResponse.json([makeEntry(1, '연차')])
      }),
    )

    const { Wrapper } = createWrapper()
    const { result, rerender } = renderHook(
      ({ approvalStatus }: { approvalStatus?: 'WAITING' | 'APPROVED' }) =>
        useMyLeaveHistoryQuery({ approvalStatus }),
      { wrapper: Wrapper, initialProps: { approvalStatus: undefined } },
    )

    await waitFor(() => expect(result.current.data?.[0].leaveType).toBe('연차'))
    expect(result.current.isLoading).toBe(false)

    rerender({ approvalStatus: 'APPROVED' })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.[0].leaveType).toBe('연차')

    await waitFor(() => expect(result.current.data?.[0].leaveType).toBe('반차'))
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('파라미터가 없어도 정상 처리한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/leaves/employees/me/request-history`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.toString()).toBe('')
        return HttpResponse.json([])
      }),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMyLeaveHistoryQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual([])
  })
})
