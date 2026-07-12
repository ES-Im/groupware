import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { BoardListPage } from './BoardListPage'

/**
 * BoardListPage(F301, ROADMAP T10.3) 회귀 방지 테스트.
 *
 * 방금 발견된 회귀 위험 지점(스타일링 리팩터 직후):
 * - 카테고리 로딩/목록 로딩 도중 "게시글이 없습니다" 오표시 플래시가 나오지 않는지
 *   (1프레임 깜빡임 방지 가드, BoardListPage.tsx L171-175 주석 참조).
 * - 페이지네이션 조작 시 목록이 올바른 page 파라미터로 갱신되는지.
 *
 * "게시글 작성"은 더 이상 상시 노출 카드가 아니라 좌측 "게시글 작성" 버튼으로 진입하는 별도 화면
 * 전환이다(사용자 요청 레이아웃 개편) — 기본 상태는 곧바로 "게시글 목록"이 렌더되므로, 이전
 * 라운드의 closeComposeCard 같은 사전 조작 없이 바로 목록 단언을 할 수 있다.
 */

function boardSummary(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    boardId: 1,
    boardTitle: '첫 번째 글',
    authorName: '홍길동',
    publishedAt: '2026-07-01T09:30:00',
    viewCount: 1,
    likeCount: 0,
    commentCount: 0,
    isFileAttached: false,
    ...overrides,
  }
}

function pageOf(content: ReturnType<typeof boardSummary>[], overrides: Record<string, unknown> = {}) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: content.length,
    first: true,
    last: true,
    ...overrides,
  }
}

/** resolve를 밖으로 노출해 언제든 응답을 확정지을 수 있는 지연 프라미스 헬퍼. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BoardListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('BoardListPage (F301) - 로딩 플래시 방지', () => {
  it('카테고리 조회 중에는 "불러오는 중..."만 보이고 "게시글이 없습니다"는 보이지 않는다', async () => {
    const categoriesDeferred = deferred<ReturnType<typeof pageOf>>()
    server.use(
      http.get(`${BASE_URL}/api/categories`, () => categoriesDeferred.promise as never),
    )

    renderPage()

    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument()
    expect(screen.queryByText('게시글이 없습니다.')).not.toBeInTheDocument()

    // 정리: 이 테스트에서는 응답을 확정하지 않고 종료해도 무방하지만(핸들러가 afterEach로
    // 리셋됨), 지연된 프라미스가 unhandled rejection 경고를 남기지 않도록 확정한다.
    categoriesDeferred.resolve(HttpResponse.json([{ categoryId: 1, categoryName: '공지', isVisible: true }]) as never)
  })

  it('카테고리 선택 직후 게시글 목록이 아직 로딩 중이면 "게시글이 없습니다"로 오표시하지 않는다', async () => {
    const boardListDeferred = deferred<Response>()
    server.use(
      http.get(`${BASE_URL}/api/categories`, () =>
        HttpResponse.json([{ categoryId: 1, categoryName: '공지', isVisible: true }]),
      ),
      http.get(`${BASE_URL}/api/categories/1/boards`, () => boardListDeferred.promise),
    )

    renderPage()

    // 카테고리 pill이 렌더된 뒤에도, 목록 조회가 아직 끝나지 않았으므로
    // "불러오는 중..."이 유지되어야 한다(빈 상태 오표시 금지).
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '공지' })).toBeInTheDocument()
    })
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
    expect(screen.queryByText('게시글이 없습니다.')).not.toBeInTheDocument()

    boardListDeferred.resolve(HttpResponse.json(pageOf([])))

    // 실제 응답이 빈 목록으로 도착한 뒤에는 정상적으로 빈 상태 문구가 보여야 한다.
    expect(await screen.findByText('게시글이 없습니다.')).toBeInTheDocument()
  })
})

describe('BoardListPage (F301) - 페이지네이션/카테고리 변경', () => {
  it('"다음" 클릭 시 page=1로 재조회하고, 카테고리를 바꾸면 새 categoryId + page=0으로 재조회한다', async () => {
    const requests: Array<{ categoryId: string; page: string | null }> = []
    server.use(
      http.get(`${BASE_URL}/api/categories`, () =>
        HttpResponse.json([
          { categoryId: 1, categoryName: '공지', isVisible: true },
          { categoryId: 2, categoryName: '자유', isVisible: true },
        ]),
      ),
      http.get(`${BASE_URL}/api/categories/:categoryId/boards`, ({ request, params }) => {
        const url = new URL(request.url)
        requests.push({
          categoryId: params.categoryId as string,
          page: url.searchParams.get('page'),
        })
        return HttpResponse.json(
          pageOf([boardSummary({ boardId: 1, boardTitle: '글 A' })], {
            totalPages: 2,
            first: url.searchParams.get('page') !== '1',
            last: url.searchParams.get('page') === '1',
          }),
        )
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('글 A')
    // 초기 요청: 첫 카테고리(1) + page 파라미터 미지정(=0 취급).
    expect(requests[0]).toMatchObject({ categoryId: '1' })

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.categoryId === '1' && r.page === '1')).toBe(true))

    await user.click(screen.getByRole('button', { name: '자유' }))
    // 카테고리 변경 시 새 categoryId(2)로 재조회하며 page는 0으로 리셋되어야 한다(page 파라미터 생략 또는 '0').
    await waitFor(() =>
      expect(
        requests.some((r) => r.categoryId === '2' && (r.page === null || r.page === '0')),
      ).toBe(true),
    )
  })
})
