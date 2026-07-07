import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/mocks/server'
import { DepartmentMembersPage } from './DepartmentMembersPage'

/**
 * DepartmentMembersPage(F104, 본인 소속 바로가기) 회귀 방지 테스트.
 *
 * T9.2에서 이 페이지는 DepartmentDetailView에 canManageDept를 의도적으로 전달하지 않는다
 * (기본값 false) — ADMIN 계정이라도 이 조회 전용 화면에서는 "부서 관리" 섹션(활성화 토글·
 * 부서명 변경·상위부서 변경·부서장 지정/종료)이 노출되면 안 된다. 관리는 오직
 * DepartmentDetailPage(/departments/:deptId, T7.1)에서만 수행한다.
 */

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

    // 이 페이지는 useMeQuery → (deptId 확정 후) useDepartmentInfoQuery/useDepartmentMembersQuery로
    // 이어지는 2단 워터폴 조회 구조라, 전체 스위트를 병렬 실행할 때(다수 jsdom 환경 동시 구동으로
    // 자원 경합이 커짐) 기본 findBy 타임아웃(1000ms)을 넘기는 경우가 실측 확인됐다(로직 결함이
    // 아니라 단순 타이밍 여유 부족 — 플레이키 안정화 차원에서 타임아웃만 넉넉히 늘린다).
    expect(
      await screen.findByRole('heading', { name: '본사', level: 2 }, { timeout: 5000 }),
    ).toBeInTheDocument()
    // 관리 섹션 헤딩·액션 버튼 모두 부재해야 한다.
    expect(screen.queryByText('부서 관리')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '부서명 변경' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '활성화 전환' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '비활성화 전환' })).not.toBeInTheDocument()
  })
})
