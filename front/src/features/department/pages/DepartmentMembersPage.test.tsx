import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/mocks/server'
import { DepartmentMembersPage } from './DepartmentMembersPage'

const meFixture = {
  empBasicInfo: {
    empNo: '000000001',
    name: '홍길동',
    loginId: 'admin01',
    email: 'admin01@haruon.com',
    extensionNo: '101-0001',
  },
  activeFiles: [],
  currentDepts: [
    {
      deptId: 1,
      deptCode: '001',
      deptName: '본사',
      positionName: '팀장',
      isPrimary: true,
      startAt: '2024-01-01T00:00:00',
      endAt: null,
    },
  ],
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

const emptyMembersPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 10,
  first: true,
  last: true,
  numberOfElements: 0,
  empty: true,
}

const oneMemberPage = {
  content: [
    { empId: 5, empNo: 'E005', empName: '이영희', extensionNo: null, email: 'lee@haruon.com', position: '사원' },
  ],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 10,
  first: true,
  last: true,
  numberOfElements: 1,
  empty: false,
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DepartmentMembersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DepartmentMembersPage (F104) - 관리 섹션 회귀 방지', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('ADMIN 역할이어도 canManageDept를 전달하지 않아 부서 관리 섹션이 렌더되지 않는다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture)),
      http.get(`${BASE_URL}/api/departments/1`, () => HttpResponse.json(deptInfoFixture)),
      http.get(`${BASE_URL}/api/departments/1/members`, () => HttpResponse.json(emptyMembersPage)),
    )

    renderPage()

    expect(
      await screen.findByRole('heading', { name: '본사', level: 2 }, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(screen.queryByText('부서 관리')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '부서명 변경' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '활성화 전환' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '비활성화 전환' })).not.toBeInTheDocument()
  })

  it('순수 HR 역할(DEPT_MANAGER 미보유)도 canManageMembers가 true가 되어 "정보 수정" 버튼이 보인다', async () => {
    useAuthStore.setState({ roles: ['HR'] })
    const managementPage = {
      content: [
        {
          empId: 5,
          empNo: 'E005',
          empName: '이영희',
          loginId: 'lee01',
          email: 'lee@haruon.com',
          extensionNo: null,
          status: 'ACTIVE',
          hireAt: '2024-01-01',
          resignAt: null,
          belongings: [],
          systemRoleCodeName: ['EMPLOYEE'],
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 100,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture)),
      http.get(`${BASE_URL}/api/departments/1`, () => HttpResponse.json(deptInfoFixture)),
      http.get(`${BASE_URL}/api/departments/1/members`, () => HttpResponse.json(oneMemberPage)),
      http.get(`${BASE_URL}/api/employees`, () => HttpResponse.json(managementPage)),
    )

    renderPage()

    expect(
      await screen.findByRole('heading', { name: '본사', level: 2 }, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '정보 수정' })).toBeInTheDocument()
  })
})
