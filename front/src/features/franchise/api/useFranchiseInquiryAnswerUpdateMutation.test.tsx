import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { franchiseKeys } from '../model/queryKeys'
import { useFranchiseInquiryAnswerUpdateMutation } from './useFranchiseInquiryAnswerUpdateMutation'

/**
 * useFranchiseInquiryAnswerUpdateMutation(FRANCHISE_INQUIRY_ANSWER_UPDATE, ROADMAP(FRANCHISE) T5.4,
 * F1622) 성공 후 invalidate 검증. useFranchiseInquiryAnswerCreateMutation.test.tsx와 동형 구조.
 *
 * 핵심 계약:
 * - 성공(204) 시 franchiseKeys.inquiry.answer(inquiryId)·detail(inquiryId)·
 *   [...all,'inquiry','list'] 접두사가 함께 invalidate된다.
 * - 다른 문의(id가 다른 detail)는 재조회되지 않는다.
 */

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

function answer(content: string) {
  return {
    answerId: 1,
    content,
    isSubmitted: false,
    answeredAt: '2026-07-02T09:00:00',
    answeredEmpId: 7,
    answeredEmpName: '김담당',
  }
}

function detail(inquiryId: number) {
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
    assignedManagerName: '김담당',
    isDeleted: false,
  }
}

describe('useFranchiseInquiryAnswerUpdateMutation', () => {
  it('수정 성공(204) 시 답변·상세·목록 접두사가 invalidate되어 재조회되고, 다른 문의 상세는 재조회되지 않는다', async () => {
    let answerContent = '수정 전 초안'
    let answerCalls = 0
    let detailCalls = 0
    let detail2Calls = 0
    let listCalls = 0
    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries/1/answer`, () => {
        answerCalls += 1
        return HttpResponse.json(answer(answerContent))
      }),
      http.get(`${BASE_URL}/api/franchise-inquiries/1`, () => {
        detailCalls += 1
        return HttpResponse.json(detail(1))
      }),
      http.get(`${BASE_URL}/api/franchise-inquiries/2`, () => {
        detail2Calls += 1
        return HttpResponse.json(detail(2))
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
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/answers`, () => {
        answerContent = '수정된 초안'
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        answer: useQuery({
          queryKey: franchiseKeys.inquiry.answer(1),
          queryFn: async () => (await fetch(`${BASE_URL}/api/franchise-inquiries/1/answer`)).json(),
        }),
        detail1: useQuery({
          queryKey: franchiseKeys.inquiry.detail(1),
          queryFn: async () => (await fetch(`${BASE_URL}/api/franchise-inquiries/1`)).json(),
        }),
        detail2: useQuery({
          queryKey: franchiseKeys.inquiry.detail(2),
          queryFn: async () => (await fetch(`${BASE_URL}/api/franchise-inquiries/2`)).json(),
        }),
        list: useQuery({
          queryKey: franchiseKeys.inquiry.list(),
          queryFn: async () => (await fetch(`${BASE_URL}/api/franchise-inquiries`)).json(),
        }),
        mutation: useFranchiseInquiryAnswerUpdateMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.answer.data?.content).toBe('수정 전 초안'))
    await waitFor(() => expect(result.current.detail2.data?.inquiryId).toBe(2))
    await waitFor(() => expect(result.current.list.data).toBeDefined())
    expect(answerCalls).toBe(1)
    expect(detailCalls).toBe(1)
    expect(detail2Calls).toBe(1)
    expect(listCalls).toBe(1)

    result.current.mutation.mutate({ inquiryId: 1, answer: '수정된 초안' })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.answer.data?.content).toBe('수정된 초안'))
    await waitFor(() => expect(detailCalls).toBe(2))
    await waitFor(() => expect(listCalls).toBe(2))
    // detail(2)는 invalidate 대상이 아니므로 재조회되지 않는다.
    expect(detail2Calls).toBe(1)
  })

  it('서버 판정 실패(이미 제출된 답변 수정 시도 등)는 삼켜지지 않고 mutation error로 반영된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/answers`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '이미 제출된 답변은 수정할 수 없습니다',
          },
          { status: 400 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useFranchiseInquiryAnswerUpdateMutation(), {
      wrapper: Wrapper,
    })

    result.current.mutate({ inquiryId: 1, answer: '수정 시도' })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
