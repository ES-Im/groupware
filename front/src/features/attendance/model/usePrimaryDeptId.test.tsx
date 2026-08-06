import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { employeeKeys } from '@/features/employee/model/queryKeys'
import { server } from '@/test/mocks/server'
import { usePrimaryDeptId } from './usePrimaryDeptId'

function makeMeFixture(currentDepts: unknown[]) {
  return {
    empBasicInfo: {
      empNo: '000000001',
      name: '홍길동',
      loginId: 'test1234',
      email: 'test1234@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts,
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

describe('usePrimaryDeptId', () => {
  it('isPrimary===true 항목이 있으면 그 deptId를 반환한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () =>
        HttpResponse.json(
          makeMeFixture([
            {
              deptId: 1,
              deptCode: '001',
              deptName: '본사',
              positionName: '팀원',
              isPrimary: false,
              startAt: '2024-01-01T00:00:00',
              endAt: null,
            },
            {
              deptId: 2,
              deptCode: '002',
              deptName: '영업부',
              positionName: '팀장',
              isPrimary: true,
              startAt: '2024-01-01T00:00:00',
              endAt: null,
            },
          ]),
        ),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePrimaryDeptId(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current).toBe(2))
  })

  it('isPrimary===true 항목이 없으면 다른 항목이 있어도 폴백 없이 undefined를 반환한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () =>
        HttpResponse.json(
          makeMeFixture([
            {
              deptId: 1,
              deptCode: '001',
              deptName: '본사',
              positionName: '팀원',
              isPrimary: false,
              startAt: '2024-01-01T00:00:00',
              endAt: null,
            },
          ]),
        ),
      ),
    )

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => usePrimaryDeptId(), { wrapper: Wrapper })

    await waitFor(() => expect(queryClient.getQueryData(employeeKeys.me())).toBeDefined())
    expect(result.current).toBeUndefined()
  })

  it('currentDepts가 빈 배열이면 undefined를 반환한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(makeMeFixture([]))),
    )

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => usePrimaryDeptId(), { wrapper: Wrapper })

    await waitFor(() => expect(queryClient.getQueryData(employeeKeys.me())).toBeDefined())
    expect(result.current).toBeUndefined()
  })

  it('useMeQuery가 아직 로딩 중이라 data가 undefined이면 undefined를 반환한다', () => {
    server.use(
      http.get(
        `${BASE_URL}/api/employees/me`,
        () => new Promise(() => {}),
      ),
    )

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => usePrimaryDeptId(), { wrapper: Wrapper })

    expect(result.current).toBeUndefined()
  })
})
