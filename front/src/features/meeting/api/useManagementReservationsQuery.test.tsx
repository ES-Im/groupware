import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { normalizeApiError, isForbidden } from '@/shared/lib/apiError'
import { server } from '@/test/mocks/server'
import { meetingKeys } from '../model/meetingKeys'
import { useManagementReservationsQuery } from './useManagementReservationsQuery'

function makeItem(meetingId: number, title: string) {
  return {
    meetingId,
    meetingRoomId: 1,
    meetingRoomName: '대회의실',
    reserverId: 2,
    reserverDeptName: '기획팀',
    reserverEmpName: '홍길동',
    title,
    meetingDate: '2026-07-10',
    startAt: '10:00',
    endAt: '11:00',
    isCanceled: false,
    participantCount: 3,
  }
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

describe('useManagementReservationsQuery', () => {
  it('파라미터 없이도 즉시 조회되고 meetingKeys.managementReservations(undefined)로 캐시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings`, () => HttpResponse.json(makePage([makeItem(1, '주간 회의')]))),
    )

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => useManagementReservationsQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.content[0].title).toBe('주간 회의')

    const cached = queryClient.getQueryData(meetingKeys.managementReservations(undefined))
    expect(cached).toEqual(result.current.data)
  })

  it('params가 확정되면 meetingKeys.managementReservations(params)로 캐시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings`, () => HttpResponse.json(makePage([makeItem(2, '기획 회의')]))),
    )

    const { queryClient, Wrapper } = createWrapper()
    const params = { yearMonth: '2026-07', page: 0, size: 10 }
    const { result } = renderHook(() => useManagementReservationsQuery(params), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    const cached = queryClient.getQueryData(meetingKeys.managementReservations(params))
    expect(cached).toEqual(result.current.data)
  })

  it('403(ROLE_003) 응답이 그대로 throw되어 error에 반영되고 normalizeApiError로 isForbidden 판정된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/meetings`, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 403, message: '권한이 없습니다' },
          { status: 403 },
        ),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useManagementReservationsQuery(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const normalized = normalizeApiError(result.current.error)
    expect(isForbidden(normalized)).toBe(true)
    expect(normalized.code).toBe('ROLE_003')
  })
})
