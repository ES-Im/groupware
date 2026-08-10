import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { franchiseKeys } from '../model/queryKeys'
import { useFranchiseCreateMutation } from './useFranchiseCreateMutation'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, queryClient }
}

function makeFranchise(id: number, name: string) {
  return {
    id,
    name,
    address: '서울특별시 강남구 테헤란로 1',
    ownerName: '홍길동',
    BusinessStatus: '정상 영업 중',
    managerEmpId: 7,
    managerEmpName: '김담당',
  }
}

function pageOf(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: items.length,
    first: true,
    last: true,
    empty: items.length === 0,
  }
}

const createPayload = {
  businessNumber: '123-45-67890',
  franchiseName: '신규점',
  address: '서울특별시 서초구 서초대로 2',
  ownerName: '이대표',
  contactNumber: '02-9876-5432',
  contactEmail: 'new@haruon.com',
}

describe('useFranchiseCreateMutation', () => {
  it('등록 성공(201) 시 params가 채워진 목록 쿼리가 invalidate되어 재조회되고, detail 쿼리는 재조회되지 않는다', async () => {
    let franchises = [makeFranchise(1, '기존점')]
    let detailCalls = 0
    server.use(
      http.get(`${BASE_URL}/api/franchises`, () => HttpResponse.json(pageOf(franchises))),
      http.get(`${BASE_URL}/api/franchises/1`, () => {
        detailCalls += 1
        return HttpResponse.json({
          id: 1,
          name: '기존점',
          address: '서울특별시 강남구 테헤란로 1',
          ownerName: '홍길동',
          businessNumber: '111-11-11111',
          contactNumber: '02-1111-1111',
          contactEmail: 'old@haruon.com',
          BusinessStatus: '정상 영업 중',
          memo: '',
          managerEmpId: 7,
          managerEmpName: '김담당',
        })
      }),
      http.post(`${BASE_URL}/api/franchises`, () => {
        franchises = [...franchises, makeFranchise(2, '신규점')]
        return HttpResponse.json({ id: 2 }, { status: 201 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        list: useQuery({
          queryKey: franchiseKeys.list({ page: 0, size: 10 }),
          queryFn: async () => (await fetch(`${BASE_URL}/api/franchises?page=0&size=10`)).json(),
        }),
        detail: useQuery({
          queryKey: franchiseKeys.detail(1),
          queryFn: async () => (await fetch(`${BASE_URL}/api/franchises/1`)).json(),
        }),
        mutation: useFranchiseCreateMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.data?.content).toHaveLength(1))
    await waitFor(() => expect(result.current.detail.data?.id).toBe(1))
    expect(detailCalls).toBe(1)

    result.current.mutation.mutate(createPayload)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.data?.content).toHaveLength(2))
    expect(detailCalls).toBe(1)
  })

  it('서버 판정 실패(이메일 중복 등)는 삼켜지지 않고 mutation error로 반영된다', async () => {
    server.use(
      http.post(`${BASE_URL}/api/franchises`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '이미 등록된 이메일입니다',
          },
          { status: 400 },
        ),
      ),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useFranchiseCreateMutation(), { wrapper: Wrapper })

    result.current.mutate(createPayload)

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
