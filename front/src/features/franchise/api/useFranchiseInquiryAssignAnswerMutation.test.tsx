import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { franchiseKeys } from '../model/queryKeys'
import { useFranchiseInquiryAssignAnswerMutation } from './useFranchiseInquiryAssignAnswerMutation'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

function detail(inquiryId: number, assignedManagerName: string) {
  return {
    inquiryId,
    externalId: `EXT-${inquiryId}`,
    franchiseId: 10,
    franchiseName: '테스트강남점',
    inquirerContact: '010-1234-5678',
    inquiryAt: '2026-07-01T10:30:00',
    inquiryTitle: '환불 문의',
    inquiryContent: '환불 요청드립니다.',
    assignedManagerId: 7,
    assignedManagerName,
    isDeleted: false,
  }
}

describe('useFranchiseInquiryAssignAnswerMutation', () => {
  it('배정 성공(204) 시 해당 문의 상세와 목록 접두사가 invalidate되어 재조회되고, 다른 문의 상세는 재조회되지 않는다', async () => {
    let managerName1 = '김담당'
    let listCalls = 0
    let detail2Calls = 0
    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries/1`, () =>
        HttpResponse.json(detail(1, managerName1)),
      ),
      http.get(`${BASE_URL}/api/franchise-inquiries/2`, () => {
        detail2Calls += 1
        return HttpResponse.json(detail(2, '다른 담당'))
      }),
      http.get(`${BASE_URL}/api/franchise-inquiries`, () => {
        listCalls += 1
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
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/assign-answer`, () => {
        managerName1 = '박담당'
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail1: useQuery({
          queryKey: franchiseKeys.inquiry.detail(1),
          queryFn: async () =>
            (await fetch(`${BASE_URL}/api/franchise-inquiries/1`)).json(),
        }),
        detail2: useQuery({
          queryKey: franchiseKeys.inquiry.detail(2),
          queryFn: async () =>
            (await fetch(`${BASE_URL}/api/franchise-inquiries/2`)).json(),
        }),
        list: useQuery({
          queryKey: franchiseKeys.inquiry.list(),
          queryFn: async () => (await fetch(`${BASE_URL}/api/franchise-inquiries`)).json(),
        }),
        mutation: useFranchiseInquiryAssignAnswerMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail1.data?.assignedManagerName).toBe('김담당'))
    await waitFor(() => expect(result.current.detail2.data?.inquiryId).toBe(2))
    await waitFor(() => expect(result.current.list.data).toBeDefined())
    expect(detail2Calls).toBe(1)
    expect(listCalls).toBe(1)

    result.current.mutation.mutate({ inquiryId: 1, assignedEmpId: 9 })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() =>
      expect(result.current.detail1.data?.assignedManagerName).toBe('박담당'),
    )
    await waitFor(() => expect(listCalls).toBe(2))
    expect(detail2Calls).toBe(1)
  })

  it('서버 판정 실패(도메인 위반 등)는 삼켜지지 않고 mutation error로 반영된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/assign-answer`, () =>
        HttpResponse.json(
          {
            code: 'FRANCHISE_INQUIRY_003',
            name: 'CONFLICT',
            httpStatus: 409,
            message: '이미 답변이 제출된 문의는 담당자를 변경할 수 없습니다',
          },
          { status: 409 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useFranchiseInquiryAssignAnswerMutation(), {
      wrapper: Wrapper,
    })

    result.current.mutate({ inquiryId: 1, assignedEmpId: 9 })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
