import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { normalizeApiError, isNotFound } from '@/shared/lib/apiError'
import { server } from '@/test/mocks/server'
import { useNewEmployeesQuery } from './useNewEmployeesQuery'
import { useUpdateEmpBelongingsMutation } from './useUpdateEmpBelongingsMutation'

/**
 * useUpdateEmpBelongingsMutation(HR_UPDATE_EMP_BELONGINGS) 실동작 검증.
 *
 * - 성공(204) 시 employeeKeys.newEmployees() 접두 무효화(exact:false)로, keyword가 서로 다른
 *   newEmployees 캐시 엔트리 두 개가 동시에 재조회되는지 확인한다
 *   (empManagementMutations.invalidate.test.tsx의 exact:false 검증과 동일 패턴).
 * - 실패(ROLE_001, 404 — 소속 배정 대상이 ACTIVE가 아님) 시 isError로 반영되고, invalidate가
 *   일어나지 않아 목록 재조회 카운트가 늘지 않는지 확인한다.
 */

function makePage(items: unknown[]) {
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return Wrapper
}

describe('useUpdateEmpBelongingsMutation', () => {
  it('성공(204) 시 newEmployees 접두 무효화로, keyword가 다른 캐시 엔트리 두 개가 모두 재조회된다', async () => {
    let noKeywordFetchCount = 0
    let keywordFetchCount = 0
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, ({ request }) => {
        const keyword = new URL(request.url).searchParams.get('keyword')
        if (keyword === '김철수') {
          keywordFetchCount += 1
        } else {
          noKeywordFetchCount += 1
        }
        return HttpResponse.json(makePage([]))
      }),
      http.patch(`${BASE_URL}/api/employees/7/belongings`, () => new HttpResponse(null, { status: 204 })),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(
      () => ({
        listAll: useNewEmployeesQuery(),
        listByKeyword: useNewEmployeesQuery({ keyword: '김철수' }),
        mutation: useUpdateEmpBelongingsMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.listAll.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.listByKeyword.isSuccess).toBe(true))
    expect(noKeywordFetchCount).toBe(1)
    expect(keywordFetchCount).toBe(1)

    result.current.mutation.mutate({
      empId: 7,
      payload: { deptId: 2, position: 'STAFF', isPrimary: true, startAt: '2026-01-01', endAt: null },
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(noKeywordFetchCount).toBe(2))
    await waitFor(() => expect(keywordFetchCount).toBe(2))
  })

  it('실패(ROLE_001, 404 — 대상이 ACTIVE 아님) 시 isError로 반영되고 목록은 재조회되지 않는다', async () => {
    let fetchCount = 0
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, () => {
        fetchCount += 1
        return HttpResponse.json(makePage([]))
      }),
      http.patch(`${BASE_URL}/api/employees/7/belongings`, () =>
        HttpResponse.json(
          { code: 'ROLE_001', name: 'ACTIVE_EMPLOYEE_NOT_FOUND_EXCEPTION', httpStatus: 404, message: '해당 활성화된 사원이 존재하지 않습니다' },
          { status: 404 },
        ),
      ),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(
      () => ({
        list: useNewEmployeesQuery(),
        mutation: useUpdateEmpBelongingsMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    expect(fetchCount).toBe(1)

    result.current.mutation.mutate({
      empId: 7,
      payload: { deptId: 2, position: 'STAFF', isPrimary: true, startAt: '2026-01-01', endAt: null },
    })

    await waitFor(() => expect(result.current.mutation.isError).toBe(true))

    const normalized = normalizeApiError(result.current.mutation.error)
    expect(normalized.code).toBe('ROLE_001')
    expect(isNotFound(normalized)).toBe(true)
    expect(fetchCount).toBe(1)
  })
})
