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

/**
 * BoardDraftsPage(F308/F306, ROADMAP T15.1) 회귀 방지 테스트.
 *
 * 방금 발견된 회귀 위험 지점(스타일링 리팩터 직후):
 * - 임시저장 목록 조회 실패가 "임시저장한 글이 없습니다."(빈 목록)와 구분되는 전용 문구로
 *   표시되는지(BoardDraftsPage.tsx L88-94 주석의 "빈 배열 폴백으로 실패가 숨겨지지 않아야
 *   한다" 계약).
 * - 발행 버튼이 401(ROLE_002, PermissionDeniedException — 소유권 위반)을 받았을 때
 *   handleApiError의 토큰무효 분기(로그인 리다이렉트)를 타지 않고, `normalizeApiError` +
 *   `toast.error`로 직접 에러 메시지만 노출하는지(BoardDraftsPage.tsx L64-69 주석 참조).
 *
 * 참고(회귀 시나리오 위치 정정): 과제 설명은 이 401(ROLE_002) 우회 처리를 "BoardCreatePage의
 * 발행 액션"으로 서술하지만, 실제 소스상 이 특수 처리는 BoardCreatePage.submit()(registerBoard,
 * publishedAt 포함 등록)이 아니라 여기 BoardDraftsPage.handlePublish()(publishBoard,
 * PATCH /publishment)에 구현되어 있다 — BoardCreatePage.test.tsx 상단 주석에도 동일하게 정정해
 * 두었다. 아래 테스트가 실제 구현 위치를 검증한다.
 *
 * 추가로 axios 인터셉터(client.ts, T0.1)는 응답 코드가 ROLE_002이면 "요청이 어느 화면에서
 * 왔는지"와 무관하게 항상 재발급(POST /api/auth/reissue)을 먼저 시도한다(전송 계층 정책이라
 * 페이지 코드가 이를 끌 방법은 없다) — 이 테스트가 검증하는 "우회"는 그 재발급이 실패/소진된
 * 뒤 최종적으로 전파된 에러를 페이지가 로그인 리다이렉트 없이 토스트로만 보여주는지에 대한
 * 것이다.
 */

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
      // 소유권 위반은 403이 아니라 401(ROLE_002)로 온다(publishBoard.ts 주석 참조) — 재시도해도
      // 여전히 같은 소유권 문제이므로 재발급 후 재시도한 요청도 동일하게 401 ROLE_002를 반환한다.
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

    // client.ts(T0.1) 응답 인터셉터는 401 && ROLE_002를 만나면 항상 재발급을 먼저 시도한다
    // (재시도 1회 → 여전히 401이므로 config._retried 가드로 더 이상 재시도하지 않고 최종 reject).
    expect(reissueCallCount).toBe(1)
    expect(publishCallCount).toBe(2)

    // 로그인 화면으로 튕기지 않고 여전히 임시저장함에 머물러야 한다(handleApiError의
    // isTokenInvalid 분기를 타지 않는다는 증거).
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
