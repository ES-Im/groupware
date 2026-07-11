import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { franchiseKeys } from '../model/queryKeys'
import { useFranchiseInquiryAnswerSendMutation } from './useFranchiseInquiryAnswerSendMutation'

/**
 * useFranchiseInquiryAnswerSendMutation(FRANCHISE_INQUIRY_ANSWER_SEND, ROADMAP(FRANCHISE) T5.4,
 * F1623) 성공 후 invalidate 검증. useFranchiseInquiryAnswerCreateMutation.test.tsx와 동형 구조이되,
 * mutate 변수가 객체가 아닌 inquiryId(number) 단일값이다(구현 시그니처 그대로).
 *
 * 핵심 계약:
 * - 성공(204) 시 franchiseKeys.inquiry.answer(inquiryId)·detail(inquiryId)·
 *   [...all,'inquiry','list'] 접두사가 함께 invalidate된다(isSubmitted 전환이 목록의 isAnswered
 *   표시에도 영향을 준다).
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

function answer(isSubmitted: boolean) {
  return {
    answerId: 1,
    content: '환불 처리 완료했습니다.',
    isSubmitted,
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

describe('useFranchiseInquiryAnswerSendMutation', () => {
  it('발송 성공(204) 시 답변·상세·목록 접두사가 invalidate되어 재조회되고, 다른 문의 상세는 재조회되지 않는다', async () => {
    let isSubmitted = false
    let answerCalls = 0
    let detailCalls = 0
    let detail2Calls = 0
    let listCalls = 0
    server.use(
      http.get(`${BASE_URL}/api/franchise-inquiries/1/answer`, () => {
        answerCalls += 1
        return HttpResponse.json(answer(isSubmitted))
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
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/answers/send`, () => {
        isSubmitted = true
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
        mutation: useFranchiseInquiryAnswerSendMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.answer.data?.isSubmitted).toBe(false))
    await waitFor(() => expect(result.current.detail2.data?.inquiryId).toBe(2))
    await waitFor(() => expect(result.current.list.data).toBeDefined())
    expect(answerCalls).toBe(1)
    expect(detailCalls).toBe(1)
    expect(detail2Calls).toBe(1)
    expect(listCalls).toBe(1)

    result.current.mutation.mutate(1)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.answer.data?.isSubmitted).toBe(true))
    await waitFor(() => expect(detailCalls).toBe(2))
    await waitFor(() => expect(listCalls).toBe(2))
    // detail(2)는 invalidate 대상이 아니므로 재조회되지 않는다.
    expect(detail2Calls).toBe(1)
  })

  it('서버 판정 실패(이미 발송된 답변 재발송 시도 등)는 삼켜지지 않고 mutation error로 반영된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/franchise-inquiries/1/answers/send`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '이미 발송된 답변입니다',
          },
          { status: 400 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useFranchiseInquiryAnswerSendMutation(), {
      wrapper: Wrapper,
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
