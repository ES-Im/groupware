import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useEmpForManagementQuery } from './useEmpForManagementQuery'
import { useEmployeeQuery } from './useEmployeeQuery'
import { useUpdateDeptManagedInfoMutation } from './useUpdateDeptManagedInfoMutation'
import { useUpdateHrManagedInfoMutation } from './useUpdateHrManagedInfoMutation'

function makeEmpDetail(name: string) {
  return {
    empBasicInfo: {
      empId: 7,
      empNo: '202607007',
      name,
      loginId: 'hong01',
      email: 'hong@haruon.com',
      extensionNo: '101-0001',
    },
    activeFiles: [] as unknown[],
    currentDepts: [] as unknown[],
  }
}

function makeManagementRecord(status: string) {
  return {
    empId: 7,
    empNo: '202607007',
    empName: '홍길동',
    loginId: 'hong01',
    email: 'hong@haruon.com',
    extensionNo: '101-0001',
    status,
    hireAt: '2024-01-01',
    resignAt: null,
    belongings: [],
    systemRoleCodeName: ['EMPLOYEE'],
  }
}

function makeManagementPage(status: string) {
  return {
    content: [makeManagementRecord(status)],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 100,
    numberOfElements: 1,
    first: true,
    last: true,
    empty: false,
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

describe('useUpdateHrManagedInfoMutation', () => {
  it('성공(204) 시 detail·empsForManagement가 모두 invalidate되어 재조회된다', async () => {
    let empDetail = makeEmpDetail('홍길동')
    let managementPage = makeManagementPage('ACTIVE')
    server.use(
      http.get(`${BASE_URL}/api/employees/7`, () => HttpResponse.json(empDetail)),
      http.get(`${BASE_URL}/api/employees`, () => HttpResponse.json(managementPage)),
      http.patch(`${BASE_URL}/api/employees/7/hr-managed-info`, () => {
        empDetail = makeEmpDetail('홍길동(수정)')
        managementPage = makeManagementPage('SUSPENDED')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(
      () => ({
        detail: useEmployeeQuery(7),
        management: useEmpForManagementQuery(1, 7, true),
        mutation: useUpdateHrManagedInfoMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail.data?.empBasicInfo.name).toBe('홍길동'))
    await waitFor(() => expect(result.current.management.data?.status).toBe('ACTIVE'))

    result.current.mutation.mutate({
      empId: 7,
      values: {
        empName: '홍길동(수정)',
        password: 'abc12345!',
        extensionNo: '101-0001',
        systemRoleCode: ['EMPLOYEE'],
        hireAt: '2024-01-01',
      },
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.detail.data?.empBasicInfo.name).toBe('홍길동(수정)'))
    await waitFor(() => expect(result.current.management.data?.status).toBe('SUSPENDED'))
  })
})

describe('useUpdateDeptManagedInfoMutation', () => {
  it('성공(204) 시 detail·empsForManagement가 모두 invalidate되어 재조회된다', async () => {
    let managementPage = makeManagementPage('ACTIVE')
    server.use(
      http.get(`${BASE_URL}/api/employees/7`, () => HttpResponse.json(makeEmpDetail('홍길동'))),
      http.get(`${BASE_URL}/api/employees`, () => HttpResponse.json(managementPage)),
      http.patch(`${BASE_URL}/api/employees/7/dept-managed-info`, () => {
        managementPage = makeManagementPage('SUSPENDED')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(
      () => ({
        management: useEmpForManagementQuery(1, 7, true),
        mutation: useUpdateDeptManagedInfoMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.management.data?.status).toBe('ACTIVE'))

    result.current.mutation.mutate({
      empId: 7,
      values: { extensionNo: '101-0001', systemRoleCode: ['EMPLOYEE'] },
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.management.data?.status).toBe('SUSPENDED'))
  })

  it('empsForManagement invalidate는 접두 키(exact:false)라 deptId가 다른 캐시 엔트리도 함께 재조회된다', async () => {
    let dept1Page = makeManagementPage('ACTIVE')
    let dept2FetchCount = 0
    server.use(
      http.get(`${BASE_URL}/api/employees/7`, () => HttpResponse.json(makeEmpDetail('홍길동'))),
      http.get(`${BASE_URL}/api/employees`, ({ request }) => {
        const deptId = new URL(request.url).searchParams.get('deptId')
        if (deptId === '2') {
          dept2FetchCount += 1
          return HttpResponse.json(makeManagementPage('ACTIVE'))
        }
        return HttpResponse.json(dept1Page)
      }),
      http.patch(`${BASE_URL}/api/employees/7/dept-managed-info`, () => {
        dept1Page = makeManagementPage('SUSPENDED')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(
      () => ({
        dept1: useEmpForManagementQuery(1, 7, true),
        dept2: useEmpForManagementQuery(2, 999, true),
        mutation: useUpdateDeptManagedInfoMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.dept1.data?.status).toBe('ACTIVE'))
    await waitFor(() => expect(dept2FetchCount).toBe(1))

    result.current.mutation.mutate({
      empId: 7,
      values: { extensionNo: '101-0001', systemRoleCode: ['EMPLOYEE'] },
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.dept1.data?.status).toBe('SUSPENDED'))
    await waitFor(() => expect(dept2FetchCount).toBe(2))
  })
})
