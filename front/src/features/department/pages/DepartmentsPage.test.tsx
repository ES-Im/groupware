import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/mocks/server'
import { DepartmentsPage } from './DepartmentsPage'

/**
 * DepartmentsPage("조직도", F201, T6.3) 검증.
 * - ADMIN 전용 "부서 등록" 버튼 게이팅.
 * - 검색/활성필터 변경 시 올바른 쿼리 파라미터로 재조회.
 */

function deptSummary(deptId: number, deptName: string, isActive: boolean) {
  return {
    deptInfoResponse: { deptId, deptCode: String(deptId).padStart(3, '0'), deptName, isActive, parentDeptId: null },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

function pageOf(items: ReturnType<typeof deptSummary>[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 10,
    first: true,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DepartmentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DepartmentsPage (F201) - ADMIN 게이팅', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('EMPLOYEE 역할이면 "부서 등록" 버튼이 보이지 않는다', async () => {
    useAuthStore.setState({ roles: ['EMPLOYEE'] })
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(pageOf([deptSummary(1, '본사', true)])),
      ),
    )

    renderPage()

    await screen.findByText('본사')
    expect(screen.queryByRole('button', { name: /부서 등록/ })).not.toBeInTheDocument()
  })

  it('ADMIN 역할이면 "부서 등록" 버튼이 보인다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(pageOf([deptSummary(1, '본사', true)])),
      ),
    )

    renderPage()

    await screen.findByText('본사')
    expect(screen.getByRole('button', { name: /부서 등록/ })).toBeInTheDocument()
  })
})

describe('DepartmentsPage (F201) - 검색/필터', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('활성상태 필터를 "비활성"으로 바꾸면 isActive=false로 재조회한다', async () => {
    const requestedIsActive: (string | null)[] = []
    server.use(
      http.get(`${BASE_URL}/api/departments`, ({ request }) => {
        const url = new URL(request.url)
        requestedIsActive.push(url.searchParams.get('isActive'))
        return HttpResponse.json(pageOf([deptSummary(1, '본사', true)]))
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('본사')
    await user.selectOptions(screen.getByLabelText('활성상태 필터'), '비활성')

    await waitFor(() => expect(requestedIsActive).toContain('false'))
  })

  it('부서명 검색 입력은 디바운스 후에만 keyword 쿼리 파라미터로 반영된다', async () => {
    const requestedKeywords: (string | null)[] = []
    server.use(
      http.get(`${BASE_URL}/api/departments`, ({ request }) => {
        const url = new URL(request.url)
        requestedKeywords.push(url.searchParams.get('keyword'))
        return HttpResponse.json(pageOf([deptSummary(1, '본사', true)]))
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('본사')
    await user.type(screen.getByLabelText('부서명 검색'), '개발')

    // 디바운스 유예 시간 전에는 아직 keyword 파라미터가 반영되지 않은 요청만 있어야 한다.
    expect(requestedKeywords.every((k) => k !== '개발')).toBe(true)

    await waitFor(() => expect(requestedKeywords).toContain('개발'))
  })
})
