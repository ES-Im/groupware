import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { franchiseKeys } from '../model/queryKeys'
import { useFranchiseEducationUpdateMutation } from './useFranchiseEducationUpdateMutation'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

function detail(id: number, title: string) {
  return {
    id,
    date: '2026-05-01',
    startAt: '10:00:00',
    place: '본사 3층 강당',
    title,
    content: '가맹 운영 기본 교육입니다',
    appliedCount: 0,
    capacity: 20,
    remainingCapacity: 20,
    isActive: true,
    fileListInfoList: null,
  }
}

describe('useFranchiseEducationUpdateMutation', () => {
  it('수정 성공(204) 시 해당 교육 상세와 캘린더 접두사가 invalidate되어 재조회되고, 다른 교육 상세는 재조회되지 않는다', async () => {
    let title1 = '수정 전 제목'
    let calendarCalls = 0
    let detail2Calls = 0
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/1`, () => HttpResponse.json(detail(1, title1))),
      http.get(`${BASE_URL}/api/franchise-educations/2`, () => {
        detail2Calls += 1
        return HttpResponse.json(detail(2, '다른 교육'))
      }),
      http.get(`${BASE_URL}/api/franchise-educations/calendar`, () => {
        calendarCalls += 1
        return HttpResponse.json([])
      }),
      http.patch(`${BASE_URL}/api/franchise-educations/1`, () => {
        title1 = '수정된 제목'
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
        detail2: useQuery({
          queryKey: franchiseKeys.education.detail(2),
          queryFn: async () => (await fetch(`${BASE_URL}/api/franchise-educations/2`)).json(),
        }),
        calendar: useQuery({
          queryKey: franchiseKeys.education.calendar(),
          queryFn: async () => (await fetch(`${BASE_URL}/api/franchise-educations/calendar`)).json(),
        }),
        mutation: useFranchiseEducationUpdateMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail1.data?.title).toBe('수정 전 제목'))
    await waitFor(() => expect(result.current.detail2.data?.id).toBe(2))
    await waitFor(() => expect(result.current.calendar.data).toBeDefined())
    expect(detail2Calls).toBe(1)
    expect(calendarCalls).toBe(1)

    result.current.mutation.mutate({ educationId: 1, payload: { title: '수정된 제목' } })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.detail1.data?.title).toBe('수정된 제목'))
    await waitFor(() => expect(calendarCalls).toBe(2))
    expect(detail2Calls).toBe(1)
  })

  it('서버 판정 실패는 삼켜지지 않고 mutation error로 반영된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/franchise-educations/1`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '변경된 값이 없습니다' },
          { status: 400 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useFranchiseEducationUpdateMutation(), { wrapper: Wrapper })

    result.current.mutate({ educationId: 1, payload: {} })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
