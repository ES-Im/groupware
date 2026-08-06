import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { BoardListPage } from './BoardListPage'

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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '공지' })).toBeInTheDocument()
    })
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
    expect(screen.queryByText('게시글이 없습니다.')).not.toBeInTheDocument()

    boardListDeferred.resolve(HttpResponse.json(pageOf([])))

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
    expect(requests[0]).toMatchObject({ categoryId: '1' })

    await user.click(screen.getByRole('button', { name: '다음 페이지' }))
    await waitFor(() => expect(requests.some((r) => r.categoryId === '1' && r.page === '1')).toBe(true))

    await user.click(screen.getByRole('button', { name: '자유' }))
    await waitFor(() =>
      expect(
        requests.some((r) => r.categoryId === '2' && (r.page === null || r.page === '0')),
      ).toBe(true),
    )
  })
})
