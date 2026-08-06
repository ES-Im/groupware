import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { clearAccessToken, setAccessToken } from '@/shared/api/tokenStore'
import { server } from '@/test/mocks/server'
import { BoardDraftsPage } from './BoardDraftsPage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function draft(overrides: Record<string, unknown> = {}) {
  return { boardId: 1, title: '이어쓰던 초안', updatedAt: '2026-07-01T09:00:00', ...overrides }
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/boards/drafts']}>
        <Routes>
          <Route path="/boards/drafts" element={<BoardDraftsPage />} />
          <Route path="/boards/:boardId/edit" element={<div>게시글 수정 화면</div>} />
          <Route path="/login" element={<div>로그인 화면</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('BoardDraftsPage (F308) - 조회 실패/빈 목록 구분', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('임시저장 목록이 비어 있으면 "임시저장한 글이 없습니다."를 렌더한다', async () => {
    server.use(http.get(`${BASE_URL}/api/my/boards/drafts`, () => HttpResponse.json([])))

    renderPage()

    expect(await screen.findByText('임시저장한 글이 없습니다.')).toBeInTheDocument()
  })

  it('조회 실패 시 빈 배열로 폴백하지 않고 "임시저장 글 목록을 불러오지 못했습니다."를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/my/boards/drafts`, () =>
        HttpResponse.json(
          { code: 'COMMON_001', name: 'INTERNAL_SERVER_ERROR', httpStatus: 500, message: '서버 오류' },
          { status: 500 },
        ),
      ),
    )

    renderPage()

    expect(await screen.findByText('임시저장 글 목록을 불러오지 못했습니다.')).toBeInTheDocument()
    expect(screen.queryByText('임시저장한 글이 없습니다.')).not.toBeInTheDocument()
  })
})

describe('BoardDraftsPage (F308) - 목록/행 동작', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('행 제목을 클릭하면 해당 글의 수정 페이지로 이동한다', async () => {
    server.use(http.get(`${BASE_URL}/api/my/boards/drafts`, () => HttpResponse.json([draft()])))
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('이어쓰던 초안')
    await user.click(screen.getByText('이어쓰던 초안'))

    expect(await screen.findByText('게시글 수정 화면')).toBeInTheDocument()
  })
})

describe('BoardDraftsPage (F306) - 발행 버튼 401(ROLE_002) 소유권 위반 처리', () => {
  afterEach(() => {
    vi.clearAllMocks()
    clearAccessToken()
  })

  it('발행이 401(ROLE_002)로 실패해도 로그인 화면으로 리다이렉트하지 않고 에러 토스트만 뜬다', async () => {
    setAccessToken('valid-access-token')
    server.use(
      http.get(`${BASE_URL}/api/my/boards/drafts`, () => HttpResponse.json([draft()])),
    )
    let publishCallCount = 0
    let reissueCallCount = 0
    server.use(
      http.patch(`${BASE_URL}/api/boards/1/publishment`, () => {
        publishCallCount += 1
        return HttpResponse.json(
          { code: 'ROLE_002', name: 'PERMISSION_DENIED_EXCEPTION', httpStatus: 401, message: '본인이 작성한 게시글만 발행할 수 있습니다' },
          { status: 401 },
        )
      }),
      http.post(`${BASE_URL}/api/auth/reissue`, () => {
        reissueCallCount += 1
        return HttpResponse.json({ accessToken: 'reissued-access-token' })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('이어쓰던 초안')
    await user.click(screen.getByRole('button', { name: '발행' }))

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('본인이 작성한 게시글만 발행할 수 있습니다'),
    )

    expect(reissueCallCount).toBe(1)
    expect(publishCallCount).toBe(2)

    expect(screen.queryByText('로그인 화면')).not.toBeInTheDocument()
    expect(screen.getByText('내 임시저장 글')).toBeInTheDocument()
  })

  it('발행 성공 시 성공 토스트를 띄우고 목록/상세 캐시를 갱신한다', async () => {
    setAccessToken('valid-access-token')
    server.use(
      http.get(`${BASE_URL}/api/my/boards/drafts`, () => HttpResponse.json([draft()])),
      http.patch(`${BASE_URL}/api/boards/1/publishment`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('이어쓰던 초안')
    await user.click(screen.getByRole('button', { name: '발행' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('게시글을 발행했습니다'))
  })
})
