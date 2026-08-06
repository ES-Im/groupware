import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { normalizeApiError, isForbidden } from '@/shared/lib/apiError'
import { server } from '@/test/mocks/server'
import { meetingKeys } from '../model/meetingKeys'
import { useMeetingRoomManagementListQuery } from './useMeetingRoomManagementListQuery'

function makeItem(meetingRoomId: number, name: string) {
  return { meetingRoomId, name, capacity: 8, isAvailable: true }
}

function makePage(items: unknown[], page = 0) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: page,
    size: 10,
    first: page === 0,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
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

describe('useMeetingRoomManagementListQuery', () => {
  it('파라미터 없이도 즉시 조회되고 meetingKeys.roomManagement(undefined)로 캐시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/management`, () =>
        HttpResponse.json(makePage([makeItem(1, '대회의실')])),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => useMeetingRoomManagementListQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.content[0].name).toBe('대회의실')

    const cached = queryClient.getQueryData(meetingKeys.roomManagement(undefined))
    expect(cached).toEqual(result.current.data)
  })

  it('params가 확정되면 meetingKeys.roomManagement(params)로 캐시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/management`, () =>
        HttpResponse.json(makePage([makeItem(2, '소회의실')])),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const params = { available: true, page: 0, size: 10 }
    const { result } = renderHook(() => useMeetingRoomManagementListQuery(params), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    const cached = queryClient.getQueryData(meetingKeys.roomManagement(params))
    expect(cached).toEqual(result.current.data)
  })

  it('403(ROLE_003) 응답이 그대로 throw되어 error에 반영되고 normalizeApiError로 isForbidden 판정된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/management`, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 403, message: '권한이 없습니다' },
          { status: 403 },
        ),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMeetingRoomManagementListQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const normalized = normalizeApiError(result.current.error)
    expect(isForbidden(normalized)).toBe(true)
    expect(normalized.code).toBe('ROLE_003')
  })
})
