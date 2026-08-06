import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { franchiseKeys } from '../model/queryKeys'
import { useFranchiseEducationActivateMutation } from './useFranchiseEducationActivateMutation'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

function detail(id: number, isActive: boolean) {
  return {
    id,
    date: '2026-05-01',
    startAt: '10:00:00',
    place: '본사 3층 강당',
    title: '신규 가맹점 오리엔테이션',
    content: '가맹 운영 기본 교육입니다',
    appliedCount: 0,
    capacity: 20,
    remainingCapacity: 20,
    isActive,
    fileListInfoList: null,
  }
}

describe('useFranchiseEducationActivateMutation', () => {
  it('활성화는 POST로 요청되고, 성공(204) 시 상세와 캘린더 접두사가 invalidate되어 재조회된다', async () => {
    let isActive1 = false
    let calendarCalls = 0
    let activateCalls = 0
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/1`, () =>
        HttpResponse.json(detail(1, isActive1)),
      ),
      http.get(`${BASE_URL}/api/franchise-educations/calendar`, () => {
        calendarCalls += 1
        return HttpResponse.json([])
      }),
      http.post(`${BASE_URL}/api/franchise-educations/1/activation`, () => {
        activateCalls += 1
        isActive1 = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail1: useQuery({
          queryKey: franchiseKeys.education.detail(1),
          queryFn: async () => (await fetch(`${BASE_URL}/api/franchise-educations/1`)).json(),
        }),
        calendar: useQuery({
          queryKey: franchiseKeys.education.calendar(),
          queryFn: async () => (await fetch(`${BASE_URL}/api/franchise-educations/calendar`)).json(),
        }),
        mutation: useFranchiseEducationActivateMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail1.data?.isActive).toBe(false))
    await waitFor(() => expect(result.current.calendar.data).toBeDefined())
    expect(calendarCalls).toBe(1)

    result.current.mutation.mutate(1)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    expect(activateCalls).toBe(1)
    await waitFor(() => expect(result.current.detail1.data?.isActive).toBe(true))
    await waitFor(() => expect(calendarCalls).toBe(2))
  })

  it('서버 판정 실패는 삼켜지지 않고 mutation error로 반영된다', async () => {
    server.use(
      http.post(`${BASE_URL}/api/franchise-educations/1/activation`, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 403, message: '권한이 없습니다' },
          { status: 403 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useFranchiseEducationActivateMutation(), { wrapper: Wrapper })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
