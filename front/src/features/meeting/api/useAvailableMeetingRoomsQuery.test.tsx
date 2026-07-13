import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useAvailableMeetingRoomsQuery } from './useAvailableMeetingRoomsQuery'

/**
 * useAvailableMeetingRoomsQuery(F802, ROADMAP T3.1) 실동작 검증.
 *
 * date/startAt/endAt/capacity는 모두 선택값이라(입력한 조건만 필터로 적용) 검색 실행 여부는
 * options.enabled로 외부에서 주입한다. enabled:false(기본)면 조회하지 않고, enabled:true면
 * 값이 있는 파라미터만 쿼리스트링에 담아 조회한다.
 */
function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}

const EMPTY_PAGE = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 10,
  numberOfElements: 0,
  first: true,
  last: true,
  empty: true,
}

describe('useAvailableMeetingRoomsQuery', () => {
  it('options.enabled가 false(기본)면 조회하지 않는다', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () => useAvailableMeetingRoomsQuery({ date: '2026-07-10', startAt: '10:00', endAt: '11:00', capacity: 4 }),
      { wrapper: Wrapper },
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('enabled:true면 입력한 파라미터만 쿼리스트링에 담아 조회한다(미입력 항목은 생략)', async () => {
    let requestedParams: Record<string, string | null> = {}
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, ({ request }) => {
        const url = new URL(request.url)
        requestedParams = {
          date: url.searchParams.get('date'),
          startAt: url.searchParams.get('startAt'),
          endAt: url.searchParams.get('endAt'),
          capacity: url.searchParams.get('capacity'),
        }
        return HttpResponse.json(EMPTY_PAGE)
      }),
    )

    const { Wrapper } = createWrapper()
    // 최소 수용 인원만 입력한 검색 — date/startAt/endAt은 쿼리스트링에서 빠져야 한다.
    renderHook(() => useAvailableMeetingRoomsQuery({ capacity: 6 }, { enabled: true }), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(requestedParams.capacity).toBe('6'))
    expect(requestedParams.date).toBeNull()
    expect(requestedParams.startAt).toBeNull()
    expect(requestedParams.endAt).toBeNull()
  })

  it('capacity가 0이어도(falsy값이지만 유효) 전송한다', async () => {
    let capacityRequested: string | null = null
    server.use(
      http.get(`${BASE_URL}/api/meeting-rooms/available`, ({ request }) => {
        capacityRequested = new URL(request.url).searchParams.get('capacity')
        return HttpResponse.json(EMPTY_PAGE)
      }),
    )

    const { Wrapper } = createWrapper()
    renderHook(
      () =>
        useAvailableMeetingRoomsQuery(
          { date: '2026-07-10', startAt: '10:00', endAt: '11:00', capacity: 0 },
          { enabled: true },
        ),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(capacityRequested).toBe('0'))
  })

  it('enabled:true면 조회하고 응답을 그대로 노출한다', async () => {
    const page = {
      ...EMPTY_PAGE,
      content: [{ meetingRoomId: 3, name: '대회의실', capacity: 10, isAvailable: true }],
      totalElements: 1,
      empty: false,
    }
    server.use(http.get(`${BASE_URL}/api/meeting-rooms/available`, () => HttpResponse.json(page)))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useAvailableMeetingRoomsQuery(
          { date: '2026-07-10', startAt: '10:00', endAt: '11:00', capacity: 4 },
          { enabled: true },
        ),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.content).toHaveLength(1)
  })
})
