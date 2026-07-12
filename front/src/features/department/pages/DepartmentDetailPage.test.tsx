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

/**
 * DepartmentDetailPage(T7.1 → 조직도 탐색형 재구성) 컨테이너 검증.
 *
 * 1) route param deptId 유효성 사전검증: 순수 10진 양의 정수만 허용하고, 0/음수/소수/지수/16진수/
 *    2진수 표기는 Number() 강제변환에 의존하지 않고 정규식으로 거부해 not-found로 즉시 분기해야 한다
 *    (쿼리 자체를 내보내지 않음 — 이 케이스는 MSW 핸들러를 등록하지 않아도 통과해야 한다).
 * 2) 멤버 조회만 실패해도 병합된 부서 관리 카드(hero+기본정보)는 격리되어 그대로 남아야 한다.
 *    멤버 표는 제거됐고 멤버 조회는 부서장 후보·현재 인원 산출 용도로만 남아, 실패는 토스트로만
 *    알리고 상단 카드는 deptInfoQuery 기준으로 정상 렌더된다.
 *
 * DepartmentDetailPage는 이제 DepartmentsExplorerLayout(부모 레이아웃 라우트)의 자식이라
 * useOutletContext로 onOpenRegisterDialog를 전달받는다. 실제 라우터 트리(app/router.tsx)와
 * 동일하게 부모 route(element가 Outlet을 렌더)를 두고 그 자식으로 :deptId를 중첩해야 컨텍스트
 * 없이 렌더되어 크래시하는 것을 막을 수 있다.
 */

/** 실제 DepartmentsExplorerLayout 대신, outlet context 계약만 재현하는 테스트 전용 레이아웃. */
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
      // 핸들러를 등록하지 않는다 — onUnhandledRequest: 'error' 정책상, 만약 컴포넌트가 실제로
      // 요청을 내보낸다면 이 테스트는 처리되지 않은 요청 에러로 실패해 회귀를 드러낸다.
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

    // 병합된 부서 관리 카드는 deptInfoQuery 기준으로 정상 렌더된다(부서코드는 hero 배지 + 기본정보
    // 그리드 두 군데에 별도 텍스트 노드로 렌더되므로 getAllByText로 확인한다). 멤버 조회 실패는
    // 토스트로만 알리므로 이 카드를 대체하지 않는다.
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

    // 병합 카드 타이틀은 "부서 관리"로 바뀌었다.
    expect(await screen.findByText('부서 관리')).toBeInTheDocument()
    // 관리 흐름은 이제 Tabs가 아니라 세로로 나열된 섹션 소제목으로 노출된다.
    expect(screen.getByText('부서명 변경')).toBeInTheDocument()
    // deptInfoFixture는 부서장 공석(all-null wire → null 정규화)이므로 부서장 관리 섹션에는
    // 지정 폼만 보이고 "부서장 종료" 제출 버튼은 렌더되지 않아야 한다.
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

    // 모든 관리 섹션이 동시에 노출되므로 탭 전환 없이 종료 버튼이 바로 보인다.
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

    // 병합 카드의 hero+기본정보는 보이지만, ADMIN 전용 관리 섹션(부서명 변경 등)은 렌더되지 않는다.
    await screen.findByRole('heading', { name: '본사', level: 2 })
    expect(screen.queryByText('부서명 변경')).not.toBeInTheDocument()
  })
})
