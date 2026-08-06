import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/features/auth/store/authStore'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { CategoryManagementTrigger } from './CategoryManagementTrigger'

function renderTrigger() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <CategoryManagementTrigger />
    </QueryClientProvider>,
  )
}

function emptyManagementPage() {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 10,
    numberOfElements: 0,
    first: true,
    last: true,
    empty: true,
  }
}

describe('CategoryManagementTrigger', () => {
  beforeEach(() => {
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () => HttpResponse.json(emptyManagementPage())),
    )
  })

  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('ADMIN이면 "관리" 버튼이 렌더된다', () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    renderTrigger()

    expect(screen.getByRole('button', { name: '관리' })).toBeInTheDocument()
  })

  it('EMPLOYEE 등 비-ADMIN이면 "관리" 버튼이 렌더되지 않는다', () => {
    useAuthStore.setState({ roles: ['EMPLOYEE'] })
    renderTrigger()

    expect(screen.queryByRole('button', { name: '관리' })).not.toBeInTheDocument()
  })

  it('ADMIN이 버튼을 클릭하면 카테고리 관리 모달이 열린다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    const user = userEvent.setup()
    renderTrigger()

    await user.click(screen.getByRole('button', { name: '관리' }))

    expect(await screen.findByText('카테고리 관리')).toBeInTheDocument()
  })
})
