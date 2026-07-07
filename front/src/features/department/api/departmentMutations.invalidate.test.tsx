import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { departmentKeys } from '../model/queryKeys'
import { useActivateDepartmentMutation } from './useActivateDepartmentMutation'
import { useAppointDepartmentLeaderMutation } from './useAppointDepartmentLeaderMutation'
import { useDeactivateDepartmentMutation } from './useDeactivateDepartmentMutation'
import { useEndDepartmentLeaderMutation } from './useEndDepartmentLeaderMutation'
import { useUpdateDepartmentNameMutation } from './useUpdateDepartmentNameMutation'
import { useUpdateDepartmentParentMutation } from './useUpdateDepartmentParentMutation'

/**
 * 부서 관리 mutation 훅 6종(F205~F209, ROADMAP T9.1-a/T9.1-b)의 성공(204) 후 invalidate 동작 검증.
 *
 * 실제 invalidateQueries 호출 여부를 mock으로 가로채지 않고, "prefetch된 detail 쿼리가 mutation
 * 성공 후 실제로 재조회되어 최신 값을 반영하는지"를 관찰 가능한 동작으로 확인한다(react-query의
 * invalidate 계약을 블랙박스로 검증).
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

function deptDetailFixture(isActive: boolean, deptName = '본사') {
  return {
    deptInfoResponse: { deptId: 1, deptCode: '001', deptName, isActive, parentDeptId: null },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

describe('부서 관리 mutation 성공 시 invalidate (F205~F209)', () => {
  it('활성화(F205) 성공 시 departmentKeys.detail(deptId)가 invalidate되어 재조회된다', async () => {
    let isActive = false
    server.use(
      http.get(`${BASE_URL}/api/departments/1`, () => HttpResponse.json(deptDetailFixture(isActive))),
      http.patch(`${BASE_URL}/api/departments/1/activation`, () => {
        isActive = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail: useQuery({
          queryKey: departmentKeys.detail(1),
          queryFn: async () => (await fetch(`${BASE_URL}/api/departments/1`)).json(),
        }),
        mutation: useActivateDepartmentMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail.data?.deptInfoResponse.isActive).toBe(false))

    result.current.mutation.mutate(1)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.detail.data?.deptInfoResponse.isActive).toBe(true))
  })

  it('비활성화(F205) 성공 시 departmentKeys.detail(deptId)가 invalidate되어 재조회된다', async () => {
    let isActive = true
    server.use(
      http.get(`${BASE_URL}/api/departments/1`, () => HttpResponse.json(deptDetailFixture(isActive))),
      http.patch(`${BASE_URL}/api/departments/1/deactivation`, () => {
        isActive = false
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail: useQuery({
          queryKey: departmentKeys.detail(1),
          queryFn: async () => (await fetch(`${BASE_URL}/api/departments/1`)).json(),
        }),
        mutation: useDeactivateDepartmentMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail.data?.deptInfoResponse.isActive).toBe(true))

    result.current.mutation.mutate(1)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.detail.data?.deptInfoResponse.isActive).toBe(false))
  })

  it('부서명 변경(F206) 성공 시 departmentKeys.detail(deptId)가 invalidate되어 재조회된다', async () => {
    let deptName = '본사'
    server.use(
      http.get(`${BASE_URL}/api/departments/1`, () => HttpResponse.json(deptDetailFixture(true, deptName))),
      http.patch(`${BASE_URL}/api/departments/1/name`, ({ request }) => {
        const url = new URL(request.url)
        deptName = url.searchParams.get('newName') ?? deptName
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail: useQuery({
          queryKey: departmentKeys.detail(1),
          queryFn: async () => (await fetch(`${BASE_URL}/api/departments/1`)).json(),
        }),
        mutation: useUpdateDepartmentNameMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail.data?.deptInfoResponse.deptName).toBe('본사'))

    result.current.mutation.mutate({ deptId: 1, newName: '개발본부' })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() =>
      expect(result.current.detail.data?.deptInfoResponse.deptName).toBe('개발본부'),
    )
  })

  it('부서장 지정(F208) 성공 시 departmentKeys.detail(deptId)가 invalidate되어 재조회된다', async () => {
    let hasLeader = false
    server.use(
      http.get(`${BASE_URL}/api/departments/1`, () =>
        HttpResponse.json({
          deptInfoResponse: { deptId: 1, deptCode: '001', deptName: '본사', isActive: true, parentDeptId: null },
          deptLeader: hasLeader
            ? { empId: 10, empNo: 'E010', empName: '김리더', extensionNo: null, email: 'leader@haruon.com', position: '팀장' }
            : { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
        }),
      ),
      http.patch(`${BASE_URL}/api/departments/1/leader/appointment`, () => {
        hasLeader = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail: useQuery({
          queryKey: departmentKeys.detail(1),
          queryFn: async () => (await fetch(`${BASE_URL}/api/departments/1`)).json(),
        }),
        mutation: useAppointDepartmentLeaderMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail.data?.deptLeader.empId).toBeNull())

    result.current.mutation.mutate({ deptId: 1, leaderEmpId: 10, appointedAt: '2026-07-07' })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.detail.data?.deptLeader.empId).toBe(10))
  })

  it('상위 부서 변경(F207) 성공 시 departmentKeys.all이 invalidate되어 상세가 재조회된다', async () => {
    let parentDeptId: number | null = null
    const patchSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/departments/1`, () =>
        HttpResponse.json(deptDetailFixtureWithParent(parentDeptId)),
      ),
      http.patch(`${BASE_URL}/api/departments/1/parent`, ({ request }) => {
        const url = new URL(request.url)
        patchSpy(url.searchParams.get('parentDeptId'))
        parentDeptId = 5
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail: useQuery({
          queryKey: departmentKeys.detail(1),
          queryFn: async () => (await fetch(`${BASE_URL}/api/departments/1`)).json(),
        }),
        mutation: useUpdateDepartmentParentMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail.data?.deptInfoResponse.parentDeptId).toBeNull())

    result.current.mutation.mutate({ deptId: 1, parentDeptId: 5 })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.detail.data?.deptInfoResponse.parentDeptId).toBe(5))
    expect(patchSpy).toHaveBeenCalledWith('5')
  })

  it('상위 부서 변경(F207)에서 parentDeptId를 생략(최상위로 이동)하면 쿼리 파라미터 자체가 전달되지 않는다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/departments/1`, () => HttpResponse.json(deptDetailFixtureWithParent(3))),
      http.patch(`${BASE_URL}/api/departments/1/parent`, ({ request }) => {
        const url = new URL(request.url)
        patchSpy(url.searchParams.has('parentDeptId'))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateDepartmentParentMutation(), { wrapper: Wrapper })

    result.current.mutate({ deptId: 1 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(patchSpy).toHaveBeenCalledWith(false)
  })

  it('부서장 종료(F209) 성공 시 departmentKeys.all이 invalidate되어 공석 정규화가 재조회에 반영된다', async () => {
    let hasLeader = true
    server.use(
      http.get(`${BASE_URL}/api/departments/1`, () =>
        HttpResponse.json({
          deptInfoResponse: { deptId: 1, deptCode: '001', deptName: '본사', isActive: true, parentDeptId: null },
          deptLeader: hasLeader
            ? { empId: 10, empNo: 'E010', empName: '김리더', extensionNo: null, email: 'leader@haruon.com', position: '팀장' }
            : { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
        }),
      ),
      http.patch(`${BASE_URL}/api/departments/1/leader/end`, () => {
        hasLeader = false
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { Wrapper } = createWrapper()

    const { result } = renderHook(
      () => ({
        detail: useQuery({
          queryKey: departmentKeys.detail(1),
          queryFn: async () => (await fetch(`${BASE_URL}/api/departments/1`)).json(),
        }),
        mutation: useEndDepartmentLeaderMutation(),
      }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.detail.data?.deptLeader.empId).toBe(10))

    result.current.mutation.mutate({ deptId: 1, endAt: '2026-07-07' })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    // 종료 후 재조회 응답은 all-null wire → normalizeDeptLeader가 null로 정규화하는 지점은
    // getDepartmentInfo(useDepartmentInfoQuery)의 책임이라 이 테스트는 raw fetch로 재조회
    // 여부만(empId 필드 갱신) 확인한다.
    await waitFor(() => expect(result.current.detail.data?.deptLeader.empId).toBeNull())
  })
})

function deptDetailFixtureWithParent(parentDeptId: number | null) {
  return {
    deptInfoResponse: { deptId: 1, deptCode: '001', deptName: '본사', isActive: true, parentDeptId },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}
