import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { normalizeApiError, isForbidden } from '@/shared/lib/apiError'
import { server } from '@/test/mocks/server'
import { attendanceKeys } from '../model/queryKeys'
import { useDeptAttendanceMonthlyQuery } from './useDeptAttendanceMonthlyQuery'

/**
 * useDeptAttendanceMonthlyQuery(F305, ROADMAP T3.3) 실동작 검증.
 *
 * - deptId===undefined면 enabled:false로 대기해 요청 자체가 나가지 않는지
 *   (useDepartmentMembersQuery.test.tsx와 동일 패턴).
 * - deptId가 확정된 number일 때 attendanceKeys.deptMonthly(deptId, params)로 캐시되는지.
 * - 403(ROLE_003) 응답이 이 레이어에서 삼켜지지 않고 그대로 throw되어 result.current.error에
 *   반영되고, normalizeApiError로 정규화 시 isForbidden===true가 되는지(handleApiError는
 *   UI 레이어 몫이라 여기서는 정규화 가능 여부만 확인, 재구현 금지).
 */

function makeRow(empId: number, empName: string) {
  return {
    empInfo: {
      empId,
      empNo: `20260${empId}`,
      empName,
      deptName: 'IT',
      positionName: 'STAFF',
    },
    summary: {
      approvedAttendanceCount: 1,
      pendingAttendanceCount: 1,
      totalAttendanceCount: 2,
      overtimeMinutes: 0,
    },
    attendanceInfo: [
      {
        attendanceId: 100,
        attendanceStatus: 'NORMAL',
        attendanceDate: '2026-04-01',
        startAt: '09:00:00',
        endAt: '18:00:00',
        isApproved: true,
        draftId: null,
      },
    ],
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

describe('useDeptAttendanceMonthlyQuery', () => {
  it('deptId가 undefined면 조회하지 않는다(enabled:false)', () => {
    const { result } = renderHook(() => useDeptAttendanceMonthlyQuery(undefined), {
      wrapper: createWrapper().Wrapper,
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('deptId가 확정된 number이면 조회되고 attendanceKeys.deptMonthly(deptId, params)로 캐시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/1/monthly`, () =>
        HttpResponse.json(makePage([makeRow(2, '홍길동')], 0)),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const params = { yearMonth: '2026-07', page: 0, size: 10 }
    const { result } = renderHook(() => useDeptAttendanceMonthlyQuery(1, params), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.content[0].empInfo.empName).toBe('홍길동')

    const cached = queryClient.getQueryData(attendanceKeys.deptMonthly(1, params))
    expect(cached).toEqual(result.current.data)
  })

  it('403(ROLE_003) 응답이 그대로 throw되어 error에 반영되고 normalizeApiError로 isForbidden 판정된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/attendances/1/monthly`, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 403, message: '권한이 없습니다' },
          { status: 403 },
        ),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useDeptAttendanceMonthlyQuery(1), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const normalized = normalizeApiError(result.current.error)
    expect(isForbidden(normalized)).toBe(true)
    expect(normalized.code).toBe('ROLE_003')
  })
})
