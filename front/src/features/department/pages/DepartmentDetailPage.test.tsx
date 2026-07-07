import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/mocks/server'
import { DepartmentDetailPage } from './DepartmentDetailPage'

/**
 * DepartmentDetailPage(T7.1) 컨테이너 검증.
 *
 * 1) route param deptId 유효성 사전검증: 순수 10진 양의 정수만 허용하고, 0/음수/소수/지수/16진수/
 *    2진수 표기는 Number() 강제변환에 의존하지 않고 정규식으로 거부해 not-found로 즉시 분기해야 한다
 *    (쿼리 자체를 내보내지 않음 — 이 케이스는 MSW 핸들러를 등록하지 않아도 통과해야 한다).
 * 2) 멤버 조회만 실패해도 좌측 부서 기본정보 카드는 격리되어 그대로 남고, 표 영역만 인라인
 *    에러로 대체돼야 한다(DepartmentMembersPage에 실측된 "좌측 카드까지 통째로 깜빡임/대체" 결함을
 *    재현하지 않는지 확인).
 */

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
          <Route path="/departments/:deptId" element={<DepartmentDetailPage />} />
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

  it('멤버 목록 조회만 실패해도 좌측 부서 기본정보 카드는 사라지지 않고 표 영역만 인라인 에러로 대체된다', async () => {
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

    // 좌측 카드(부서 기본정보)는 정상 렌더돼야 한다.
    expect(await screen.findByRole('heading', { name: '본사', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('부서코드 001')).toBeInTheDocument()

    // 표 영역만 인라인 에러 문구로 대체된다.
    await waitFor(() =>
      expect(screen.getByText('부서 멤버 목록을 불러오지 못했습니다.')).toBeInTheDocument(),
    )
  })
})

describe('DepartmentDetailPage (T7.1) - ADMIN 관리 섹션 게이팅', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('ADMIN 역할이면 부서 관리 섹션(부서명 변경 등)이 렌더된다', async () => {
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
    expect(screen.getByRole('button', { name: '부서명 변경' })).toBeInTheDocument()
    // deptInfoFixture는 부서장 공석(all-null wire → null 정규화)이므로, 종료할 대상이 없는
    // "부서장 종료" 버튼은 관리 섹션이 열려도 렌더되지 않아야 한다(DepartmentDetailView 참조).
    expect(screen.queryByRole('button', { name: '부서장 종료' })).not.toBeInTheDocument()
  })

  it('ADMIN 역할이고 부서장이 지정되어 있으면 "부서장 종료" 버튼이 렌더된다', async () => {
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

  it('EMPLOYEE 역할이면 부서 관리 섹션이 렌더되지 않는다', async () => {
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
    expect(screen.queryByText('부서 관리')).not.toBeInTheDocument()
  })
})
