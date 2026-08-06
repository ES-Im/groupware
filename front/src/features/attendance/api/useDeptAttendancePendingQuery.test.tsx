import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { normalizeApiError, isForbidden } from '@/shared/lib/apiError'
import { server } from '@/test/mocks/server'
import { attendanceKeys } from '../model/queryKeys'
import { useDeptAttendancePendingQuery } from './useDeptAttendancePendingQuery'

function makeRow(empId: number, empName: string) {
  return {
    empInfo: {
      empId,
      empNo: `20260${empId}`,
      empName,
      deptName: 'IT',
      positionName: 'STAFF',
    },
    attendanceInfo: {
      attendanceId: 102,
      attendanceStatus: 'LATE_EARLY',
      attendanceDate: '2026-04-02',
      startAt: '10:00:00',
      endAt: '15:00:00',
      isApproved: false,
      draftId: null,
    },
  }
}

function makePage(items: unknown[], page: number) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: page,
    size: 10,
    first: page === 0,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    },
  }
}

describe('useDeptAttendancePendingQuery', () => {
  it('deptId가 undefined면 조회하지 않는다(enabled:false)', () => {
    const { result } = renderHook(() => useDeptAttendancePendingQuery(undefined), {
      wrapper: createWrapper().Wrapper,
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('deptId가 확정된 number이면 조회되고 attendanceKeys.deptPending(deptId, params)로 캐시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/1/monthly/pending`, () =>
        HttpResponse.json(makePage([makeRow(2, '홍길동')], 0)),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const params = { page: 0, size: 10 }
    const { result } = renderHook(() => useDeptAttendancePendingQuery(1, params), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.content[0].empInfo.empName).toBe('홍길동')
    expect(result.current.data?.content[0].attendanceInfo.attendanceStatus).toBe('LATE_EARLY')

    const cached = queryClient.getQueryData(attendanceKeys.deptPending(1, params))
    expect(cached).toEqual(result.current.data)
  })

  it('403(ROLE_003) 응답이 그대로 throw되어 error에 반영되고 normalizeApiError로 isForbidden 판정된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/1/monthly/pending`, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 403, message: '권한이 없습니다' },
          { status: 403 },
        ),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDeptAttendancePendingQuery(1), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const normalized = normalizeApiError(result.current.error)
    expect(isForbidden(normalized)).toBe(true)
    expect(normalized.code).toBe('ROLE_003')
  })
})
