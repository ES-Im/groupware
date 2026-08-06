import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { meetingKeys } from '../model/meetingKeys'
import { useMeetingReservationDetailQuery } from './useMeetingReservationDetailQuery'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}

describe('useMeetingReservationDetailQuery', () => {
  it('meetingId가 undefined면 조회하지 않는다(enabled:false)', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useMeetingReservationDetailQuery(undefined), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('meetingId 확정 시 meetingKeys.reservationDetail(id)로 캐시된다', async () => {
    const detail = {
      meetingId: 10,
      meetingRoomId: 3,
      meetingRoomName: '대회의실',
      reserverId: 7,
      reserverDeptName: '개발팀',
      reserverEmpName: '홍길동',
      title: '주간 회의',
      meetingDate: '2026-07-10',
      startAt: '10:00:00',
      endAt: '11:00:00',
      isCanceled: false,
      participantCount: 1,
      participants: [{ empId: 101, deptName: '개발팀', empName: '김철수' }],
    }
    server.use(http.get(`${BASE_URL}/api/meetings/10`, () => HttpResponse.json(detail)))

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => useMeetingReservationDetailQuery(10), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.title).toBe('주간 회의')

    const cached = queryClient.getQueryData(meetingKeys.reservationDetail(10))
    expect(cached).toEqual(detail)
  })
})
