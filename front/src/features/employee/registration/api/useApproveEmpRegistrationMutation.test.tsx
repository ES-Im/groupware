import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { normalizeApiError, isNotFound } from '@/shared/lib/apiError'
import { server } from '@/test/mocks/server'
import { useNewEmployeesQuery } from './useNewEmployeesQuery'
import { useApproveEmpRegistrationMutation } from './useApproveEmpRegistrationMutation'

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

describe('useApproveEmpRegistrationMutation', () => {
  it('성공(204) 시 hiredAt 쿼리 파라미터가 그대로 전달되고, newEmployees 목록은 invalidate되지 않는다', async () => {
    let listFetchCount = 0
    let capturedHiredAt: string | null = null
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, () => {
        listFetchCount += 1
        return HttpResponse.json(makePage([]))
      }),
      http.patch(`${BASE_URL}/api/employees/2/registration-approval`, ({ request }) => {
        capturedHiredAt = new URL(request.url).searchParams.get('hiredAt')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(
      () => ({
        list: useNewEmployeesQuery(),
        mutation: useApproveEmpRegistrationMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    expect(listFetchCount).toBe(1)

    result.current.mutation.mutate({ empId: 2, hiredAt: '2026-01-01' })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    expect(capturedHiredAt).toBe('2026-01-01')
    expect(listFetchCount).toBe(1)
  })

  it('실패(EMP_001, 404 — 대상 사원 미존재) 시 isError로 반영되고 isNotFound로 판정된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/employees/999/registration-approval`, () =>
        HttpResponse.json(
          { code: 'EMP_001', name: 'EMPLOYEE_NOT_FOUND_EXCEPTION', httpStatus: 404, message: '해당 사원이 존재하지 않습니다' },
          { status: 404 },
        ),
      ),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(() => useApproveEmpRegistrationMutation(), { wrapper: Wrapper })

    result.current.mutate({ empId: 999, hiredAt: '2026-01-01' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const normalized = normalizeApiError(result.current.error)
    expect(normalized.code).toBe('EMP_001')
    expect(isNotFound(normalized)).toBe(true)
  })
})
