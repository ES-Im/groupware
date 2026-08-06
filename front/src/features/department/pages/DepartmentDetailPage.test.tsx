import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/mocks/server'
import { DepartmentDetailPage } from './DepartmentDetailPage'
import type { DepartmentExplorerOutletContext } from './DepartmentsExplorerLayout'

function TestExplorerLayout() {
  const context: DepartmentExplorerOutletContext = { departments: [] }
  return <Outlet context={context} />
}

const deptInfoFixture = {
  deptInfoResponse: {
    deptId: 1,
    deptCode: '001',
    deptName: '본사',
    isActive: true,
    parentDeptId: null,
  },
  deptLeader: {
    empId: null,
    empNo: null,
    empName: null,
    extensionNo: null,
    email: null,
    position: null,
  },
}

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/departments" element={<TestExplorerLayout />}>
            <Route path=":deptId" element={<DepartmentDetailPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DepartmentDetailPage (T7.1) - deptId 유효성 검사', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it.each([['0'], ['-5'], ['3.7'], ['1e3'], ['0x10'], ['0b101']])(
    '유효하지 않은 deptId(%s)는 네트워크 요청 없이 not-found로 분기한다',
    async (invalidDeptId) => {
      renderAt(`/departments/${invalidDeptId}`)

      expect(await screen.findByText('부서 정보를 찾을 수 없습니다.')).toBeInTheDocument()
    },
  )

  it.each([['1'], ['42']])(
    '정상 양의 정수 deptId(%s)는 상세 조회 요청을 내보낸다',
    async (validDeptId) => {
      server.use(
        http.get(`${BASE_URL}/api/departments/${validDeptId}`, () =>
          HttpResponse.json(deptInfoFixture),
        ),
        http.get(`${BASE_URL}/api/departments/${validDeptId}/members`, () =>
          HttpResponse.json({
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 10,
            first: true,
            last: true,
            numberOfElements: 0,
            empty: true,
          }),
        ),
      )

      renderAt(`/departments/${validDeptId}`)

      expect(await screen.findByRole('heading', { name: '본사', level: 2 })).toBeInTheDocument()
    },
  )
})

describe('DepartmentDetailPage (T7.1) - 멤버 조회 실패 격리', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('멤버 목록 조회만 실패해도 부서 관리 카드(hero+기본정보)는 사라지지 않고 그대로 유지된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments/1`, () => HttpResponse.json(deptInfoFixture)),
      http.get(`${BASE_URL}/api/departments/1/members`, () =>
        HttpResponse.json(
          { code: 'COMMON_001', name: 'INTERNAL_SERVER_ERROR', httpStatus: 500, message: '서버 오류' },
          { status: 500 },
        ),
      ),
    )

    renderAt('/departments/1')

    expect(await screen.findByRole('heading', { name: '본사', level: 2 })).toBeInTheDocument()
    expect(screen.getAllByText('001').length).toBeGreaterThan(0)
  })
})

describe('DepartmentDetailPage (T7.1) - ADMIN 관리 섹션 게이팅', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('ADMIN 역할이면 관리 섹션(부서명 변경 등)이 세로로 나열되어 렌더된다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(
      http.get(`${BASE_URL}/api/departments/1`, () => HttpResponse.json(deptInfoFixture)),
      http.get(`${BASE_URL}/api/departments/1/members`, () =>
        HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          first: true,
          last: true,
          numberOfElements: 0,
          empty: true,
        }),
      ),
    )

    renderAt('/departments/1')

    expect(await screen.findByText('부서 관리')).toBeInTheDocument()
    expect(screen.getByText('부서명 변경')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '부서장 종료' })).not.toBeInTheDocument()
  })

  it('ADMIN 역할이고 부서장이 지정되어 있으면 부서장 관리 섹션에 "부서장 종료" 버튼이 렌더된다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(
      http.get(`${BASE_URL}/api/departments/1`, () =>
        HttpResponse.json({
          deptInfoResponse: deptInfoFixture.deptInfoResponse,
          deptLeader: {
            empId: 10,
            empNo: 'E010',
            empName: '김리더',
            extensionNo: '101-0001',
            email: 'leader@haruon.com',
            position: '팀장',
          },
        }),
      ),
      http.get(`${BASE_URL}/api/departments/1/members`, () =>
        HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          first: true,
          last: true,
          numberOfElements: 0,
          empty: true,
        }),
      ),
    )

    renderAt('/departments/1')

    expect(await screen.findByText('부서 관리')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '부서장 종료' })).toBeInTheDocument()
  })

  it('EMPLOYEE 역할이면 관리 섹션이 렌더되지 않는다', async () => {
    useAuthStore.setState({ roles: ['EMPLOYEE'] })
    server.use(
      http.get(`${BASE_URL}/api/departments/1`, () => HttpResponse.json(deptInfoFixture)),
      http.get(`${BASE_URL}/api/departments/1/members`, () =>
        HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          first: true,
          last: true,
          numberOfElements: 0,
          empty: true,
        }),
      ),
    )

    renderAt('/departments/1')

    await screen.findByRole('heading', { name: '본사', level: 2 })
    expect(screen.queryByText('부서명 변경')).not.toBeInTheDocument()
  })
})
