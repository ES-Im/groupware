import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/mocks/server'
import { EmployeeDetailPage } from './EmployeeDetailPage'

/**
 * EmployeeDetailPage(타 사원 상세, F002) 관리 섹션 역할별 렌더 회귀 테스트(adapt-ui 신규 → 2차 수정).
 * EmpManagementSection은 canManage(=canManageAsHr || canManageAsDeptManager)일 때만 렌더되고,
 * canManageAsHr가 canManageAsDeptManager보다 우선해 어느 다이얼로그 폼이 열리는지를 결정한다.
 *
 * 2차 수정: 우측 컬럼에 EmpRecordsWidget(근태·휴가·출장 조회)이 추가되어
 * canViewRecordsBoard(=hasRequiredRole(roles,'DEPT_MANAGER'), canManage와는 별도 값 — HR 단독은
 * false)로 게이팅된다. 렌더되면 부서 단위 3개 엔드포인트(DEPT_ATTENDANCE_MONTHLY/
 * DEPT_LEAVE_REQUEST_HISTORY/DEPT_BUSINESS_TRIP_REQUEST_HISTORY)를 size=100으로 호출하므로,
 * canViewRecordsBoard가 true인 테스트는 목이 있어야 onUnhandledRequest:'error'에 걸리지 않는다.
 */

const empDetailFixture = {
  empBasicInfo: {
    empId: 7,
    empNo: '202607007',
    name: '홍길동',
    loginId: 'hong01',
    email: 'hong@haruon.com',
    extensionNo: '101-0001',
  },
  activeFiles: [] as unknown[],
  currentDepts: [
    {
      deptId: 1,
      deptCode: '001',
      deptName: '본사',
      positionName: '사원',
      isPrimary: true,
      startAt: '2024-01-01T00:00:00',
      endAt: null,
    },
  ],
}

function managementPageFixture() {
  return {
    content: [
      {
        empId: 7,
        empNo: '202607007',
        empName: '홍길동',
        loginId: 'hong01',
        email: 'hong@haruon.com',
        extensionNo: '101-0001',
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
}

function emptyPage() {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 100,
    numberOfElements: 0,
    first: true,
    last: true,
    empty: true,
  }
}

/** EmpRecordsWidget이 조회하는 부서 단위 3개 엔드포인트(deptId=1) 목. 빈 목록이면 충분하다. */
function mockRecordsWidgetDefaults() {
  server.use(
    http.get(`${BASE_URL}/api/employees/attendances/1/monthly`, () => HttpResponse.json(emptyPage())),
    http.get(`${BASE_URL}/api/leaves/departments/1/request-history`, () => HttpResponse.json(emptyPage())),
    http.get(`${BASE_URL}/api/business-trips/departments/1/request-history`, () =>
      HttpResponse.json(emptyPage()),
    ),
  )
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/employees/7']}>
        <Routes>
          <Route path="/employees/:empId" element={<EmployeeDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EmployeeDetailPage - 사원 관리 섹션 역할별 렌더', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('canManage가 false인 뷰어(EMPLOYEE만)는 "사원 관리" 섹션 자체가 렌더되지 않는다', async () => {
    useAuthStore.setState({ roles: ['EMPLOYEE'] })
    server.use(http.get(`${BASE_URL}/api/employees/7`, () => HttpResponse.json(empDetailFixture)))

    renderPage()

    expect(await screen.findByText('사번 202607007')).toBeInTheDocument()
    expect(screen.queryByText('사원 관리')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '정보 수정' })).not.toBeInTheDocument()
  })

  it('HR 역할 뷰어는 관리 섹션이 렌더되고 HrManagedInfoDialog용 폼 필드가 나타난다', async () => {
    useAuthStore.setState({ roles: ['HR'] })
    server.use(
      http.get(`${BASE_URL}/api/employees/7`, () => HttpResponse.json(empDetailFixture)),
      http.get(`${BASE_URL}/api/employees`, () => HttpResponse.json(managementPageFixture())),
    )
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findByText('사원 관리')).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: '정보 수정' }))

    expect(screen.getByRole('heading', { name: '사원 정보 수정 (HR)' })).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toBeInTheDocument()
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument()
  })

  it('DEPT_MANAGER 역할 뷰어(HR 아님)는 DeptManagedInfoDialog용 폼 필드가 나타난다', async () => {
    useAuthStore.setState({ roles: ['DEPT_MANAGER'] })
    server.use(
      http.get(`${BASE_URL}/api/employees/7`, () => HttpResponse.json(empDetailFixture)),
      http.get(`${BASE_URL}/api/employees`, () => HttpResponse.json(managementPageFixture())),
    )
    mockRecordsWidgetDefaults()
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findByText('사원 관리')).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: '정보 수정' }))

    expect(screen.getByRole('heading', { name: '사원 정보 수정 (부서매니저)' })).toBeInTheDocument()
    expect(screen.queryByLabelText('이름')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('새 비밀번호')).not.toBeInTheDocument()
  })
})

describe('EmployeeDetailPage - canViewRecordsBoard(근태·휴가·출장 조회) 게이팅', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('DEPT_MANAGER 역할 뷰어는 "근태·휴가·출장 조회" 카드가 렌더된다', async () => {
    useAuthStore.setState({ roles: ['DEPT_MANAGER'] })
    server.use(http.get(`${BASE_URL}/api/employees/7`, () => HttpResponse.json(empDetailFixture)))
    mockRecordsWidgetDefaults()

    renderPage()

    expect(await screen.findByText('근태·휴가·출장 조회')).toBeInTheDocument()
  })

  it('ADMIN 역할 뷰어는(RoleHierarchy상 DEPT_MANAGER 포함) "근태·휴가·출장 조회" 카드가 렌더된다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(
      http.get(`${BASE_URL}/api/employees/7`, () => HttpResponse.json(empDetailFixture)),
      http.get(`${BASE_URL}/api/employees`, () => HttpResponse.json(managementPageFixture())),
    )
    mockRecordsWidgetDefaults()

    renderPage()

    expect(await screen.findByText('근태·휴가·출장 조회')).toBeInTheDocument()
  })

  it('HR 단독 역할 뷰어는 "사원 관리" 섹션은 보이지만 "근태·휴가·출장 조회" 카드는 보이지 않는다', async () => {
    useAuthStore.setState({ roles: ['HR'] })
    server.use(
      http.get(`${BASE_URL}/api/employees/7`, () => HttpResponse.json(empDetailFixture)),
      http.get(`${BASE_URL}/api/employees`, () => HttpResponse.json(managementPageFixture())),
    )

    renderPage()

    expect(await screen.findByText('사원 관리')).toBeInTheDocument()
    expect(screen.queryByText('근태·휴가·출장 조회')).not.toBeInTheDocument()
  })

  it('EMPLOYEE 단독 역할 뷰어는 "사원 관리"와 "근태·휴가·출장 조회" 카드 모두 보이지 않는다', async () => {
    useAuthStore.setState({ roles: ['EMPLOYEE'] })
    server.use(http.get(`${BASE_URL}/api/employees/7`, () => HttpResponse.json(empDetailFixture)))

    renderPage()

    expect(await screen.findByText('사번 202607007')).toBeInTheDocument()
    expect(screen.queryByText('사원 관리')).not.toBeInTheDocument()
    expect(screen.queryByText('근태·휴가·출장 조회')).not.toBeInTheDocument()
  })
})
