import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/mocks/server'
import { BoardDetailPage } from './BoardDetailPage'

/**
 * BoardDetailPage(F303/F304/F310/F311/F306, ROADMAP T11.3/T11.4) 회귀 방지 테스트.
 *
 * 방금 발견된 회귀 위험 지점(스타일링 리팩터 직후):
 * - useBoardDetailQuery의 refetchOnWindowFocus:false 오버라이드가 유지되어, 창 포커스 복귀만으로
 *   viewCount 중복 증가(=BOARD_DETAIL 재조회)가 발생하지 않는지.
 * - not-found/유효하지 않은 boardId 분기, ADMIN 게이팅("수정" 버튼)이 유지되는지.
 */

function detailFixture(overrides: Record<string, unknown> = {}) {
  return {
    boardId: 1,
    categoryId: 1,
    empId: 100,
    authorName: '홍길동',
    title: '게시글 제목',
    content: '게시글 본문입니다.',
    publishedAt: '2026-07-01T09:30:00',
    modifiedAt: '2026-07-01T09:30:00',
    likeCount: 3,
    viewCount: 10,
    commentCount: 2,
    isDraft: false,
    isLiked: false,
    ...overrides,
  }
}

const emptyCommentsPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 10,
  numberOfElements: 0,
  first: true,
  last: true,
}

function renderDetail(boardId: string | number = 1) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/boards/${boardId}`]}>
        <Routes>
          <Route path="/boards/:boardId" element={<BoardDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('BoardDetailPage (F303) - 렌더/게이팅', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('상세 데이터를 렌더한다(제목/작성자/발행시각/지표) 및 EMPLOYEE는 "수정" 버튼을 보지 못한다', async () => {
    useAuthStore.setState({ roles: ['EMPLOYEE'] })
    server.use(
      http.get(`${BASE_URL}/api/boards/1`, () => HttpResponse.json(detailFixture())),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
      http.get(`${BASE_URL}/api/boards/1/comments`, () => HttpResponse.json(emptyCommentsPage)),
    )

    renderDetail(1)

    expect(await screen.findByText('게시글 제목')).toBeInTheDocument()
    expect(screen.getByText('게시글 본문입니다.')).toBeInTheDocument()
    expect(screen.getByText(/홍길동/)).toBeInTheDocument()
    expect(screen.getByText(/2026-07-01 09:30/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /수정/ })).not.toBeInTheDocument()
  })

  it('ADMIN 역할이면 "수정" 버튼(링크)이 보인다', async () => {
    useAuthStore.setState({ roles: ['ADMIN'] })
    server.use(
      http.get(`${BASE_URL}/api/boards/1`, () => HttpResponse.json(detailFixture())),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
      http.get(`${BASE_URL}/api/boards/1/comments`, () => HttpResponse.json(emptyCommentsPage)),
    )

    renderDetail(1)

    expect(await screen.findByText('게시글 제목')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /수정/ })).toBeInTheDocument()
  })

  it('유효하지 않은 boardId(숫자 아님)면 API 호출 없이 "게시글을 찾을 수 없습니다."를 즉시 렌더한다', async () => {
    // 이 케이스는 boardId가 undefined로 확정되어 모든 조회 훅이 enabled:false로 대기하므로
    // 어떤 MSW 핸들러도 등록하지 않는다(onUnhandledRequest:'error'가 실수로 호출됐다면 잡아준다).
    renderDetail('not-a-number')

    expect(await screen.findByText('게시글을 찾을 수 없습니다.')).toBeInTheDocument()
  })

  it('BOARD_DETAIL이 404를 반환하면 "게시글을 찾을 수 없습니다."를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/boards/999`, () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '게시글을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
      // filesQuery는 boardId 파싱과 무관하게 항상 활성화되므로(상세 에러 분기와 독립적) 함께 목을 건다.
      http.get(`${BASE_URL}/api/boards/999/files`, () => HttpResponse.json([])),
    )

    renderDetail(999)

    expect(await screen.findByText('게시글을 찾을 수 없습니다.')).toBeInTheDocument()
  })
})

describe('BoardDetailPage (F303) - refetchOnWindowFocus:false 회귀 방지', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('창 포커스가 돌아와도(visibilitychange) BOARD_DETAIL을 재조회하지 않는다(viewCount 중복 증가 방지)', async () => {
    let callCount = 0
    server.use(
      http.get(`${BASE_URL}/api/boards/1`, () => {
        callCount += 1
        return HttpResponse.json(detailFixture())
      }),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
      http.get(`${BASE_URL}/api/boards/1/comments`, () => HttpResponse.json(emptyCommentsPage)),
    )

    renderDetail(1)

    expect(await screen.findByText('게시글 제목')).toBeInTheDocument()
    expect(callCount).toBe(1)

    // TanStack Query의 focusManager는 window의 visibilitychange 이벤트로 재포커스를 감지한다
    // (@tanstack/query-core focusManager.ts). refetchOnWindowFocus:false가 없다면 staleTime
    // 기본값(0)과 맞물려 이 이벤트만으로 BOARD_DETAIL이 재조회되어 콜 카운트가 2로 늘어난다.
    window.dispatchEvent(new Event('visibilitychange'))

    // 재조회가 "일어나지 않는다"는 부정 단언이므로, 충분한 유예 뒤에도 콜 카운트가 그대로인지 확인한다.
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(callCount).toBe(1)
  })
})

describe('BoardDetailPage (F303) - 좋아요 토글', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
  })

  it('좋아요 버튼을 누르면 POST 후 하트가 활성화되고 좋아요 수가 1 증가한다', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${BASE_URL}/api/boards/1`, () =>
        HttpResponse.json(detailFixture({ likeCount: 3, isLiked: false })),
      ),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
      http.get(`${BASE_URL}/api/boards/1/comments`, () => HttpResponse.json(emptyCommentsPage)),
      http.post(`${BASE_URL}/api/boards/1/likes`, () => new HttpResponse(null, { status: 201 })),
    )

    renderDetail(1)

    const likeButton = await screen.findByRole('button', { name: /좋아요 3개/ })
    expect(likeButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(likeButton)

    // 성공 시 상세를 refetch하지 않고 캐시(likeCount/isLiked)만 낙관적으로 갱신한다
    // (BOARD_DETAIL 재조회 시 viewCount가 오르는 부작용 회피 — useBoardLikeMutation 주석).
    const likedButton = await screen.findByRole('button', { name: /좋아요 4개/ })
    expect(likedButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('이미 좋아요한 글에서 버튼을 누르면 DELETE 후 하트가 비활성화되고 좋아요 수가 1 감소한다', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${BASE_URL}/api/boards/1`, () =>
        HttpResponse.json(detailFixture({ likeCount: 3, isLiked: true })),
      ),
      http.get(`${BASE_URL}/api/boards/1/files`, () => HttpResponse.json([])),
      http.get(`${BASE_URL}/api/boards/1/comments`, () => HttpResponse.json(emptyCommentsPage)),
      http.delete(`${BASE_URL}/api/boards/1/likes`, () => new HttpResponse(null, { status: 204 })),
    )

    renderDetail(1)

    const likedButton = await screen.findByRole('button', { name: /좋아요 3개 \(누름\)/ })
    expect(likedButton).toHaveAttribute('aria-pressed', 'true')

    await user.click(likedButton)

    const unlikedButton = await screen.findByRole('button', { name: /좋아요 2개$/ })
    expect(unlikedButton).toHaveAttribute('aria-pressed', 'false')
  })
})
